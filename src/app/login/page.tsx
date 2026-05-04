"use client";
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (mode === 'signup') {
      setInfo('Hesap oluşturuldu. E-posta doğrulaması açıksa kutunu kontrol et.');
      return;
    }
    router.push(next);
    router.refresh();
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

        <div>
          <label className="text-xs text-zinc-400 mb-1 block">E-posta</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Şifre</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">{error}</div>}
        {info && <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">{info}</div>}

        <button
          type="submit"
          disabled={loading}
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
