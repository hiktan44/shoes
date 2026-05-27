"use client";
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import AppNav from '../_components/AppNav';

const SHOE_TYPES = ['Genel Ayakkabı', 'Sneaker', 'Boots', 'Heels', 'Loafers', 'Sandals', 'Kids Shoes'];

type AnalyzeResult = {
  title: string;
  summary: string;
  highlights: string[];
  materials: { upper?: string; lining?: string; sole?: string; insole?: string };
  construction: string;
  color_palette: string[];
  size_run_suggestion: string;
  target_audience: string;
  use_cases: string[];
  care_instructions: string[];
  seo_keywords: string[];
  marketing_short: string;
  marketing_long: string;
  html_block: string;
};

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

function buildMarkdown(r: AnalyzeResult): string {
  return `# ${r.title}

${r.summary}

## Öne Çıkanlar
${r.highlights.map(h => `- ${h}`).join('\n')}

## Malzemeler
- **Üst:** ${r.materials.upper ?? 'unknown'}
- **Astar:** ${r.materials.lining ?? 'unknown'}
- **Taban:** ${r.materials.sole ?? 'unknown'}
- **İç Taban:** ${r.materials.insole ?? 'unknown'}

**İmalat:** ${r.construction}
**Renk Paleti:** ${r.color_palette.join(', ')}
**Beden Aralığı:** ${r.size_run_suggestion}
**Hedef Kitle:** ${r.target_audience}

## Kullanım Alanları
${r.use_cases.map(u => `- ${u}`).join('\n')}

## Bakım
${r.care_instructions.map(c => `- ${c}`).join('\n')}

## SEO Anahtarları
${r.seo_keywords.join(', ')}

## Kısa Açıklama (Meta)
${r.marketing_short}

## Uzun Açıklama
${r.marketing_long}
`;
}

export default function AnalyzePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shoeType, setShoeType] = useState('Genel Ayakkabı');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needCredits, setNeedCredits] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const onFile = (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      setError(`Desteklenmeyen format: ${file.type || 'bilinmiyor'}`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Görsel çok büyük: ${(file.size / 1024 / 1024).toFixed(1)} MB (max 8 MB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setError(null);
    setNeedCredits(false);
    setResult(null);
    try {
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imagePreview, shoeType, language }),
      });
      const txt = await r.text();
      let d: { result?: AnalyzeResult; provider?: string; error?: string; code?: string };
      try { d = JSON.parse(txt); }
      catch { throw new Error(`Sunucu yanıtı geçersiz (${r.status})`); }
      if (r.status === 402 || d.code === 'insufficient_credits') setNeedCredits(true);
      if (!r.ok || !d.result) throw new Error(d.error || 'Analiz başarısız');
      setResult(d.result);
      setProvider(d.provider ?? null);
    } catch (e) {
      setError((e as Error).message || 'Analiz hatası');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} kopyalandı ✓`);
    } catch {
      showToast('Kopyalama başarısız');
    }
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans">
      <AppNav />
      <div className="max-w-[1200px] mx-auto p-6">
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-lg text-sm shadow-xl">
            {toast}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INPUT */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-1">Ürün Analizi</h2>
              <p className="text-xs text-zinc-500 mb-4">Bir ayakkabı görseli yükle, e-ticaret listemesi için detaylı çıktı al.</p>

              <div
                className={`relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all ${imagePreview ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
              >
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="upload" className="absolute inset-0 w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center px-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-zinc-400">📷</div>
                    <span className="text-sm font-medium text-zinc-300">Görsel Yükle</span>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
              </div>
              {imagePreview && (
                <button onClick={() => { setImagePreview(null); setResult(null); }} className="mt-2 text-xs text-red-400 hover:text-red-300">Temizle</button>
              )}

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Ayakkabı Tipi</label>
                  <select
                    value={shoeType}
                    onChange={e => setShoeType(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-300 rounded-lg p-2 outline-none focus:border-indigo-500"
                  >
                    {SHOE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Çıktı Dili</label>
                  <div className="flex gap-2">
                    <button onClick={() => setLanguage('tr')} className={`flex-1 py-2 text-sm rounded-lg border ${language === 'tr' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200' : 'border-zinc-700 text-zinc-400'}`}>Türkçe</button>
                    <button onClick={() => setLanguage('en')} className={`flex-1 py-2 text-sm rounded-lg border ${language === 'en' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200' : 'border-zinc-700 text-zinc-400'}`}>English</button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex flex-col gap-2">
                  <span>{error}</span>
                  {needCredits && <Link href="/pricing" className="self-start px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Kredi Al →</Link>}
                </div>
              )}

              <button
                onClick={analyze}
                disabled={!imagePreview || loading}
                className={`w-full mt-4 p-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  !imagePreview || loading ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-zinc-100 hover:bg-white text-zinc-900'
                }`}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-900 rounded-full animate-spin"></span> Analiz Ediliyor…</>
                ) : 'Analiz Et'}
              </button>
            </div>
          </div>

          {/* OUTPUT */}
          <div className="lg:col-span-8 space-y-4">
            {!result && !loading && (
              <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-12 text-center text-zinc-500">
                Görsel yükle → &ldquo;Analiz Et&rdquo; → ürün listesi çıktısı burada görünecek.
              </div>
            )}

            {result && (
              <>
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h1 className="text-2xl font-bold">{result.title}</h1>
                      {provider && <span className="text-[10px] uppercase tracking-wide text-indigo-300/80">via {provider}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => copyText(buildMarkdown(result), 'Markdown')} className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded">📋 Markdown</button>
                      <button onClick={() => copyText(result.html_block, 'HTML')} className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded">📋 HTML</button>
                      <button onClick={() => copyText(result.marketing_long, 'Düz metin')} className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded">📋 Düz Metin</button>
                      <button onClick={() => downloadFile(`${result.title}.md`, buildMarkdown(result), 'text/markdown')} className="text-xs px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded">↓ .md</button>
                      <button onClick={() => downloadFile(`${result.title}.html`, result.html_block, 'text/html')} className="text-xs px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded">↓ .html</button>
                      <button onClick={() => downloadFile(`${result.title}.json`, JSON.stringify(result, null, 2), 'application/json')} className="text-xs px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded">↓ .json</button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-xs uppercase tracking-wide text-zinc-400 mb-3">Öne Çıkanlar</h3>
                    <ul className="space-y-1.5 text-sm">
                      {result.highlights.map((h, i) => <li key={i} className="flex gap-2"><span className="text-emerald-400">✓</span><span>{h}</span></li>)}
                    </ul>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-xs uppercase tracking-wide text-zinc-400 mb-3">Malzemeler</h3>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-zinc-800">
                        {(['upper','lining','sole','insole'] as const).map(k => (
                          <tr key={k}>
                            <td className="py-1.5 text-zinc-500 capitalize">{k}</td>
                            <td className="py-1.5 text-right">{result.materials[k] ?? '—'}</td>
                          </tr>
                        ))}
                        <tr><td className="py-1.5 text-zinc-500">İmalat</td><td className="py-1.5 text-right">{result.construction}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-xs uppercase tracking-wide text-zinc-400 mb-3">Renk Paleti</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.color_palette.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 bg-zinc-800/50 px-2 py-1 rounded">
                          <span className="w-4 h-4 rounded ring-1 ring-white/10" style={{ background: c }} />
                          <code className="text-xs text-zinc-300">{c}</code>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-zinc-500">
                      <div>Beden: <span className="text-zinc-300">{result.size_run_suggestion}</span></div>
                      <div>Hedef: <span className="text-zinc-300">{result.target_audience}</span></div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                    <h3 className="text-xs uppercase tracking-wide text-zinc-400 mb-3">Kullanım & Bakım</h3>
                    <div className="text-xs text-zinc-400 mb-1">Kullanım</div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {result.use_cases.map((u, i) => <span key={i} className="text-[11px] px-2 py-0.5 bg-zinc-800 rounded">{u}</span>)}
                    </div>
                    <div className="text-xs text-zinc-400 mb-1">Bakım</div>
                    <ul className="text-xs text-zinc-300 space-y-0.5">
                      {result.care_instructions.map((c, i) => <li key={i}>• {c}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                  <h3 className="text-xs uppercase tracking-wide text-zinc-400 mb-2">SEO Anahtarları</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.seo_keywords.map((k, i) => <span key={i} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded">{k}</span>)}
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                  <h3 className="text-xs uppercase tracking-wide text-zinc-400 mb-2">Kısa Açıklama (Meta · ≤160ch)</h3>
                  <p className="text-sm text-zinc-200 italic">&ldquo;{result.marketing_short}&rdquo;</p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                  <h3 className="text-xs uppercase tracking-wide text-zinc-400 mb-2">Uzun Açıklama</h3>
                  <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{result.marketing_long}</div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                  <h3 className="text-xs uppercase tracking-wide text-zinc-400 mb-2 flex items-center justify-between">
                    <span>HTML Bloğu (kopyala-yapıştır)</span>
                    <button onClick={() => copyText(result.html_block, 'HTML bloğu')} className="text-xs px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded">📋</button>
                  </h3>
                  <pre className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3 rounded overflow-x-auto whitespace-pre-wrap">{result.html_block}</pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
