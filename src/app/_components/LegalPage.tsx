"use client";

import Link from 'next/link';
import { useT } from '@/lib/i18n';

export function LegalPage({ titleKey, children }: { titleKey: string; children: React.ReactNode }) {
  const { t } = useT();
  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-12 text-zinc-100">
      <article className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-10">
        <Link href="/" className="text-sm text-indigo-300 hover:text-indigo-200">← {t('nav.home')}</Link>
        <h1 className="mt-6 text-3xl font-bold">{t(titleKey as any)}</h1>
        <p className="mt-2 text-sm text-zinc-400">Son güncelleme: 18 Ağustos 2026</p>
        <div className="mt-8 space-y-5 leading-7 text-zinc-300">{children}</div>
      </article>
    </main>
  );
}
