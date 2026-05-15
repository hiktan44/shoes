import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// OAuth (Google vb.) dönüş noktası — GoTrue buraya ?code=... ile yönlendirir.
// Kod → session takası yapılır, cookie'ler set edilir, ana sayfaya gidilir.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';
  const errorDesc = url.searchParams.get('error_description');

  // Proxy arkasında doğru public origin'i bul (Traefik/Coolify)
  const fwdHost = request.headers.get('x-forwarded-host');
  const fwdProto = request.headers.get('x-forwarded-proto') || 'https';
  const base = fwdHost ? `${fwdProto}://${fwdHost}` : url.origin;

  if (errorDesc) {
    return NextResponse.redirect(`${base}/login?error=${encodeURIComponent(errorDesc)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${next.startsWith('/') ? next : '/'}`);
    }
    return NextResponse.redirect(`${base}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${base}/login?error=${encodeURIComponent('Kod alınamadı')}`);
}
