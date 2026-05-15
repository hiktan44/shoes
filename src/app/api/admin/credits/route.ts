import { NextResponse } from 'next/server';
import { getAdminUser, adjustCredits } from '@/lib/admin';

export const maxDuration = 26;

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  try {
    const { userId, delta, note } = (await request.json()) as { userId: string; delta: number; note?: string };
    if (!userId || typeof delta !== 'number' || !Number.isFinite(delta)) {
      return NextResponse.json({ error: 'userId ve delta gerekli' }, { status: 400 });
    }
    await adjustCredits(userId, delta, note || `by ${admin.email}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
