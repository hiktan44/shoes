import { NextResponse } from 'next/server';
import { getAdminUser, getUserDetail } from '@/lib/admin';
import { rateLimit } from '@/lib/rateLimit';

export const maxDuration = 26;

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  if (!rateLimit(`admin:${admin.id}`, 120, 60_000).ok)
    return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 });

  const id = new URL(request.url).searchParams.get('id')?.trim() || '';
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  try {
    const detail = await getUserDetail(id);
    if (!detail.profile) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
