// Kredi sistemi — self-host Supabase'de postgres-meta (/pg/query) kanalı üzerinden
// SECURITY DEFINER fonksiyonları (deduct_credits / add_credits) çağırır.
// Sunucu tarafıdır; SUPABASE_SERVICE_ROLE_KEY asla istemciye sızmaz.

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// fasheone.com modeline uyarlanmış kredi maliyetleri
export const CREDIT_COSTS = {
  studio: 1, // Fotoğraf / stüdyo çekimi (tek Kie çağrısı)
  design: 2, // AI tasarım (2 aşamalı üretim)
  pose: 1, // Çoklu pozda her poz başına
  album: 2, // Albüm / kolaj (COLLAGE)
  retouch: 1, // Rötuş (PIXSHOP)
  analyze: 1, // E-ticaret analizi
} as const;
export type CreditReason = keyof typeof CREDIT_COSTS;

// Kredi paketleri (fasheone.com ile birebir) — fiyat TRY
export const CREDIT_PACKAGES = {
  SMALL: { id: 'SMALL', label: 'Başlangıç', credits: 100, priceTRY: 999, priceEUR: 19.9 },
  MEDIUM: { id: 'MEDIUM', label: 'Standart', credits: 250, priceTRY: 2399, priceEUR: 48.9, popular: true },
  LARGE: { id: 'LARGE', label: 'Profesyonel', credits: 500, priceTRY: 4499, priceEUR: 89.9 },
} as const;
export type PackageId = keyof typeof CREDIT_PACKAGES;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function pgQuery<T = unknown>(sql: string): Promise<T> {
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

export async function getBalance(userId: string): Promise<number> {
  if (!UUID_RE.test(userId)) throw new Error('invalid user id');
  const rows = await pgQuery<{ credits: number }[]>(
    `select credits from public.profiles where id = '${userId}'::uuid;`
  );
  return rows[0]?.credits ?? 0;
}

type DeductResult = { ok: boolean; balance?: number; error?: string };

// Atomik düş — yetersizse {ok:false, error:'insufficient'}
export async function deductCredits(
  userId: string,
  reason: CreditReason,
  multiplier = 1
): Promise<DeductResult> {
  if (!UUID_RE.test(userId)) return { ok: false, error: 'invalid_user' };
  const amount = CREDIT_COSTS[reason] * Math.max(1, Math.floor(multiplier));
  const rows = await pgQuery<{ deduct_credits: DeductResult }[]>(
    `select public.deduct_credits('${userId}'::uuid, ${amount}, '${reason}') as deduct_credits;`
  );
  return rows[0]?.deduct_credits ?? { ok: false, error: 'rpc_failed' };
}

// Satın alma sonrası kredi ekle (idempotent — aynı provider_ref tekrar işlenmez)
// Kie task oluşturma başarısız olursa düşülen krediyi geri ver (best-effort)
export async function refundCredits(
  userId: string,
  reason: CreditReason,
  multiplier = 1
): Promise<void> {
  if (!UUID_RE.test(userId)) return;
  const amount = CREDIT_COSTS[reason] * Math.max(1, Math.floor(multiplier));
  try {
    await pgQuery(
      `update public.profiles set credits = credits + ${amount}, updated_at = now() where id = '${userId}'::uuid;` +
      `insert into public.transactions (user_id, type, credits, reason, status) values ('${userId}'::uuid, 'refund', ${amount}, '${reason}_refund', 'completed');`
    );
  } catch {
    // sessiz geç — iade başarısız olsa bile üretim hatası kullanıcıya döner
  }
}

export async function addCredits(params: {
  userId: string;
  credits: number;
  amountPaid: number;
  reason: string;
  provider: string;
  providerRef: string;
}): Promise<{ ok: boolean; balance?: number; duplicate?: boolean }> {
  const { userId, credits, amountPaid, reason, provider, providerRef } = params;
  if (!UUID_RE.test(userId)) return { ok: false };
  const safeReason = reason.replace(/'/g, '');
  const safeProvider = provider.replace(/'/g, '');
  const safeRef = providerRef.replace(/'/g, '');
  const rows = await pgQuery<{ add_credits: { ok: boolean; balance?: number; duplicate?: boolean } }[]>(
    `select public.add_credits('${userId}'::uuid, ${Math.floor(credits)}, ${Number(amountPaid)}, '${safeReason}', '${safeProvider}', '${safeRef}') as add_credits;`
  );
  return rows[0]?.add_credits ?? { ok: false };
}
