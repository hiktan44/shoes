import { NextResponse } from 'next/server';
import { getDailySummary, getAdminEmails } from '@/lib/admin';
import { sendDailySummary } from '@/lib/email';

export const maxDuration = 60;

// Günlük özet e-postası — harici cron / Coolify scheduled task ile tetiklenir.
// Güvenlik: ?key=CRON_SECRET zorunlu.
async function run(key: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  const s = await getDailySummary();
  // Alıcılar: ADMIN_EMAILS env + DB'deki admin'ler (benzersiz)
  const envEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  const dbEmails = await getAdminEmails().catch(() => []);
  const recipients = Array.from(new Set([...envEmails, ...dbEmails].map(e => e.toLowerCase())));
  if (recipients.length === 0) return NextResponse.json({ ok: true, sent: 0, note: 'alıcı yok' });

  const date = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  const payload = {
    date,
    newUsers: Number(s.new_users || 0),
    revenueToday: Number(s.revenue_today || 0),
    ordersToday: Number(s.orders_today || 0),
    generationsToday: Number(s.generations_today || 0),
    totalUsers: Number(s.total_users || 0),
    totalRevenue: Number(s.total_revenue || 0),
    totalCredits: Number(s.total_credits || 0),
  };
  let sent = 0;
  for (const to of recipients) { if (await sendDailySummary(to, payload)) sent++; }
  return NextResponse.json({ ok: true, sent, recipients: recipients.length });
}

export async function GET(request: Request) {
  return run(new URL(request.url).searchParams.get('key'));
}
export async function POST(request: Request) {
  return run(new URL(request.url).searchParams.get('key'));
}
