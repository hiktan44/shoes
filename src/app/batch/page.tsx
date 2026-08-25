"use client";
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import JSZip from 'jszip';
import AppNav from '../_components/AppNav';
import PoseGrid, { POSE_LIST } from '../_components/PoseGrid';
import { pLimit } from '@/lib/concurrency';
import { useT } from '@/lib/i18n';

const SHOE_TYPES = ['Genel Ayakkabı', 'Sneaker', 'Boots', 'Heels', 'Loafers', 'Sandals', 'Kids Shoes'];
const MAX_SHOES = 30;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

type CellState = { state: 'idle' | 'pending' | 'success' | 'failed'; url?: string; error?: string };
type BatchShoe = {
  id: string;
  name: string;
  size: number;
  preview: string; // data URL
  studio: CellState;
  poses: Record<string, CellState>;
};

const newId = () => Math.random().toString(36).slice(2, 10);

async function safeJson(r: Response) {
  const txt = await r.text();
  try { return JSON.parse(txt); }
  catch { throw new Error(`Sunucu yanıtı geçersiz (${r.status})`); }
}

async function pollTask(taskId: string, totalMs = 240_000): Promise<string> {
  const start = Date.now();
  let delay = 2000;
  while (Date.now() - start < totalMs) {
    await new Promise(r => setTimeout(r, delay));
    const sr = await fetch(`/api/generate/status?taskId=${encodeURIComponent(taskId)}`);
    const sd = await safeJson(sr);
    if (!sr.ok) throw new Error(sd.error || 'Status hatası');
    if (sd.state === 'success') return sd.resultUrl as string;
    if (sd.state === 'failed') throw new Error(sd.error || 'Üretim başarısız');
    delay = Math.min(Math.floor(delay * 1.3), 5000);
  }
  throw new Error('Üretim zaman aşımına uğradı');
}

export default function BatchPage() {
  const { t } = useT();
  const [shoes, setShoes] = useState<BatchShoe[]>([]);
  const [selectedPoses, setSelectedPoses] = useState<string[]>([]);
  const [shoeType, setShoeType] = useState('Genel Ayakkabı');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('1:1');
  const [pairAuto, setPairAuto] = useState(true);
  const [running, setRunning] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needCredits, setNeedCredits] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<{ aborted: boolean }>({ aborted: false });

  const totalDone = shoes.reduce((acc, s) => acc + Object.values(s.poses).filter(p => p.state === 'success').length, 0);
  const totalTarget = shoes.length * selectedPoses.length;

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    setError(null);
    setShoes(prev => {
      const remaining = MAX_SHOES - prev.length;
      const accepted = arr.slice(0, remaining).filter(f => {
        if (!ALLOWED.includes(f.type)) return false;
        if (f.size > MAX_BYTES) return false;
        return true;
      });
      const rejected = arr.length - accepted.length;
      if (rejected > 0) setError(`${rejected} dosya reddedildi (limit, format veya boyut).`);

      const newShoes: BatchShoe[] = [];
      accepted.forEach(f => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setShoes(latest => latest.map(s => s.id === id ? { ...s, preview: ev.target?.result as string } : s));
        };
        reader.readAsDataURL(f);
        const id = newId();
        newShoes.push({
          id,
          name: f.name,
          size: f.size,
          preview: '',
          studio: { state: 'idle' },
          poses: {},
        });
      });
      return [...prev, ...newShoes];
    });
  };

  const removeShoe = (id: string) => setShoes(prev => prev.filter(s => s.id !== id));
  const togglePose = (id: string) => setSelectedPoses(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const updateCell = (shoeId: string, cell: 'studio' | string, patch: Partial<CellState>) => {
    setShoes(prev => prev.map(s => {
      if (s.id !== shoeId) return s;
      if (cell === 'studio') return { ...s, studio: { ...s.studio, ...patch } };
      return { ...s, poses: { ...s.poses, [cell]: { ...(s.poses[cell] || { state: 'idle' }), ...patch } } };
    }));
  };

  const runBatch = async () => {
    if (shoes.length === 0 || selectedPoses.length === 0) return;
    setRunning(true);
    setError(null);
    setNeedCredits(false);
    cancelRef.current.aborted = false;

    // İnit: her ayakkabıya seçili pozları pending olarak bas
    setShoes(prev => prev.map(s => ({
      ...s,
      studio: { state: 'pending' },
      poses: Object.fromEntries(selectedPoses.map(p => [p, { state: 'pending' as const }])),
    })));

    const limit = pLimit(3);

    const runShoe = async (shoe: BatchShoe) => {
      if (cancelRef.current.aborted) return;
      try {
        // Stage 1
        const startRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vibe: 'Stüdyo',
            shoeType,
            material: 'premium material',
            imageUrl: shoe.preview,
            aspectRatio,
            preserveForm: true,
            preserveDetails: true,
            pairMode: pairAuto ? 'auto' : 'off',
          }),
        });
        const startData = await safeJson(startRes);
        if (!startRes.ok) {
          if (startRes.status === 402 || startData.code === 'insufficient_credits') setNeedCredits(true);
          throw new Error(startData.error || 'Stage 1 hatası');
        }
        const studioUrl = await pollTask(startData.taskId);
        updateCell(shoe.id, 'studio', { state: 'success', url: studioUrl });

        if (cancelRef.current.aborted) return;

        // Stage 2 — her poz paralel (kendi içinde de pLimit(3))
        const poseLimit = pLimit(3);
        await Promise.all(selectedPoses.map(poseId => poseLimit(async () => {
          if (cancelRef.current.aborted) {
            updateCell(shoe.id, poseId, { state: 'failed', error: t('batch.cancelled') });
            return;
          }
          try {
            const r = await fetch('/api/generate/vibe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studioImageUrl: studioUrl,
                isDesignMode: false,
                vibe: 'Pose',
                poseId,
                shoeType,
                aspectRatio,
                preserveForm: true,
                preserveDetails: true,
              }),
            });
            const d = await safeJson(r);
            if (!r.ok) {
              if (r.status === 402 || d.code === 'insufficient_credits') setNeedCredits(true);
              throw new Error(d.error || 'Vibe hatası');
            }
            const url = await pollTask(d.taskId);
            updateCell(shoe.id, poseId, { state: 'success', url });
            // Persist (best-effort)
            fetch('/api/generate/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resultUrl: url,
                mode: 'foto',
                vibe: poseId,
                shoeType,
                aspectRatio,
              }),
            }).catch(() => {});
          } catch (e) {
            updateCell(shoe.id, poseId, { state: 'failed', error: (e as Error).message });
          }
        })));
      } catch (e) {
        updateCell(shoe.id, 'studio', { state: 'failed', error: (e as Error).message });
        // Tüm pozları failed yap
        setShoes(prev => prev.map(s => s.id === shoe.id ? {
          ...s,
          poses: Object.fromEntries(selectedPoses.map(p => [p, { state: 'failed' as const, error: 'Stage 1 başarısız' }])),
        } : s));
      }
    };

    await Promise.all(shoes.map(s => limit(() => runShoe(s))));
    setRunning(false);
  };

  const cancelBatch = () => {
    cancelRef.current.aborted = true;
    setRunning(false);
  };

  const downloadZip = async () => {
    setZipBusy(true);
    try {
      const zip = new JSZip();
      const ts = Date.now();
      for (let i = 0; i < shoes.length; i++) {
        const shoe = shoes[i];
        const safeName = shoe.name.replace(/[^a-z0-9._-]/gi, '_').replace(/\.[^.]+$/, '');
        const folder = zip.folder(`shoe_${i + 1}_${safeName}`);
        if (!folder) continue;
        // Stage 1
        if (shoe.studio.state === 'success' && shoe.studio.url) {
          try {
            const blob = await (await fetch(shoe.studio.url)).blob();
            folder.file('00_studio.jpg', blob);
          } catch {}
        }
        for (const [poseId, cell] of Object.entries(shoe.poses)) {
          if (cell.state === 'success' && cell.url) {
            try {
              const blob = await (await fetch(cell.url)).blob();
              folder.file(`${poseId}.jpg`, blob);
            } catch {}
          }
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `fasheone_batch_${ts}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError((e as Error).message || t('batch.zipError'));
    } finally {
      setZipBusy(false);
    }
  };

  const successCount = shoes.reduce((acc, s) => acc + Object.values(s.poses).filter(p => p.state === 'success').length, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans">
      <AppNav />
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT — settings */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-1">{t('batch.title')}</h2>
              <p className="text-xs text-zinc-500 mb-4">{t('batch.description')}</p>

              <div
                className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${shoes.length >= MAX_SHOES ? 'border-zinc-800 bg-zinc-900/40 cursor-not-allowed' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
                onClick={() => shoes.length < MAX_SHOES && fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); if (shoes.length < MAX_SHOES && e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
              >
                <div className="text-center px-4">
                  <div className="text-2xl mb-1">📁</div>
                  <span className="text-sm font-medium text-zinc-300">{t('batch.upload')}</span>
                  <div className="text-xs text-zinc-500 mt-1">{shoes.length} / {MAX_SHOES} {t('batch.shoes')}</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
              </div>

              {shoes.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                  {shoes.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2 bg-zinc-800/40 rounded p-1.5">
                      <div className="w-8 h-8 bg-zinc-950 rounded overflow-hidden shrink-0">
                        {s.preview && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.preview} alt={s.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate">{i + 1}. {s.name}</div>
                        <div className="text-[10px] text-zinc-500">{(s.size / 1024).toFixed(0)} KB</div>
                      </div>
                      {!running && <button onClick={() => removeShoe(s.id)} className="text-xs text-zinc-500 hover:text-red-300">✕</button>}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">{t('batch.type')}</label>
                  <select value={shoeType} onChange={e => setShoeType(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 text-xs rounded p-1.5 outline-none focus:border-indigo-500">
                    {SHOE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">{t('batch.aspect')}</label>
                  <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as '1:1' | '4:5' | '16:9')} className="w-full bg-zinc-800/50 border border-zinc-700 text-xs rounded p-1.5 outline-none focus:border-indigo-500">
                    <option value="1:1">1:1</option>
                    <option value="4:5">4:5</option>
                    <option value="16:9">16:9</option>
                  </select>
                </div>
              </div>

              <label className="mt-3 flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={pairAuto} onChange={e => setPairAuto(e.target.checked)} className="accent-indigo-500" />
                <span className="text-zinc-300">{t('batch.autoPair')}</span>
              </label>
            </div>

            <PoseGrid selected={selectedPoses} onToggle={togglePose} onClear={() => setSelectedPoses([])} />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex flex-col gap-2">
                <span>{error}</span>
                {needCredits && <Link href="/pricing" className="self-start px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Kredi Al →</Link>}
              </div>
            )}

            <div className="flex gap-2">
              {!running ? (
                <button
                  onClick={runBatch}
                  disabled={shoes.length === 0 || selectedPoses.length === 0}
                  className={`flex-1 p-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    shoes.length === 0 || selectedPoses.length === 0
                      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-100 hover:bg-white text-zinc-900'
                  }`}
                >
                  {t('batch.produceButton')} ({shoes.length} × {selectedPoses.length} = {shoes.length * selectedPoses.length} {t('batch.images')})
                </button>
              ) : (
                <button onClick={cancelBatch} className="flex-1 p-3 rounded-xl font-semibold text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200">
                  {t('batch.cancelButton')}
                </button>
              )}
              <button
                onClick={downloadZip}
                disabled={zipBusy || successCount === 0}
                className={`px-4 rounded-xl text-sm font-medium border ${zipBusy || successCount === 0 ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border-zinc-700' : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-100'}`}
              >
                {zipBusy ? '…' : `↓ ZIP (${successCount})`}
              </button>
            </div>
          </div>

          {/* RIGHT — progress grid */}
          <div className="lg:col-span-8 space-y-3">
            {shoes.length === 0 ? (
              <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-12 text-center text-zinc-500">
                {t('batch.placeholder')}
              </div>
            ) : (
              <>
                {totalTarget > 0 && (
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-zinc-300 font-medium">{t('batch.progress')}</span>
                      <span className="text-emerald-300">{totalDone} / {totalTarget}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all" style={{ width: `${totalTarget ? (totalDone / totalTarget) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}

                {shoes.map((shoe, idx) => (
                  <div key={shoe.id} className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-zinc-950 rounded overflow-hidden shrink-0 ring-1 ring-zinc-800">
                        {shoe.preview && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={shoe.preview} alt={shoe.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{idx + 1}. {shoe.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {t('batch.stage1')}: <span className={shoe.studio.state === 'success' ? 'text-emerald-300' : shoe.studio.state === 'failed' ? 'text-red-300' : shoe.studio.state === 'pending' ? 'text-amber-300' : 'text-zinc-500'}>{shoe.studio.state}</span>
                        </div>
                      </div>
                    </div>

                    {selectedPoses.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {selectedPoses.map(poseId => {
                          const meta = POSE_LIST.find(p => p.id === poseId);
                          const cell = shoe.poses[poseId] || { state: 'idle' as const };
                          return (
                            <div key={poseId} className="relative aspect-[3/4] bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden">
                              {cell.state === 'idle' && (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600 text-center px-2">
                                  {meta?.icon} {meta?.label}
                                </div>
                              )}
                              {cell.state === 'pending' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mb-1"></div>
                                  <div className="text-[9px] text-zinc-500 truncate px-1">{meta?.label}</div>
                                </div>
                              )}
                              {cell.state === 'failed' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 p-2">
                                  <div className="text-[10px] text-red-300 line-clamp-3">{cell.error || 'hata'}</div>
                                </div>
                              )}
                              {cell.state === 'success' && cell.url && (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={cell.url} alt={meta?.label} className="w-full h-full object-cover" />
                                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="text-[9px] text-white truncate">{meta?.icon} {meta?.label}</div>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
