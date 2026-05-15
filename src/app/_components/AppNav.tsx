"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TABS = [
  { href: '/',        label: 'Stüdyo' },
  { href: '/analyze', label: 'Ürün Analizi' },
  { href: '/batch',   label: 'Toplu Üretim' },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshCredits = React.useCallback(() => {
    fetch('/api/credits/balance')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && typeof d.credits === 'number') setCredits(d.credits); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    fetch('/api/admin/check').then(r => r.ok ? r.json() : null).then(d => setIsAdmin(!!d?.admin)).catch(() => {});
    refreshCredits();
    const h = () => refreshCredits();
    window.addEventListener('credits:refresh', h);
    window.addEventListener('focus', h);
    const iv = setInterval(refreshCredits, 20000); // üretim bitince ~20sn içinde güncellenir
    return () => {
      window.removeEventListener('credits:refresh', h);
      window.removeEventListener('focus', h);
      clearInterval(iv);
    };
  }, [supabase, refreshCredits]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="border-b border-white/5 px-6 py-3 flex items-center justify-between bg-black/20 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">F</div>
          <span className="font-semibold text-xl tracking-tight">Fasheone <span className="text-zinc-500 font-normal">Shoes</span></span>
        </div>
        <div className="flex items-center gap-1">
          {TABS.map(t => {
            const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                  active
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/pricing"
          className="px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/25 transition text-xs font-medium flex items-center gap-1.5"
          title="Kredi satın al"
        >
          <span className="text-indigo-300">◆</span>
          {credits !== null ? `${credits} kredi` : 'Kredi'}
          <span className="text-indigo-400/70 hidden sm:inline">· Yükle</span>
        </Link>
        {isAdmin && (
          <Link href="/admin" className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition text-xs font-medium">
            🛡️ Admin
          </Link>
        )}
        {email && <span className="text-zinc-500 text-xs hidden md:inline" title={email}>{email}</span>}
        <button onClick={signOut} className="text-zinc-400 hover:text-white transition" title="Çıkış">Çıkış</button>
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
          {email ? email[0].toUpperCase() : '?'}
        </div>
      </div>
    </nav>
  );
}
