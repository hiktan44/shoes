import { NextResponse } from 'next/server';
import { getAdminUser, getStats, listUsers, recentTransactions, getDailySeries } from '@/lib/admin';

export const maxDuration = 26;

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  try {
    const [stats, users, transactions, series] = await Promise.all([
      getStats(),
      listUsers(q),
      recentTransactions(),
      getDailySeries(30),
    ]);
    return NextResponse.json({ stats, users, transactions, series, me: admin.email });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
