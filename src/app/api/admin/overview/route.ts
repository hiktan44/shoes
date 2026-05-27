import { NextResponse } from 'next/server';
import { getAdminUser, getStats, listUsers, recentTransactions, getDailySeries } from '@/lib/admin';

export const maxDuration = 26;

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const q = sp.get('q')?.trim() || '';
  const from = sp.get('from') || undefined;
  const to = sp.get('to') || undefined;
  const role = sp.get('role') || undefined;
  const status = sp.get('status') || undefined;
  const sort = sp.get('sort') || undefined;
  try {
    const [stats, users, transactions, series] = await Promise.all([
      getStats(),
      listUsers(q, { role, status, sort }),
      recentTransactions(),
      getDailySeries(30, from, to),
    ]);
    return NextResponse.json({ stats, users, transactions, series, me: admin.email });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
