"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';

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
    tag: 'STÜDYO ÇEKİMİ', tone: 'text-rose-600 bg-rose-50',
    title: 'Telefonla çektiğin kareyi, satışa hazır stüdyo fotoğrafına çevir',
    body: 'Atölyede ya da rafta çekilmiş sıradan bir fotoğraf yeter. Saf beyaz fon, doğru ışık, gölge ve perspektif saniyeler içinde otomatik kuruluyor. Tabanın deseni, dikişler, logo ve toka birebir korunuyor — ürün “başka bir ayakkabı”ya dönüşmüyor.',
    points: ['Pazaryeri uyumlu 1:1 beyaz fon', 'Tek tekten çift (sağ–sol) otomatik tamamlama', 'Form & taban kilidi ile %100 sadakat'],
    img: IMG.studio, flip: false,
  },
  {
    tag: 'AI TASARIM', tone: 'text-indigo-600 bg-indigo-50',
    title: 'Çizimden, dokudan ve tabandan sıfır model üret',
    body: 'Eskiz, deri/kumaş örneği, taban fotoğrafı ve toka referanslarını birlikte yükle; yapay zeka bunları tutarlı tek bir tasarımda birleştirsin. “Kalın kauçuk taban + yılan derisi saya” gibi fikirleri dakikalar içinde görselleştir.',
    points: ['Eskiz + materyal + taban kompozisyonu', 'Referans bazlı doku/renk aktarımı', 'Koleksiyon öncesi hızlı prototip'],
    img: IMG.design, flip: true,
  },
  {
    tag: 'ÇOKLU POZ KATALOĞU', tone: 'text-amber-600 bg-amber-50',
    title: 'Aynı model, aynı kıyafet — 8 farklı poz tek tıkla',
    body: 'Koltukta oturan, sokakta yürüyen, stüdyoda ayakta… İstediğin pozları seç, hepsi aynı mankenle ve aynı kıyafetle üretilsin. Yüz görünen / belden aşağı seçenekleriyle e-ticaret ve sosyal medya için tutarlı bir set elde et.',
    points: ['8 hazır poz, çoklu seçim', 'Karakter & kıyafet sabitleme', 'Tümünü ZIP indir veya albüm yap'],
    img: IMG.pose, flip: false,
  },
  {
    tag: 'HEDEFLİ RÖTUŞ', tone: 'text-cyan-600 bg-cyan-50',
    title: 'Fırçayla bölge seç, sadece orayı değiştir',
    body: 'Görselin üstünde değişmesini istediğin yeri boya; bağcığı kırmızıya çevir, tabanı kalınlaştır, tokayı altın yap. Maske + talimat + referans görsel birlikte çalışır; gerisi piksel piksel aynı kalır. Geri/İleri ile adımları gez.',
    points: ['Canvas üzerinde maske fırçası', 'Renk / talimat / referans kombinasyonu', 'Çok adımlı geri-al / yinele'],
    img: IMG.retouch, flip: true,
  },
  {
    tag: 'E-TİCARET ANALİZİ', tone: 'text-emerald-600 bg-emerald-50',
    title: 'Ürün açıklaması, SEO ve özellikler — kopyala yapıştır hazır',
    body: 'Ayakkabının fotoğrafını yükle; malzeme, stil, hedef kitle, bakım önerileri, SEO anahtar kelimeleri, kısa ve uzun pazarlama metni ve doğrudan sitene yapıştırılabilir HTML bloğu çıksın. Çoklu model yedeklemesiyle her zaman sonuç alırsın.',
    points: ['Derin görsel analiz + Türkçe metin', 'SEO anahtar kelime seti', 'Hazır HTML açıklama bloğu'],
    img: IMG.analyze, flip: false,
  },
  {
    tag: 'TOPLU ÜRETİM', tone: 'text-fuchsia-600 bg-fuchsia-50',
    title: 'Onlarca ürünü tek seferde işle',
    body: 'Sezon kataloğunu mu hazırlıyorsun? 30’a kadar ayakkabıyı yükle, hepsine farklı poz, arka plan ve model varyasyonlarını toplu uygula. Tek tek uğraşma; sonuçları topluca indir.',
    points: ['Toplu yükleme & üretim', 'Varyasyonlu çıktı (poz/fon/model)', 'Tek tıkla toplu indirme'],
    img: IMG.batch, flip: true,
  },
];

const MINI = [
  { h: 'Albüm & Kolaj', d: 'Üretilen pozlardan editoryal magazin düzeninde tek kare oluştur.' },
  { h: 'Kredi Sistemi', d: 'Abonelik yok; kullandığın kadar öde, krediler hiç bitmez.' },
  { h: 'Tamamen Türkçe', d: 'Arayüz, üretim yönlendirmeleri ve metinler Türkçe.' },
  { h: 'Güvenli Hesap', d: 'E-posta veya Google ile giriş, verilerin sana özel.' },
  { h: 'Yüksek Çözünürlük', d: 'Pazaryeri ve baskı için keskin, net çıktılar.' },
  { h: '10 Ücretsiz Kredi', d: 'Kayıt olunca hemen denemeye başla, kart gerekmez.' },
];

const STEPS = [
  { n: '01', h: 'Görseli yükle', d: 'Telefonla çekilmiş bir fotoğraf ya da eskiz yeterli.' },
  { n: '02', h: 'Senaryoyu seç', d: 'Stüdyo, poz, rötuş veya tasarım — ne istediğini söyle.' },
  { n: '03', h: 'Saniyeler içinde indir', d: 'Satışa hazır görsel ve metinleri al, sitene koy.' },
];

const FAQ = [
  { q: 'Ayakkabının orijinal detayları korunuyor mu?', a: 'Evet. Form, taban yüksekliği, dikiş, logo ve aksesuarlar için ayrı koruma kuralları uygulanır; ürün başka bir modele dönüşmez.' },
  { q: 'Tek ayakkabı fotoğrafından çift üretebiliyor mu?', a: 'Evet, referansta tek tek varsa simetrik eşlenmiş sağ-sol çift otomatik oluşturulur.' },
  { q: 'Abonelik zorunlu mu?', a: 'Hayır. Kredi paketi alırsın, kullandıkça düşer ve krediler süresiz geçerlidir. Yeni üyelere 10 ücretsiz kredi verilir.' },
  { q: 'Sonuçları nerede kullanabilirim?', a: 'Trendyol, Hepsiburada gibi pazaryerleri, kendi e-ticaret siten, Instagram ve kataloglar için optimize çıktılar üretir.' },
];

export default function Landing() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user)).catch(() => setAuthed(false));
  }, []);

  const primaryHref = authed ? '/studio' : '/login?mode=signup';
  const primaryLabel = authed ? 'Stüdyoya Git' : 'Ücretsiz Başla';

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
            <a href="#ozellikler" className="hover:text-zinc-900 transition">Özellikler</a>
            <a href="#nasil" className="hover:text-zinc-900 transition">Nasıl çalışır</a>
            <Link href="/pricing" className="hover:text-zinc-900 transition">Fiyatlandırma</Link>
            <a href="#sss" className="hover:text-zinc-900 transition">SSS</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 hidden sm:inline">Giriş</Link>
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
            AYAKKABI MARKALARI İÇİN GÖRSEL STÜDYOSU
          </span>
          <h1 className="mt-5 text-4xl md:text-[3.4rem] leading-[1.05] font-black tracking-tight">
            Ayakkabı fotoğrafçısına<br /> ödediğin parayı <span className="text-rose-600">cebinde tut.</span>
          </h1>
          <p className="mt-5 text-lg text-zinc-600 max-w-xl">
            Telefonla çektiğin tek bir kareyi; satışa hazır stüdyo görseline, modelin ayağında pozlara,
            sıfır tasarımlara ve e-ticaret metinlerine dönüştür. Dakikalar içinde, Türkçe, ürününe sadık.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={primaryHref} className="bg-zinc-900 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-zinc-800 transition">
              {primaryLabel} →
            </Link>
            <Link href="/pricing" className="font-semibold px-6 py-3.5 rounded-xl border border-zinc-200 hover:border-zinc-400 transition">
              Fiyatları gör
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">Kayıt olunca <strong className="text-zinc-700">10 ücretsiz kredi</strong> · Kart gerekmez · Abonelik yok</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-rose-100 via-amber-50 to-indigo-100 rounded-[2rem] -rotate-2" />
          <img src={IMG.hero} alt="Stüdyo ayakkabı çekimi" className="relative rounded-[1.8rem] shadow-2xl object-cover w-full h-[420px]" />
          <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-5 py-3 border border-zinc-100">
            <div className="text-2xl font-black">~15 sn</div>
            <div className="text-xs text-zinc-500">ortalama üretim süresi</div>
          </div>
        </div>
      </section>

      {/* Logos / trust strip */}
      <section className="border-y border-zinc-100 bg-zinc-50/60">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-zinc-500">
          <span>Pazaryeri uyumlu çıktı</span><span className="text-zinc-300">•</span>
          <span>Ürüne %100 sadakat</span><span className="text-zinc-300">•</span>
          <span>Türkçe arayüz</span><span className="text-zinc-300">•</span>
          <span>Çoklu poz & model</span><span className="text-zinc-300">•</span>
          <span>Hazır SEO metni</span>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section id="nasil" className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-indigo-600">NASIL ÇALIŞIR</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">Üç adımda satışa hazır</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {STEPS.map(s => (
            <div key={s.n} className="relative bg-zinc-50 rounded-2xl p-7 border border-zinc-100">
              <div className="text-5xl font-black text-zinc-200">{s.n}</div>
              <h3 className="mt-3 text-lg font-bold">{s.h}</h3>
              <p className="mt-1.5 text-zinc-600 text-sm">{s.d}</p>
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
                <span className={`inline-block text-xs font-bold tracking-widest px-3 py-1.5 rounded-full ${f.tone}`}>{f.tag}</span>
                <h3 className="mt-4 text-2xl md:text-[2rem] leading-tight font-black tracking-tight">{f.title}</h3>
                <p className="mt-4 text-zinc-600">{f.body}</p>
                <ul className="mt-5 space-y-2">
                  {f.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-zinc-700">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <img src={f.img} alt={f.tag} className="rounded-2xl shadow-xl object-cover w-full h-[340px] md:h-[400px]" />
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
            <div key={m.h} className="rounded-2xl border border-zinc-200 p-6 hover:border-zinc-900 hover:shadow-lg transition">
              <h3 className="font-bold text-lg">{m.h}</h3>
              <p className="mt-1.5 text-sm text-zinc-600">{m.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-zinc-900 text-white">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-amber-400">FİYATLANDIRMA</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">Sadece kullandığın kadar öde</h2>
              <p className="mt-3 text-zinc-400 max-w-lg">Abonelik yok. Kredi al, harca, krediler süresiz geçerli. İhtiyacın büyürse Kurumsal’a geç.</p>
            </div>
            <Link href="/pricing" className="bg-white text-zinc-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-zinc-100 transition shrink-0">
              Tüm planları gör →
            </Link>
          </div>
          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            {[
              { n: 'Başlangıç', c: '100 kredi', p: '1.399 ₺' },
              { n: 'Standart', c: '250 kredi', p: '3.199 ₺', pop: true },
              { n: 'Profesyonel', c: '500 kredi', p: '5.999 ₺' },
            ].map(p => (
              <div key={p.n} className={`rounded-2xl p-7 border ${p.pop ? 'bg-white text-zinc-900 border-white' : 'border-zinc-700'}`}>
                {p.pop && <span className="text-[11px] font-bold text-rose-600">EN ÇOK TERCİH EDİLEN</span>}
                <div className="mt-1 text-lg font-bold">{p.n}</div>
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
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">Aklındaki sorular</h2>
        </div>
        <div className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
          {FAQ.map(item => (
            <details key={item.q} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                {item.q}
                <span className="text-zinc-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-zinc-600 text-sm leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative">
        <img src={IMG.cta} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-zinc-900/75" />
        <div className="relative max-w-3xl mx-auto px-5 py-24 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Bugün ilk görselini ücretsiz üret</h2>
          <p className="mt-4 text-zinc-300 max-w-xl mx-auto">
            Kayıt ol, 10 kredini al, telefonundaki ayakkabı fotoğrafını profesyonel bir vitrine çevir.
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
            <Link href="/pricing" className="hover:text-zinc-900">Fiyatlandırma</Link>
            <Link href="/privacy" className="hover:text-zinc-900">Gizlilik</Link>
            <Link href="/terms" className="hover:text-zinc-900">Şartlar</Link>
            <Link href="/cookies" className="hover:text-zinc-900">Çerezler</Link>
            <Link href="/contact" className="hover:text-zinc-900">İletişim</Link>
          </div>
          <div>© {new Date().getFullYear()} Fasheone</div>
        </div>
      </footer>
    </div>
  );
}
