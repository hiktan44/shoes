"use client";
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  // Open redirect koruması: yalnızca site-içi path'e izin ver ('//' ile başlayan protocol-relative dahil reddet)
  const rawNext = params.get('next') || '/studio';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/studio';

  const [mode, setMode] = useState<'signin' | 'signup'>(() => params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(params.get('error'));
  const [info, setInfo] = useState<string | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setGoogleLoading(false);
      setError(error.message);
    }
    // başarılıysa tarayıcı Google'a yönlenir
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { setError(error.message); return; }
      router.push(next);
      router.refresh();
      return;
    }

    // SIGNUP
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      // Rate limit'e özel, anlaşılır mesaj
      if (/rate limit/i.test(error.message)) {
        setError('E-posta gönderim limiti doldu. Yönetici e-posta onayını kapatmalı (Supabase → Authentication → Confirm email) ya da birkaç dakika sonra tekrar dene.'); // Keeping error messages as-is for technical accuracy
      } else {
        setError(error.message);
      }
      return;
    }

    // Hoş geldin maili (fire-and-forget — session cookie set olduktan sonra)
    const fireWelcome = () => { fetch('/api/auth/welcome', { method: 'POST' }).catch(() => {}); };

    // Onay KAPALI ise signUp doğrudan session döndürür → direkt içeri al
    if (data.session) {
      fireWelcome();
      setLoading(false);
      router.push(next);
      router.refresh();
      return;
    }

    // Onay AÇIK ise: otomatik signin dene (onay kapalıysa zaten girer; açıksa nazikçe bilgilendir)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (!signInErr) {
      fireWelcome();
      router.push(next);
      router.refresh();
      return;
    }
    setInfo('Hesap oluşturuldu. E-posta onayı açık görünüyor — gelen kutunu kontrol et veya yönetici onayı kapatınca tekrar giriş yap.');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">F</div>
          <span className="font-semibold text-lg">Fasheone <span className="text-zinc-500">Shoes</span></span>
        </div>
        <h1 className="text-xl font-semibold">
          {mode === 'signin' ? 'Giriş Yap' : 'Hesap Oluştur'}
        </h1>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading || loading || (mode === 'signup' && !acceptedLegal)}
          className="w-full p-3 bg-white hover:bg-zinc-100 text-zinc-900 rounded-lg font-medium flex items-center justify-center gap-2.5 disabled:opacity-60 transition"
        >
          {googleLoading ? (
            <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Google ile {mode === 'signin' ? 'Giriş Yap' : 'Devam Et'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-500">veya e-posta ile</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <div>
          <label htmlFor="email" className="text-xs text-zinc-300 mb-1 block">E-posta</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-describedby={error ? 'auth-error' : undefined}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-xs text-zinc-300 mb-1 block">Şifre</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            aria-describedby={error ? 'auth-error' : 'password-help'}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />
          <p id="password-help" className="mt-1 text-xs text-zinc-400">En az 6 karakter.</p>
        </div>

        {mode === 'signup' && (
          <label className="flex items-start gap-2 text-xs leading-relaxed text-zinc-300">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(event) => setAcceptedLegal(event.target.checked)}
              required
              className="mt-0.5 h-4 w-4 accent-indigo-500"
            />
            <span>
              <Link href="/terms" className="text-indigo-300 underline">Kullanım Şartları</Link> ve{' '}
              <Link href="/privacy" className="text-indigo-300 underline">Gizlilik Politikası</Link>’nı okudum ve kabul ediyorum.
            </span>
          </label>
        )}

        {error && <div id="auth-error" role="alert" aria-live="assertive" className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">{error}</div>}
        {info && <div role="status" aria-live="polite" className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">{info}</div>}

        <button
          type="submit"
          disabled={loading || (mode === 'signup' && !acceptedLegal)}
          className="w-full p-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Bekleyin…' : mode === 'signin' ? 'Giriş Yap' : 'Hesap Oluştur'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
          className="w-full text-sm text-zinc-400 hover:text-zinc-200"
        >
          {mode === 'signin' ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
        </button>

        <p className="text-center text-xs leading-relaxed text-zinc-400">
          Fasheone Shoes ayrı bir ürün hesabı kullanır; fasheone.com hesabınız burada otomatik olarak ortak değildir.
          {next !== '/studio' && <> Girişten sonra <strong className="text-zinc-200">{next}</strong> sayfasına döneceksiniz.</>}
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <LoginForm />
    </Suspense>
  );
}
