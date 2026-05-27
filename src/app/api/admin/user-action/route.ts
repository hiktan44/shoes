import { NextResponse } from 'next/server';
import { getAdminUser, setSuspended, deleteUser } from '@/lib/admin';
import { rateLimit } from '@/lib/rateLimit';

export const maxDuration = 26;

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  if (!rateLimit(`admin:${admin.id}`, 60, 60_000).ok)
    return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 });

  try {
    const { userId, action, value } = (await request.json()) as { userId: string; action: 'suspend' | 'delete'; value?: boolean };
    if (!userId || !action) return NextResponse.json({ error: 'userId ve action gerekli' }, { status: 400 });
    if (userId === admin.id) return NextResponse.json({ error: 'Kendinizi askıya alamaz/silemezsiniz' }, { status: 400 });

    if (action === 'suspend') {
      await setSuspended(userId, value !== false);
    } else if (action === 'delete') {
      await deleteUser(userId);
    } else {
      return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
