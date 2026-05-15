import { NextResponse } from 'next/server';
import { getAdminUser, setAdmin } from '@/lib/admin';

export const maxDuration = 26;

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  try {
    const { userId, isAdmin } = (await request.json()) as { userId: string; isAdmin: boolean };
    if (!userId || typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: 'userId ve isAdmin gerekli' }, { status: 400 });
    }
    await setAdmin(userId, isAdmin);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
