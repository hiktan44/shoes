"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n';

const PACKAGES = [
  { id: 'SMALL', labelKey: 'pricing.plans.basic', credits: 100, priceTRY: 1399, popular: false },
  { id: 'MEDIUM', labelKey: 'pricing.plans.standard', credits: 250, priceTRY: 3199, popular: true },
  { id: 'LARGE', labelKey: 'pricing.plans.pro', credits: 500, priceTRY: 5999, popular: false },
];

const USAGE = [
  { labelKey: 'pricing.usage.photo', cost: '1 kredi' },
  { labelKey: 'pricing.usage.design', cost: '2 kredi' },
  { labelKey: 'pricing.usage.pose', cost: '1 kredi' },
  { labelKey: 'pricing.usage.album', cost: '2 kredi' },
  { labelKey: 'pricing.usage.retouch', cost: '1 kredi' },
  { labelKey: 'pricing.usage.analyze', cost: '1 kredi' },
];

const PKG_FEATURES = [
  'pricing.features.photo',
  'pricing.features.design',
  'pricing.features.pose',
  'pricing.features.album',
  'pricing.features.retouch',
  'pricing.features.analyze',
  'pricing.features.neverExpire',
];

function PricingInner() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && typeof d.credits === 'number') setBalance(d.credits); })
      .catch(() => {});
    if (params.get('success') === '1') {
      setNotice({ kind: 'ok', msg: t('pricing.success') });
    } else if (params.get('canceled') === '1') {
      setNotice({ kind: 'err', msg: t('pricing.canceled') });
    }
  }, [params]);

  const buy = async (packageId: string) => {
    setLoadingPkg(packageId);
    setNotice(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      if (res.status === 401) {
        router.push('/login?next=/pricing');
        return;
      }

      const contentType = res.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json')
        ? await res.json()
        : { error: (await res.text()) || 'Ödeme başlatılamadı' };
      if (!res.ok) throw new Error(data.error || 'Ödeme başlatılamadı');
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setNotice({ kind: 'err', msg: (e as Error).message });
      setLoadingPkg(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.push('/')} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg">F</div>
          <span className="font-semibold text-xl tracking-tight">Fasheone <span className="text-zinc-500 font-normal">Shoes</span></span>
        </button>
        <div className="flex items-center gap-4 text-sm">
          {balance !== null && (
            <span className="px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
              {t('pricing.nav.balance')} {balance} {t('pricing.credits')}
            </span>
          )}
          <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white transition">{t('pricing.nav.back')}</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{t('pricing.headline')}</h1>
          <p className="text-zinc-400 mt-3 max-w-xl mx-auto">
            {t('pricing.subheadline')}
          </p>
          <p className="text-emerald-400/80 text-sm mt-2">{t('pricing.newUser')}</p>
        </div>

        {notice && (
          <div className={`max-w-xl mx-auto mb-8 p-4 rounded-xl text-sm border ${
            notice.kind === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {notice.msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                pkg.popular
                  ? 'border-indigo-500/60 bg-indigo-500/5 shadow-[0_0_40px_rgba(99,102,241,0.12)]'
                  : 'border-zinc-800 bg-zinc-900/40'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-white text-[11px] font-semibold">
                  {t('pricing.popular')}
                </span>
              )}
              <h3 className="text-lg font-semibold">{t(pkg.labelKey as any)}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{pkg.priceTRY.toLocaleString('tr-TR')}</span>
                <span className="text-zinc-400 text-lg">₺</span>
              </div>
              <div className="mt-1 text-indigo-300 font-medium">{pkg.credits} {t('pricing.credits')}</div>
              <div className="text-xs text-zinc-500 mt-1">
                ≈ {(pkg.priceTRY / pkg.credits).toFixed(2)} {t('pricing.perCredit')}
              </div>

              <ul className="mt-6 space-y-2 flex-1">
                {PKG_FEATURES.map(f => (
                  <li key={f} className="text-sm text-zinc-300">{t(f as any)}</li>
                ))}
              </ul>

              <button
                onClick={() => buy(pkg.id)}
                disabled={loadingPkg !== null}
                className={`mt-7 w-full p-3 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${
                  pkg.popular
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                    : 'bg-zinc-100 hover:bg-white text-zinc-900'
                }`}
              >
                {loadingPkg === pkg.id ? t('pricing.redirecting') : t('pricing.buy')}
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7">
            <h3 className="text-lg font-semibold mb-1">{t('pricing.usageTitle')}</h3>
            <p className="text-xs text-zinc-500 mb-4">{t('pricing.usageDesc')}</p>
            <div className="divide-y divide-zinc-800/70">
              {USAGE.map(u => (
                <div key={u.labelKey} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-zinc-300">{t(u.labelKey as any)}</span>
                  <span className="text-indigo-300 font-medium">{u.cost}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 flex flex-col">
            <h3 className="text-lg font-semibold mb-1">{t('pricing.enterpriseTitle')}</h3>
            <p className="text-sm text-zinc-400 mb-4">
              {t('pricing.enterpriseDesc')}
            </p>
            <ul className="space-y-1.5 text-sm text-zinc-300 flex-1">
              <li>{t('pricing.enterpriseFeature1')}</li>
              <li>{t('pricing.enterpriseFeature2')}</li>
              <li>{t('pricing.enterpriseFeature3')}</li>
              <li>{t('pricing.enterpriseFeature4')}</li>
              <li>{t('pricing.enterpriseFeature5')}</li>
            </ul>
            <a
              href="mailto:info@fasheone.com?subject=Kurumsal%20Teklif%20-%20Fasheone%20Shoes"
              className="mt-6 w-full p-3 rounded-xl font-semibold text-sm text-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
            >
              {t('pricing.enterpriseContact')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <PricingInner />
    </Suspense>
  );
}
