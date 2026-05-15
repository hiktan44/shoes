"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PACKAGES = [
  { id: 'SMALL', label: 'Başlangıç', credits: 100, priceTRY: 999, popular: false },
  { id: 'MEDIUM', label: 'Standart', credits: 250, priceTRY: 2399, popular: true },
  { id: 'LARGE', label: 'Profesyonel', credits: 500, priceTRY: 4499, popular: false },
];

const USAGE = [
  { label: 'Fotoğraf / Stüdyo Çekimi', cost: '1 kredi' },
  { label: 'AI Tasarım (sıfırdan model)', cost: '2 kredi' },
  { label: 'Çoklu Poz (her poz)', cost: '1 kredi' },
  { label: 'Albüm / Kolaj', cost: '2 kredi' },
  { label: 'Rötuş (hedefli düzenleme)', cost: '1 kredi' },
  { label: 'E-Ticaret Analizi', cost: '1 kredi' },
];

const PKG_FEATURES = [
  '✓ Fotoğraf & Stüdyo Çekimi',
  '✓ AI Sıfırdan Tasarım',
  '✓ Çoklu Poz Kataloğu (8 poz)',
  '✓ Albüm / Kolaj Üretimi',
  '✓ Hedefli Rötuş (maske + referans)',
  '✓ E-Ticaret Derin Analizi',
  '✓ Krediler hiç bitmez',
];

function PricingInner() {
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
      setNotice({ kind: 'ok', msg: 'Ödeme başarılı! Krediler birkaç saniye içinde hesabınıza yüklenecek.' });
    } else if (params.get('canceled') === '1') {
      setNotice({ kind: 'err', msg: 'Ödeme iptal edildi.' });
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
      const data = await res.json();
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
              Bakiye: {balance} kredi
            </span>
          )}
          <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white transition">← Uygulamaya dön</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Fiyatlandırma</h1>
          <p className="text-zinc-400 mt-3 max-w-xl mx-auto">
            İhtiyacınıza uygun kredi paketini seçin. Abonelik yok — sadece kullandığınız kadar ödersiniz. Krediler hiç bitmez.
          </p>
          <p className="text-emerald-400/80 text-sm mt-2">Yeni üyeler 10 ücretsiz kredi ile başlar 🎁</p>
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
                  Popüler
                </span>
              )}
              <h3 className="text-lg font-semibold">{pkg.label}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{pkg.priceTRY.toLocaleString('tr-TR')}</span>
                <span className="text-zinc-400 text-lg">₺</span>
              </div>
              <div className="mt-1 text-indigo-300 font-medium">{pkg.credits} kredi</div>
              <div className="text-xs text-zinc-500 mt-1">
                ≈ {(pkg.priceTRY / pkg.credits).toFixed(2)} ₺ / kredi
              </div>

              <ul className="mt-6 space-y-2 flex-1">
                {PKG_FEATURES.map(f => (
                  <li key={f} className="text-sm text-zinc-300">{f}</li>
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
                {loadingPkg === pkg.id ? 'Yönlendiriliyor…' : 'Satın Al'}
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7">
            <h3 className="text-lg font-semibold mb-1">💡 Kredi Kullanımı</h3>
            <p className="text-xs text-zinc-500 mb-4">Her işlemin kredi maliyeti:</p>
            <div className="divide-y divide-zinc-800/70">
              {USAGE.map(u => (
                <div key={u.label} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-zinc-300">{u.label}</span>
                  <span className="text-indigo-300 font-medium">{u.cost}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 flex flex-col">
            <h3 className="text-lg font-semibold mb-1">Kurumsal Çözümler</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Büyük ekipler ve şirketler için özel kredi paketleri, sınırsız kullanıcı, öncelikli destek, özel hesap yöneticisi, API erişimi ve SLA garantisi.
            </p>
            <ul className="space-y-1.5 text-sm text-zinc-300 flex-1">
              <li>✓ Özel Kredi Paketi</li>
              <li>✓ Sınırsız Kullanıcı</li>
              <li>✓ Öncelikli Destek & Özel Hesap Yöneticisi</li>
              <li>✓ API Erişimi & Özel Entegrasyon</li>
              <li>✓ SLA Garantisi</li>
            </ul>
            <a
              href="mailto:info@fasheone.com?subject=Kurumsal%20Teklif%20-%20Fasheone%20Shoes"
              className="mt-6 w-full p-3 rounded-xl font-semibold text-sm text-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
            >
              İletişime Geç
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
