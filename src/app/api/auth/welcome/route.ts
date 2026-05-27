import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcome } from '@/lib/email';
import { rateLimit } from '@/lib/rateLimit';

export const maxDuration = 26;

// Kayıt sonrası login sayfasından çağrılır — yeni kullanıcıya hoş geldin maili.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ ok: false }, { status: 401 });
  if (!rateLimit(`welcome:${user.id}`, 3, 3600_000).ok) return NextResponse.json({ ok: true, skipped: true });
  const sent = await sendWelcome(user.email);
  return NextResponse.json({ ok: true, sent });
}
