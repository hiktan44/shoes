"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';

/* eslint-disable @next/next/no-img-element */

const IMG = {
  hero: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1400&q=80',
  studio: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1100&q=80',
  design: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1100&q=80',
  pose: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1100&q=80',
  retouch: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1100&q=80',
  analyze: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1100&q=80',
  batch: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1100&q=80',
  cta: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1600&q=80',
};

const FEATURES = [
  {
    tag: 'STÜDYO ÇEKİMİ', tagKey: 'feature.studio.title', tone: 'text-rose-600 bg-rose-50',
    titleKey: 'feature.studio.title',
    bodyKey: 'feature.studio.body',
    pointKeys: ['feature.studio.p1', 'feature.studio.p2', 'feature.studio.p3'],
    img: IMG.studio, flip: false,
  },
  {
    tag: 'AI TASARIM', tagKey: 'feature.design.title', tone: 'text-indigo-600 bg-indigo-50',
    titleKey: 'feature.design.title',
    bodyKey: 'feature.design.body',
    pointKeys: ['feature.design.p1', 'feature.design.p2', 'feature.design.p3'],
    img: IMG.design, flip: true,
  },
  {
    tag: 'ÇOKLU POZ KATALOĞU', tagKey: 'feature.pose.title', tone: 'text-amber-600 bg-amber-50',
    titleKey: 'feature.pose.title',
    bodyKey: 'feature.pose.body',
    pointKeys: ['feature.pose.p1', 'feature.pose.p2', 'feature.pose.p3'],
    img: IMG.pose, flip: false,
  },
  {
    tag: 'HEDEFLİ RÖTUŞ', tagKey: 'feature.retouch.title', tone: 'text-cyan-600 bg-cyan-50',
    titleKey: 'feature.retouch.title',
    bodyKey: 'feature.retouch.body',
    pointKeys: ['feature.retouch.p1', 'feature.retouch.p2', 'feature.retouch.p3'],
    img: IMG.retouch, flip: true,
  },
  {
    tag: 'E-TİCARET ANALİZİ', tagKey: 'feature.analyze.title', tone: 'text-emerald-600 bg-emerald-50',
    titleKey: 'feature.analyze.title',
    bodyKey: 'feature.analyze.body',
    pointKeys: ['feature.analyze.p1', 'feature.analyze.p2', 'feature.analyze.p3'],
    img: IMG.analyze, flip: false,
  },
  {
    tag: 'TOPLU ÜRETİM', tagKey: 'feature.batch.title', tone: 'text-fuchsia-600 bg-fuchsia-50',
    titleKey: 'feature.batch.title',
    bodyKey: 'feature.batch.body',
    pointKeys: ['feature.batch.p1', 'feature.batch.p2', 'feature.batch.p3'],
    img: IMG.batch, flip: true,
  },
];

const MINI = [
  { hKey: 'mini.album', dKey: 'mini.albumDesc' },
  { hKey: 'mini.credits', dKey: 'mini.creditsDesc' },
  { hKey: 'mini.turkish', dKey: 'mini.turkishDesc' },
  { hKey: 'mini.secure', dKey: 'mini.secureDesc' },
  { hKey: 'mini.resolution', dKey: 'mini.resolutionDesc' },
  { hKey: 'mini.free', dKey: 'mini.freeDesc' },
];

const STEPS = [
  { n: '01', hKey: 'how.step1.title', dKey: 'how.step1.desc' },
  { n: '02', hKey: 'how.step2.title', dKey: 'how.step2.desc' },
  { n: '03', hKey: 'how.step3.title', dKey: 'how.step3.desc' },
];

const FAQ = [
  { qKey: 'faq.q1', aKey: 'faq.a1' },
  { qKey: 'faq.q2', aKey: 'faq.a2' },
  { qKey: 'faq.q3', aKey: 'faq.a3' },
  { qKey: 'faq.q4', aKey: 'faq.a4' },
];

export default function Landing() {
  const { t } = useT();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user)).catch(() => setAuthed(false));
  }, []);

  const primaryHref = authed ? '/studio' : '/login?mode=signup';
  const primaryLabel = authed ? t('app.studio') : t('hero.primaryButton');

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-lg">F</div>
            <span className="font-bold text-lg tracking-tight">Fasheone <span className="text-zinc-400 font-medium">Shoes</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-zinc-600">
            <a href="#ozellikler" className="hover:text-zinc-900 transition">{t('nav.features')}</a>
            <a href="#nasil" className="hover:text-zinc-900 transition">{t('nav.howItWorks')}</a>
            <Link href="/pricing" className="hover:text-zinc-900 transition">{t('nav.pricing')}</Link>
            <a href="#sss" className="hover:text-zinc-900 transition">{t('nav.faq')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangSwitch />
            <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 hidden sm:inline">{t('nav.login')}</Link>
            <Link href={primaryHref} className="text-sm font-semibold bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition">
              {primaryLabel}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-12 md:pt-24 md:pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full">
            {t('hero.tag')}
          </span>
          <h1 className="mt-5 text-4xl md:text-[3.4rem] leading-[1.05] font-black tracking-tight">
            {t('hero.title')}
          </h1>
          <p className="mt-5 text-lg text-zinc-600 max-w-xl">
            {t('hero.description')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={primaryHref} className="bg-zinc-900 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-zinc-800 transition">
              {primaryLabel} →
            </Link>
            <Link href="/pricing" className="font-semibold px-6 py-3.5 rounded-xl border border-zinc-200 hover:border-zinc-400 transition">
              {t('hero.secondaryButton')}
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">{t('hero.freeCredits')}</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-rose-100 via-amber-50 to-indigo-100 rounded-[2rem] -rotate-2" />
          <img src={IMG.hero} alt={t('hero.tag')} className="relative rounded-[1.8rem] shadow-2xl object-cover w-full h-[420px]" />
          <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-5 py-3 border border-zinc-100">
            <div className="text-2xl font-black">~15 sn</div>
            <div className="text-xs text-zinc-500">{t('hero.avgTime')}</div>
          </div>
        </div>
      </section>

      {/* Logos / trust strip */}
      <section className="border-y border-zinc-100 bg-zinc-50/60">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-zinc-500">
          <span>{t('hero.trust1')}</span><span className="text-zinc-300">•</span>
          <span>{t('hero.trust2')}</span><span className="text-zinc-300">•</span>
          <span>{t('hero.trust3')}</span><span className="text-zinc-300">•</span>
          <span>{t('hero.trust4')}</span><span className="text-zinc-300">•</span>
          <span>{t('hero.trust5')}</span>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section id="nasil" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-indigo-600">{t('how.title')}</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">{t('how.subtitle')}</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {STEPS.map(s => (
            <div key={s.n} className="relative bg-zinc-50 rounded-2xl p-7 border border-zinc-100">
              <div className="text-5xl font-black text-zinc-200">{s.n}</div>
              <h3 className="mt-3 text-lg font-bold">{t(s.hKey as any)}</h3>
              <p className="mt-1.5 text-zinc-600 text-sm">{t(s.dKey as any)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature sections */}
      <section id="ozellikler" className="bg-zinc-50/70 border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-5 py-20 space-y-24">
          {FEATURES.map(f => (
            <div key={f.tag} className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${f.flip ? 'md:[&>div:first-child]:order-2' : ''}`}>
              <div>
                <span className={`inline-block text-xs font-bold tracking-widest px-3 py-1.5 rounded-full ${f.tone}`}>{t(f.tagKey as any)}</span>
                <h3 className="mt-4 text-2xl md:text-[2rem] leading-tight font-black tracking-tight">{t(f.titleKey as any)}</h3>
                <p className="mt-4 text-zinc-600">{t(f.bodyKey as any)}</p>
                <ul className="mt-5 space-y-2">
                  {f.pointKeys.map(pKey => (
                    <li key={pKey} className="flex items-start gap-2.5 text-sm text-zinc-700">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] shrink-0">✓</span>
                      {t(pKey as any)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <img src={f.img} alt={t(f.tagKey as any)} className="rounded-2xl shadow-xl object-cover w-full h-[340px] md:h-[400px]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mini grid */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <span className="text-xs font-bold tracking-widest text-emerald-600">DAHA FAZLASI</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">Üretimi kolaylaştıran detaylar</h2>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MINI.map(m => (
            <div key={m.hKey} className="rounded-2xl border border-zinc-200 p-6 hover:border-zinc-900 hover:shadow-lg transition">
              <h3 className="font-bold text-lg">{t(m.hKey as any)}</h3>
              <p className="mt-1.5 text-sm text-zinc-600">{t(m.dKey as any)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-zinc-900 text-white">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-amber-400">{t('pricing.title')}</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">{t('pricing.title')}</h2>
              <p className="mt-3 text-zinc-400 max-w-lg">{t('pricing.description')}</p>
            </div>
            <Link href="/pricing" className="bg-white text-zinc-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-zinc-100 transition shrink-0">
              {t('pricing.viewAll')}
            </Link>
          </div>
          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            {[
              { nKey: 'pricing.plans.basic', c: '100 kredi', p: '1.399 ₺' },
              { nKey: 'pricing.plans.standard', c: '250 kredi', p: '3.199 ₺', pop: true },
              { nKey: 'pricing.plans.pro', c: '500 kredi', p: '5.999 ₺' },
            ].map(p => (
              <div key={p.nKey} className={`rounded-2xl p-7 border ${p.pop ? 'bg-white text-zinc-900 border-white' : 'border-zinc-700'}`}>
                {p.pop && <span className="text-[11px] font-bold text-rose-600">{t('pricing.popular')}</span>}
                <div className="mt-1 text-lg font-bold">{t(p.nKey as any)}</div>
                <div className={`text-sm ${p.pop ? 'text-zinc-500' : 'text-zinc-400'}`}>{p.c}</div>
                <div className="mt-4 text-3xl font-black">{p.p}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="sss" className="max-w-3xl mx-auto px-5 py-20">
        <div className="text-center">
          <span className="text-xs font-bold tracking-widest text-cyan-600">SIKÇA SORULANLAR</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">{t('faq.title')}</h2>
        </div>
        <div className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
          {FAQ.map(item => (
            <details key={item.qKey} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                {t(item.qKey as any)}
                <span className="text-zinc-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-zinc-600 text-sm leading-relaxed">{t(item.aKey as any)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative">
        <img src={IMG.cta} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-zinc-900/75" />
        <div className="relative max-w-3xl mx-auto px-5 py-24 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t('cta.title')}</h2>
          <p className="mt-4 text-zinc-300 max-w-xl mx-auto">
            {t('cta.description')}
          </p>
          <Link href={primaryHref} className="inline-block mt-8 bg-white text-zinc-900 font-bold px-8 py-4 rounded-xl hover:bg-zinc-100 transition">
            {primaryLabel} →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-sm">F</div>
            <span className="font-semibold text-zinc-700">Fasheone Shoes</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-zinc-900">{t('nav.pricing')}</Link>
            <Link href="/privacy" className="hover:text-zinc-900">{t('nav.privacy')}</Link>
            <Link href="/terms" className="hover:text-zinc-900">{t('nav.terms')}</Link>
            <Link href="/cookies" className="hover:text-zinc-900">{t('nav.cookies')}</Link>
            <Link href="/contact" className="hover:text-zinc-900">{t('nav.contact')}</Link>
          </div>
          <div>© {new Date().getFullYear()} Fasheone</div>
        </div>
      </footer>
    </div>
  );
}
