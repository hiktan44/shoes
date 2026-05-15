// Admin yetki kontrolü + admin veri sorguları (server-only, /pg/query kanalı)
import { createClient } from '@/lib/supabase/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function pgQuery<T = unknown>(sql: string): Promise<T> {
  const res = await fetch(`${SB_URL}/pg/query`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
    cache: 'no-store',
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`pg/query ${res.status}: ${txt.slice(0, 200)}`);
  return JSON.parse(txt) as T;
}

const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export type AdminUser = { id: string; email: string };

// İstek yapan kullanıcı admin mi? Değilse null döner.
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const email = (user.email || '').toLowerCase();

  if (email && adminEmails.includes(email)) return { id: user.id, email };

  // profiles.is_admin kontrolü (env'de olmasa da DB'den admin yapılmış olabilir)
  if (UUID_RE.test(user.id)) {
    const rows = await pgQuery<{ is_admin: boolean }[]>(
      `select is_admin from public.profiles where id = '${user.id}'::uuid;`
    );
    if (rows[0]?.is_admin) return { id: user.id, email };
  }
  return null;
}

function esc(s: string) {
  return s.replace(/'/g, "''");
}

export async function getStats() {
  const rows = await pgQuery<Record<string, string | number>[]>(`
    select
      (select count(*) from auth.users) as total_users,
      (select count(*) from public.profiles where is_admin) as admin_users,
      (select coalesce(sum(credits),0) from public.profiles) as total_credits,
      (select count(*) from public.generations) as total_generations,
      (select count(*) from public.generations where created_at >= date_trunc('day', now())) as today_generations,
      (select coalesce(sum(amount),0) from public.transactions where type='purchase' and status='completed') as total_revenue,
      (select coalesce(sum(amount),0) from public.transactions where type='purchase' and status='completed' and created_at >= date_trunc('day', now())) as today_revenue,
      (select count(*) from public.transactions where type='purchase' and status='completed') as total_orders;
  `);
  return rows[0] ?? {};
}

export async function listUsers(q: string, limit = 50) {
  const where = q ? `where lower(u.email) like '%${esc(q.toLowerCase())}%'` : '';
  return pgQuery(`
    select
      u.id,
      u.email,
      u.created_at as registered_at,
      u.last_sign_in_at,
      coalesce(p.credits,0) as credits,
      coalesce(p.is_admin,false) as is_admin,
      (select count(*) from public.generations g where g.user_id = u.id) as total_generations,
      (select count(*) from public.generations g where g.user_id = u.id and g.created_at >= date_trunc('day', now())) as today_generations,
      (select coalesce(-sum(t.credits),0) from public.transactions t where t.user_id = u.id and t.type='usage') as credits_used,
      (select coalesce(sum(t.amount),0) from public.transactions t where t.user_id = u.id and t.type='purchase' and t.status='completed') as total_paid,
      (select max(g.created_at) from public.generations g where g.user_id = u.id) as last_activity
    from auth.users u
    left join public.profiles p on p.id = u.id
    ${where}
    order by u.created_at desc
    limit ${Math.min(200, Math.max(1, limit))};
  `);
}

export async function recentTransactions(limit = 30) {
  return pgQuery(`
    select t.id, u.email, t.type, t.credits, t.amount, t.reason, t.provider, t.status, t.created_at
    from public.transactions t
    join auth.users u on u.id = t.user_id
    order by t.created_at desc
    limit ${Math.min(100, Math.max(1, limit))};
  `);
}

export async function adjustCredits(userId: string, delta: number, note: string) {
  if (!UUID_RE.test(userId)) throw new Error('invalid user');
  const d = Math.trunc(delta);
  if (d === 0) return;
  const reason = `admin_${d > 0 ? 'grant' : 'deduct'}:${esc(note).slice(0, 60)}`;
  await pgQuery(`
    insert into public.profiles (id, credits) values ('${userId}'::uuid, ${10 + d})
      on conflict (id) do update set credits = greatest(0, public.profiles.credits + (${d})), updated_at = now();
    insert into public.transactions (user_id, type, credits, reason, status)
      values ('${userId}'::uuid, '${d > 0 ? 'bonus' : 'usage'}', ${d}, '${reason}', 'completed');
  `);
}

export async function setAdmin(userId: string, makeAdmin: boolean) {
  if (!UUID_RE.test(userId)) throw new Error('invalid user');
  await pgQuery(
    `insert into public.profiles (id, is_admin) values ('${userId}'::uuid, ${makeAdmin})
       on conflict (id) do update set is_admin = ${makeAdmin}, updated_at = now();`
  );
}
