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
        <section className="mt-10 border-t border-zinc-800 pt-6 text-sm leading-6 text-zinc-400">
          <h2 className="font-semibold text-zinc-200">İşletmeci ve destek</h2>
          <p className="mt-2">
            STRATEJİ DANIŞMANLIK HİZMETLERİ SAN. VE TİC. A.Ş.<br />
            Zafer Mah. Kumrulu Sok. No. 2/18 Bahçelievler/İstanbul<br />
            Yenibosna V.D. · Vergi No: 7810520457<br />
            <a className="text-indigo-300 underline" href="mailto:info@stratejidanismanlik.com.tr">info@stratejidanismanlik.com.tr</a>
          </p>
        </section>
      </article>
    </main>
  );
}
