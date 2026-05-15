"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import JSZip from 'jszip';
import AppNav from './_components/AppNav';
import PoseGrid, { POSE_LIST } from './_components/PoseGrid';

type HistoryItem = { id: string; url: string; mode: 'foto' | 'tasarim' | 'rotush'; vibe: string | null; ts: number };
const HISTORY_MAX = 24;

const SHOE_TYPES = ['Genel Ayakkabı', 'Sneaker', 'Boots', 'Heels', 'Loafers', 'Sandals', 'Kids Shoes'];
const SCENES = [
  { id: 'Stüdyo', label: 'Marketplace Stüdyo', desc: 'Saf beyaz fon', icon: '📸' },
  { id: 'Albüm', label: 'Albüm / Kolaj', desc: 'Editoryal katalog', icon: '📓' },
  { id: 'Sokak', label: 'Sokak Stili', desc: 'Islak asfalt, neon', icon: '🌆' },
  { id: 'Oturma', label: 'Oturan Model', desc: 'Koltukta oturuyor, ayaklar yerde, yüz gözükmüyor', icon: '🛋️' },
  { id: 'Ayakta', label: 'Ayakta Model', desc: 'Belden aşağı, farklı duruşlar, yüz yok', icon: '🚶‍♀️' },
  { id: 'Lüks', label: 'Premium Lüks', desc: 'Mermer zemin, yumuşak ışık', icon: '✨' }
];

type MultiPoseResult = { poseId: string; state: 'pending' | 'success' | 'failed'; url?: string; error?: string };
const POSE_CATALOG = POSE_LIST;

const RETOUCH_REGIONS = [
  { id: 'laces', label: 'Bağcık' },
  { id: 'upper', label: 'Üst kısım' },
  { id: 'toe cap', label: 'Burun (toe cap)' },
  { id: 'heel counter', label: 'Topuk' },
  { id: 'tongue', label: 'Dil' },
  { id: 'outsole', label: 'Taban' },
  { id: 'midsole', label: 'Orta taban' },
  { id: 'lining', label: 'Astar' },
  { id: 'buckle/accessory', label: 'Toka / Aksesuar' },
  { id: 'logo/branding', label: 'Logo / Marka' },
];

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<'foto' | 'tasarim' | 'rotush'>('foto');

  // Rötuş state
  const [retouchSource, setRetouchSource] = useState<string | null>(null);
  const [retouchReference, setRetouchReference] = useState<string | null>(null);
  const [retouchInstruction, setRetouchInstruction] = useState('');
  const [retouchRegion, setRetouchRegion] = useState<string>('');
  const [retouchColor, setRetouchColor] = useState('');
  const [retouchResult, setRetouchResult] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(48);
  const [hasMask, setHasMask] = useState(false);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);   // saf maske (siyah/beyaz) — API'ye gider
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null); // kullanıcının gördüğü overlay
  const isPaintingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  
  // Foto State
  const [image, setImage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('Genel Ayakkabı');
  const [selectedVibe, setSelectedVibe] = useState('Stüdyo');
  
  // Tasarım State
  const [designPrompt, setDesignPrompt] = useState('');
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [leatherImage, setLeatherImage] = useState<string | null>(null);
  const [accessoryImage, setAccessoryImage] = useState<string | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<string | null>(null);
  const [soleImage, setSoleImage] = useState<string | null>(null);

  // Global State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Quality / Output controls
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('1:1');
  const [preserveForm, setPreserveForm] = useState(true);
  const [preserveDetails, setPreserveDetails] = useState(true);

  // Çoklu poz kataloğu — toggle edilen pozlar
  const [selectedPoses, setSelectedPoses] = useState<string[]>([]);
  const [multiResults, setMultiResults] = useState<MultiPoseResult[]>([]);
  const togglePose = (id: string) => setSelectedPoses(prev =>
    prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
  );

  // Toplu indirme & albüm üretim durumu
  const [bulkBusy, setBulkBusy] = useState(false);
  const [albumBusy, setAlbumBusy] = useState(false);
  const [albumUrl, setAlbumUrl] = useState<string | null>(null);

  const successResults = multiResults.filter(m => m.state === 'success' && m.url);

  const bulkDownload = async () => {
    if (successResults.length === 0) return;
    setBulkBusy(true);
    try {
      const zip = new JSZip();
      const ts = Date.now();
      await Promise.all(successResults.map(async (m, i) => {
        try {
          const res = await fetch(m.url!);
          const blob = await res.blob();
          const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
          zip.file(`fasheone_${m.poseId}_${i + 1}.${ext}`, blob);
        } catch {
          // skip failed downloads
        }
      }));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const objectUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `fasheone_album_${ts}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setError((e as Error).message || 'Toplu indirme hatası');
    } finally {
      setBulkBusy(false);
    }
  };

  const buildAlbum = async () => {
    if (successResults.length < 2) {
      setError('Albüm için en az 2 başarılı poz gerekli');
      return;
    }
    setAlbumBusy(true);
    setAlbumUrl(null);
    setError(null);
    try {
      const safeJson = async (r: Response) => {
        const txt = await r.text();
        try { return JSON.parse(txt); }
        catch { throw new Error(`Sunucu yanıtı geçersiz (${r.status})`); }
      };
      const r = await fetch('/api/generate/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: successResults.map(s => s.url!),
          layout: 'magazine',
          aspectRatio: '16:9',
          shoeType: selectedType,
        }),
      });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d.error || 'Albüm başlatma hatası');

      // Poll
      const start = Date.now();
      let delay = 2000;
      let url = '';
      while (Date.now() - start < 240_000) {
        await new Promise(rs => setTimeout(rs, delay));
        const sr = await fetch(`/api/generate/status?taskId=${encodeURIComponent(d.taskId)}`);
        const sd = await safeJson(sr);
        if (!sr.ok) throw new Error(sd.error || 'Status hatası');
        if (sd.state === 'success') { url = sd.resultUrl; break; }
        if (sd.state === 'failed') throw new Error(sd.error || 'Albüm başarısız');
        delay = Math.min(Math.floor(delay * 1.3), 5000);
      }
      if (!url) throw new Error('Albüm zaman aşımına uğradı');

      setAlbumUrl(url);
      // Persist
      const saveRes = await fetch('/api/generate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultUrl: url,
          mode: activeTab,
          vibe: 'Albüm',
          shoeType: selectedType,
          aspectRatio: '16:9',
        }),
      });
      const sd = await safeJson(saveRes).catch(() => ({}));
      if (sd?.generation) pushHistory(url, sd.generation);
    } catch (e) {
      setError((e as Error).message || 'Albüm hatası');
    } finally {
      setAlbumBusy(false);
    }
  };

  // History (Supabase)
  const supabase = React.useMemo(() => createClient(), []);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const refreshHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('generations')
      .select('id, result_url, mode, vibe, created_at')
      .order('created_at', { ascending: false })
      .limit(HISTORY_MAX);
    if (error || !data) return;
    setHistory(data.map(d => ({
      id: d.id,
      url: d.result_url,
      mode: d.mode as 'foto' | 'tasarim' | 'rotush',
      vibe: d.vibe,
      ts: new Date(d.created_at).getTime(),
    })));
  }, [supabase]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const pushHistory = (url: string, generation?: { id: string; created_at: string } | null) => {
    if (!generation) return refreshHistory();
    setHistory(prev => [{
      id: generation.id,
      url,
      mode: activeTab,
      vibe: selectedVibe,
      ts: new Date(generation.created_at).getTime(),
    }, ...prev].slice(0, HISTORY_MAX));
  };

  const removeHistory = async (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    await supabase.from('generations').delete().eq('id', id);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sketchRef = useRef<HTMLInputElement>(null);
  const leatherRef = useRef<HTMLInputElement>(null);
  const accessoryRef = useRef<HTMLInputElement>(null);
  const secondaryRef = useRef<HTMLInputElement>(null);
  const soleRef = useRef<HTMLInputElement>(null);
  const retouchSourceRef = useRef<HTMLInputElement>(null);
  const retouchReferenceRef = useRef<HTMLInputElement>(null);

  const MAX_BYTES = 8 * 1024 * 1024;
  const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp'];

  const readFile = (file: File, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (!ALLOWED_MIME.includes(file.type)) {
      setError(`Desteklenmeyen format: ${file.type || 'bilinmiyor'}`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Görsel çok büyük: ${(file.size / 1024 / 1024).toFixed(1)} MB (max 8 MB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setter(ev.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file, setter);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file, setter);
  };

  const handleGenerate = async () => {
    // Fotoğraf çekimi için resim zorunlu, tasarım için çizim veya prompt zorunlu olabilir
    if (activeTab === 'foto' && !image) return;
    if (activeTab === 'tasarim' && !designPrompt && !sketchImage) return;

    setLoading(true);
    setError(null);
    setMultiResults([]);
    setAlbumUrl(null);
    try {
      const payload: {
        vibe: string;
        shoeType: string;
        material: string;
        prompt?: string;
        imageUrl: string | null;
        references?: { sketch?: string; sole?: string; leather?: string; accessory?: string; secondary?: string };
        aspectRatio: string;
        preserveForm: boolean;
        preserveDetails: boolean;
        pairMode: 'auto' | 'off';
      } = {
        vibe: selectedVibe,
        shoeType: selectedType,
        material: 'premium material',
        prompt: activeTab === 'tasarim' ? designPrompt : undefined,
        imageUrl: activeTab === 'foto' ? image : (sketchImage || soleImage || leatherImage || accessoryImage || secondaryImage),
        aspectRatio,
        preserveForm,
        preserveDetails,
        pairMode: 'auto',
      };

      if (activeTab === 'tasarim') {
        payload.references = {
          sketch: sketchImage || undefined,
          sole: soleImage || undefined,
          leather: leatherImage || undefined,
          accessory: accessoryImage || undefined,
          secondary: secondaryImage || undefined,
        };
      }

      const safeJson = async (r: Response) => {
        const txt = await r.text();
        try { return JSON.parse(txt); }
        catch { throw new Error(`Sunucu yanıtı geçersiz (${r.status}). Tekrar deneyin.`); }
      };

      const pollTask = async (taskId: string, totalMs = 240_000): Promise<string> => {
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
      };

      // Stage 1
      const startRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const startData = await safeJson(startRes);
      if (!startRes.ok) throw new Error(startData.error || 'Başlatma hatası');
      const studioUrl = await pollTask(startData.taskId);

      // ÇOKLU POZ AKIŞI — seçilen her poz için paralel üretim
      if (selectedPoses.length > 0) {
        const seed = Math.floor(Math.random() * 1_000_000_000);
        setMultiResults(selectedPoses.map(id => ({ poseId: id, state: 'pending' })));

        await Promise.all(selectedPoses.map(async (poseId) => {
          try {
            const r = await fetch('/api/generate/vibe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studioImageUrl: studioUrl,
                isDesignMode: startData.isDesignMode,
                vibe: 'Pose',
                poseId,
                shoeType: selectedType,
                material: 'premium material',
                prompt: activeTab === 'tasarim' ? designPrompt : undefined,
                aspectRatio,
                preserveForm,
                preserveDetails,
                seed,
              }),
            });
            const d = await safeJson(r);
            if (!r.ok) throw new Error(d.error || 'Poz başlatma hatası');
            const url = await pollTask(d.taskId);
            // Persist
            await fetch('/api/generate/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resultUrl: url,
                mode: activeTab,
                vibe: poseId,
                shoeType: selectedType,
                prompt: activeTab === 'tasarim' ? designPrompt : undefined,
                aspectRatio,
              }),
            }).then(rs => safeJson(rs).catch(() => ({}))).then((sd: { generation?: { id: string; created_at: string } }) => {
              if (sd?.generation) pushHistory(url, sd.generation);
            });
            setMultiResults(prev => prev.map(m => m.poseId === poseId ? { ...m, state: 'success', url } : m));
          } catch (poseErr) {
            const m = (poseErr as Error).message || 'Hata';
            setMultiResults(prev => prev.map(p => p.poseId === poseId ? { ...p, state: 'failed', error: m } : p));
          }
        }));
        return;
      }

      let finalUrl = studioUrl;
      const needsVibe = !!selectedVibe && selectedVibe !== 'Stüdyo';
      if (needsVibe) {
        // Stage 2
        const vibeStart = await fetch('/api/generate/vibe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studioImageUrl: studioUrl,
            isDesignMode: startData.isDesignMode,
            vibe: selectedVibe,
            shoeType: selectedType,
            material: 'premium material',
            prompt: activeTab === 'tasarim' ? designPrompt : undefined,
            aspectRatio,
            preserveForm,
            preserveDetails,
          }),
        });
        const vibeData = await safeJson(vibeStart);
        if (!vibeStart.ok) throw new Error(vibeData.error || 'Vibe başlatma hatası');
        finalUrl = await pollTask(vibeData.taskId);
      }

      // Persist
      const saveRes = await fetch('/api/generate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultUrl: finalUrl,
          mode: activeTab,
          vibe: selectedVibe,
          shoeType: selectedType,
          prompt: activeTab === 'tasarim' ? designPrompt : undefined,
          aspectRatio,
        }),
      });
      const saveData = await safeJson(saveRes).catch(() => ({}));
      setResult(finalUrl);
      pushHistory(finalUrl, saveData.generation ?? null);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  // Maskeyi temizle (her iki canvas'ı sıfırla, görseli tekrar çiz)
  const clearMask = useCallback(() => {
    const m = maskCanvasRef.current;
    const d = displayCanvasRef.current;
    const img = sourceImgRef.current;
    if (!m || !d) return;
    const mctx = m.getContext('2d');
    const dctx = d.getContext('2d');
    if (!mctx || !dctx) return;
    mctx.clearRect(0, 0, m.width, m.height);
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, m.width, m.height);
    dctx.clearRect(0, 0, d.width, d.height);
    if (img && img.complete) {
      dctx.drawImage(img, 0, 0, d.width, d.height);
    }
    setHasMask(false);
  }, []);

  // Kaynak görseli canvas'a yükle (her source/result değişiminde tetiklenir)
  useEffect(() => {
    if (activeTab !== 'rotush') return;
    const src = retouchSource || result;
    if (!src) return;
    const display = displayCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!display || !mask) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Sabit yüksekliğe oturt, en-boy oranı koru
      const MAX_W = 800;
      const MAX_H = 700;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const ratio = Math.min(MAX_W / w, MAX_H / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      display.width = w;
      display.height = h;
      mask.width = w;
      mask.height = h;

      const dctx = display.getContext('2d');
      const mctx = mask.getContext('2d');
      if (!dctx || !mctx) return;
      dctx.drawImage(img, 0, 0, w, h);
      mctx.fillStyle = '#000';
      mctx.fillRect(0, 0, w, h);
      sourceImgRef.current = img;
      setHasMask(false);
    };
    img.onerror = () => {
      // CORS engellerse: fetch → blob → object URL ile tekrar dene
      fetch(src).then(r => r.blob()).then(b => {
        img.src = URL.createObjectURL(b);
      }).catch(() => undefined);
    };
    img.src = src;
  }, [activeTab, retouchSource, result]);

  // Fırça vuruşu — hem maske hem display canvas'ına yazar
  const paintAt = (clientX: number, clientY: number) => {
    const display = displayCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!display || !mask) return;
    const rect = display.getBoundingClientRect();
    const scaleX = display.width / rect.width;
    const scaleY = display.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const r = (brushSize * scaleX) / 2;

    const mctx = mask.getContext('2d');
    const dctx = display.getContext('2d');
    if (!mctx || !dctx) return;

    // Çizgisel boya: önceki nokta varsa aradaki segmenti doldur
    const last = lastPointRef.current;
    mctx.fillStyle = '#fff';
    dctx.fillStyle = 'rgba(34, 211, 238, 0.45)'; // cyan-ish
    const stamp = (px: number, py: number) => {
      mctx.beginPath();
      mctx.arc(px, py, r, 0, Math.PI * 2);
      mctx.fill();
      dctx.beginPath();
      dctx.arc(px, py, r, 0, Math.PI * 2);
      dctx.fill();
    };
    if (last) {
      const steps = Math.max(1, Math.floor(Math.hypot(x - last.x, y - last.y) / 4));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        stamp(last.x + (x - last.x) * t, last.y + (y - last.y) * t);
      }
    } else {
      stamp(x, y);
    }
    lastPointRef.current = { x, y };
    if (!hasMask) setHasMask(true);
  };

  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    isPaintingRef.current = true;
    lastPointRef.current = null;
    paintAt(e.clientX, e.clientY);
  };
  const onCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current) return;
    paintAt(e.clientX, e.clientY);
  };
  const onCanvasUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPaintingRef.current = false;
    lastPointRef.current = null;
    try { (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const exportMaskDataUrl = (): string | null => {
    if (!hasMask) return null;
    const m = maskCanvasRef.current;
    if (!m) return null;
    return m.toDataURL('image/png');
  };

  const handleRetouch = async () => {
    const source = retouchSource || result;
    if (!source) {
      setError('Önce kaynak görsel seç (yükle veya son sonucu kullan)');
      return;
    }
    if (!retouchInstruction.trim() && !retouchReference && !retouchColor) {
      setError('Talimat, renk veya referans görselden en az birini ver');
      return;
    }
    setLoading(true);
    setError(null);
    setRetouchResult(null);
    try {
      const safeJson = async (r: Response) => {
        const txt = await r.text();
        try { return JSON.parse(txt); }
        catch { throw new Error(`Sunucu yanıtı geçersiz (${r.status})`); }
      };
      const pollTask = async (taskId: string, totalMs = 240_000): Promise<string> => {
        const start = Date.now();
        let delay = 2000;
        while (Date.now() - start < totalMs) {
          await new Promise(r => setTimeout(r, delay));
          const sr = await fetch(`/api/generate/status?taskId=${encodeURIComponent(taskId)}`);
          const sd = await safeJson(sr);
          if (!sr.ok) throw new Error(sd.error || 'Status hatası');
          if (sd.state === 'success') return sd.resultUrl as string;
          if (sd.state === 'failed') throw new Error(sd.error || 'Rötuş başarısız');
          delay = Math.min(Math.floor(delay * 1.3), 5000);
        }
        throw new Error('Rötuş zaman aşımına uğradı');
      };

      const maskUrl = exportMaskDataUrl();
      const r = await fetch('/api/generate/retouch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: source,
          maskUrl: maskUrl || undefined,
          referenceUrl: retouchReference || undefined,
          instruction: retouchInstruction || undefined,
          region: retouchRegion || undefined,
          color: retouchColor || undefined,
          aspectRatio,
        }),
      });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d.error || 'Rötuş başlatma hatası');

      const url = await pollTask(d.taskId);
      setRetouchResult(url);
      setResult(url); // ana önizlemeyi de güncelle

      // Persist
      const saveRes = await fetch('/api/generate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultUrl: url,
          mode: 'foto',
          vibe: 'Rötuş',
          shoeType: selectedType,
          aspectRatio,
        }),
      });
      const sd = await safeJson(saveRes).catch(() => ({}));
      if (sd?.generation) pushHistory(url, sd.generation);
    } catch (e) {
      setError((e as Error).message || 'Rötuş hatası');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `fasheone_ayakkabi_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Zoom Modal */}
      {isZoomed && result && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4" onClick={() => setIsZoomed(false)}>
          <button onClick={() => setIsZoomed(false)} className="absolute top-6 right-6 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
           {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result} alt="Zoomed Result" className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <AppNav />

      <div className="max-w-[1600px] mx-auto p-6 h-[calc(100vh-73px)]">
        
        {/* 3-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* LEFT PANEL - CONFIGURATION */}
          <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Tabs */}
            <div className="flex gap-1.5 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800/80">
              <button
                onClick={() => setActiveTab('foto')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${activeTab === 'foto' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Fotoğraf
              </button>
              <button
                onClick={() => setActiveTab('tasarim')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${activeTab === 'tasarim' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                AI Tasarım
              </button>
              <button
                onClick={() => setActiveTab('rotush')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${activeTab === 'rotush' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Rötuş
              </button>
            </div>

            {activeTab === 'rotush' ? (
              <div className="flex flex-col gap-4">
                {/* Kaynak Görsel */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center justify-between">
                    Kaynak Görsel
                    {retouchSource && <button onClick={() => setRetouchSource(null)} className="text-xs text-red-400 hover:text-red-300">Temizle</button>}
                  </h3>
                  <div
                    className={`relative group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      (retouchSource || result) ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
                    }`}
                    onDragOver={handleDrag}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={(e) => handleDrop(e, setRetouchSource)}
                    onClick={() => retouchSourceRef.current?.click()}
                  >
                    {(retouchSource || result) ? (
                      <>
                        <div className="absolute inset-0 p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={(retouchSource || result) as string} alt="Source" className="w-full h-full object-contain rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all rounded-xl">
                          <span className="opacity-0 group-hover:opacity-100 text-xs font-medium text-white bg-cyan-600/90 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Görseli Değiştir
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center px-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <span className="text-sm font-medium text-zinc-300">Görsel Yükle</span>
                        <p className="text-[10px] text-zinc-500 mt-1">Sürükle-bırak veya tıkla</p>
                      </div>
                    )}
                    <input type="file" ref={retouchSourceRef} className="hidden" accept="image/*" onChange={e => handleFile(e, setRetouchSource)} />
                  </div>
                  {result && !retouchSource && (
                    <p className="mt-2 text-[10px] text-cyan-400/70">↑ Son üretilen sonuç otomatik seçildi. Hover'la "Değiştir"e tıklayarak başka görsel yükleyebilirsin.</p>
                  )}
                </div>

                {/* DEĞİŞTİRİLECEK / EKLENECEK Referans Görsel — kaynak'tan hemen sonra geliyor */}
                <div className="bg-cyan-500/5 border-2 border-cyan-500/30 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>🔄</span>
                      <span>Değiştirilecek / Eklenecek Görsel</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-normal normal-case">opsiyonel</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mb-3">Bu görseldeki materyal/renk/desen, kaynak ayakkabıda işaretli bölgeye uygulanır.</p>

                  <div
                    className={`relative group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      retouchReference ? 'border-cyan-400 bg-cyan-500/10' : 'border-cyan-700/60 bg-zinc-950/30 hover:border-cyan-500 hover:bg-cyan-500/5'
                    }`}
                    onDragOver={handleDrag}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={(e) => handleDrop(e, setRetouchReference)}
                    onClick={() => retouchReferenceRef.current?.click()}
                  >
                    {retouchReference ? (
                      <>
                        <div className="absolute inset-0 p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={retouchReference} alt="Reference" className="w-full h-full object-contain rounded-lg opacity-90 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all rounded-xl">
                          <span className="opacity-0 group-hover:opacity-100 text-xs font-medium text-white bg-cyan-600/90 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Görseli Değiştir
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-2 text-cyan-300 ring-2 ring-cyan-500/30">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <span className="text-sm font-medium text-cyan-200">Görsel Yükle</span>
                        <p className="text-[10px] text-zinc-500 mt-1">Sürükle-bırak veya tıkla</p>
                      </div>
                    )}
                    <input type="file" ref={retouchReferenceRef} className="hidden" accept="image/*" onChange={e => handleFile(e, setRetouchReference)} />
                  </div>

                  {/* Her zaman görünür explicit butonlar */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => retouchReferenceRef.current?.click()}
                      className="flex-1 px-3 py-2 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {retouchReference ? 'Yeniden Yükle' : 'Görsel Seç'}
                    </button>
                    {retouchReference && (
                      <button
                        type="button"
                        onClick={() => setRetouchReference(null)}
                        className="px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-red-900/40 text-zinc-300 hover:text-red-300 border border-zinc-700 rounded-lg transition"
                      >
                        Temizle
                      </button>
                    )}
                  </div>
                </div>

                {/* Bölge */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center justify-between">
                    Hedef Bölge <span className="text-[10px] text-zinc-500 normal-case">opsiyonel</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {RETOUCH_REGIONS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setRetouchRegion(retouchRegion === r.id ? '' : r.id)}
                        className={`px-2.5 py-1 text-[11px] rounded-md border transition ${
                          retouchRegion === r.id
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                            : 'bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Renk + Talimat */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center justify-between">
                      Renk <span className="text-[10px] text-zinc-500 normal-case">opsiyonel</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={retouchColor || '#000000'}
                        onChange={e => setRetouchColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-zinc-700"
                      />
                      <input
                        type="text"
                        value={retouchColor}
                        onChange={e => setRetouchColor(e.target.value)}
                        placeholder="#ff3366 veya 'kırmızı'"
                        className="flex-1 bg-zinc-950/50 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                      {retouchColor && (
                        <button onClick={() => setRetouchColor('')} className="text-xs text-zinc-500 hover:text-red-300">✕</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Talimat</h3>
                    <textarea
                      placeholder="Örn: bağcıkları kırmızıya çevir, tabanı daha kalın yap, toka altın renge dönsün..."
                      className="w-full h-20 bg-zinc-950/50 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 resize-none"
                      value={retouchInstruction}
                      onChange={e => setRetouchInstruction(e.target.value)}
                    />
                  </div>
                </div>

              </div>
            ) : activeTab === 'foto' ? (
              <>
                {/* Upload Area for Photo Mode */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center justify-between">
                    Referans Görsel
                    {image && <button onClick={() => setImage(null)} className="text-xs text-red-400 hover:text-red-300">Temizle</button>}
                  </h3>
                  
                  <div 
                    className={`relative group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      image ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
                    }`}
                    onDragOver={handleDrag}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={(e) => handleDrop(e, setImage)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {image ? (
                      <div className="absolute inset-0 p-2">
                        <img src={image} alt="Upload" className="w-full h-full object-contain rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="text-center px-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <span className="text-sm font-medium text-zinc-300">Görsel Yükle</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => handleFile(e, setImage)} />
                  </div>
                </div>

                {/* Vibe Selection */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Çekim Senaryosu (Atmosfer)</h3>
                  <div className="space-y-2">
                    {SCENES.map(scene => (
                      <button
                        key={scene.id}
                        onClick={() => setSelectedVibe(scene.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selectedVibe === scene.id
                            ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                            : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                          selectedVibe === scene.id ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {scene.icon}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${selectedVibe === scene.id ? 'text-indigo-300' : 'text-zinc-200'}`}>
                            {scene.label}
                          </div>
                          <div className="text-xs text-zinc-500">{scene.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <PoseGrid
                  selected={selectedPoses}
                  onToggle={togglePose}
                  onClear={() => setSelectedPoses([])}
                />
                <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-3 text-[11px] text-zinc-400 leading-relaxed">
                  <span className="text-emerald-300 font-medium">✓ Aktif:</span> Tek tekli ayakkabı yüklendiğinde otomatik olarak <span className="text-emerald-200">doğru aynalanmış L+R çift</span> üretilir. Ayakkabıda <span className="text-emerald-200">sıfır değişiklik</span> garantisi ve 30+ yıllık ayakkabı ustası persona&apos;sı tüm promptlara enjekte edilir.
                </div>
              </>
            ) : (
              /* TAB: TASARIM MODU */
              <div className="flex flex-col gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">Ayakkabı Modeli Stili</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SHOE_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                          selectedType === type 
                            ? 'bg-zinc-100/10 text-cyan-400 border-cyan-500/50' 
                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <h3 className="text-sm font-medium text-zinc-300 mb-2 mt-4">Tasarım Promptu</h3>
                  <textarea
                    placeholder="Örn: Fütüristik neon çizgileri olan, kalın tabanlı deri sneaker tasarımı..."
                    className="w-full h-24 bg-zinc-950/50 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                    value={designPrompt}
                    onChange={e => setDesignPrompt(e.target.value)}
                  />
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Referans Çizim (Sketch)</h3>
                    <div 
                      className="h-16 border border-dashed border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800 overflow-hidden relative"
                      onClick={() => sketchRef.current?.click()}
                    >
                      {sketchImage ? <img src={sketchImage} alt="Sketch" className="w-full h-full object-cover opacity-60 hover:opacity-100" /> : <span className="text-xs text-zinc-500">+ Yükle</span>}
                      <input type="file" ref={sketchRef} className="hidden" accept="image/*" onChange={e => handleFile(e, setSketchImage)} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide truncate">Deri & Kumaş Doku</h3>
                    <div 
                      className="h-16 border border-dashed border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800 overflow-hidden relative"
                      onClick={() => leatherRef.current?.click()}
                    >
                      {leatherImage ? <img src={leatherImage} alt="Leather" className="w-full h-full object-cover opacity-60 hover:opacity-100" /> : <span className="text-xs text-zinc-500">+ Yükle</span>}
                      <input type="file" ref={leatherRef} className="hidden" accept="image/*" onChange={e => handleFile(e, setLeatherImage)} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide truncate">Toka & Aksesuar</h3>
                    <div 
                      className="h-16 border border-dashed border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800 overflow-hidden relative"
                      onClick={() => accessoryRef.current?.click()}
                    >
                      {accessoryImage ? <img src={accessoryImage} alt="Acc" className="w-full h-full object-cover opacity-60 hover:opacity-100" /> : <span className="text-xs text-zinc-500">+ Yükle</span>}
                      <input type="file" ref={accessoryRef} className="hidden" accept="image/*" onChange={e => handleFile(e, setAccessoryImage)} />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide flex items-center justify-between">
                      <span>Taban / Sole</span>
                      {soleImage && <button onClick={(e) => { e.stopPropagation(); setSoleImage(null); }} className="text-[10px] text-red-400 hover:text-red-300 normal-case">Temizle</button>}
                    </h3>
                    <div
                      className="h-16 border border-dashed border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800 overflow-hidden relative"
                      onClick={() => soleRef.current?.click()}
                    >
                      {soleImage ? <img src={soleImage} alt="Sole" className="w-full h-full object-cover opacity-60 hover:opacity-100" /> : <span className="text-xs text-zinc-500">+ Taban deseni / yüksekliği / kauçuk dokusu</span>}
                      <input type="file" ref={soleRef} className="hidden" accept="image/*" onChange={e => handleFile(e, setSoleImage)} />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">İkinci Kaplama / Bağcık Rengi</h3>
                    <div
                      className="h-12 border border-dashed border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800 overflow-hidden relative"
                      onClick={() => secondaryRef.current?.click()}
                    >
                      {secondaryImage ? <img src={secondaryImage} alt="Sec" className="w-full h-full object-cover opacity-60 hover:opacity-100" /> : <span className="text-xs text-zinc-500">+ Panel veya Bağcık Referansı</span>}
                      <input type="file" ref={secondaryRef} className="hidden" accept="image/*" onChange={e => handleFile(e, setSecondaryImage)} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MIDDLE PANEL - PREVIEW */}
          <div className="lg:col-span-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl relative overflow-hidden flex items-center justify-center min-h-[500px]">
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* RÖTUŞ SONUCU */}
            {activeTab === 'rotush' && retouchResult && !loading && (
              <div className="relative z-10 w-full h-full group p-4 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={retouchResult} alt="Retouch Result" className="max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-cyan-500/20" />
                <div className="absolute bottom-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setRetouchResult(null); setHasMask(false); }} className="px-5 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur border border-zinc-600 rounded-xl text-sm font-medium text-white shadow-xl">
                    Yeni Rötuş
                  </button>
                  <button onClick={() => { setRetouchSource(retouchResult); setRetouchResult(null); setHasMask(false); }} className="px-5 py-2.5 bg-cyan-700/90 hover:bg-cyan-600 backdrop-blur border border-cyan-400/50 rounded-xl text-sm font-medium text-white shadow-xl">
                    Bunun Üzerine Rötuş
                  </button>
                  <button onClick={() => downloadImage(retouchResult)} className="px-5 py-2.5 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur border border-indigo-400/50 rounded-xl text-sm font-medium text-white shadow-xl flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    İndir
                  </button>
                </div>
              </div>
            )}

            {/* RÖTUŞ MOD — büyük canvas + fırça */}
            {activeTab === 'rotush' && (retouchSource || result) && multiResults.length === 0 && !loading && !retouchResult && (
              <div className="relative z-10 w-full h-full p-4 flex flex-col">
                {/* Brush Toolbar */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">Fırça</span>
                    <input
                      type="range"
                      min={10}
                      max={150}
                      value={brushSize}
                      onChange={e => setBrushSize(parseInt(e.target.value, 10))}
                      className="w-32 accent-cyan-500"
                    />
                    <span className="text-xs text-cyan-300 w-8">{brushSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasMask && <span className="text-[11px] text-cyan-400">● Bölge işaretli</span>}
                    <button
                      onClick={clearMask}
                      disabled={!hasMask}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Maskeyi Temizle
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center overflow-auto custom-scrollbar">
                  <div className="relative inline-block">
                    <canvas
                      ref={displayCanvasRef}
                      onPointerDown={onCanvasDown}
                      onPointerMove={onCanvasMove}
                      onPointerUp={onCanvasUp}
                      onPointerCancel={onCanvasUp}
                      className="block max-w-full max-h-full rounded-lg shadow-2xl ring-1 ring-white/10 cursor-crosshair touch-none select-none"
                      style={{ background: '#0a0a0a' }}
                    />
                    <canvas ref={maskCanvasRef} className="hidden" />
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 text-center mt-2">
                  Görselin üzerinde değişmesini istediğin alanı boyayın. Fırça boyutunu üstten ayarlayın. Maske olmadan da göndererek serbest düzenleme yapabilirsiniz.
                </p>
              </div>
            )}

            {/* Çoklu Poz Sonuç Grid */}
            {multiResults.length > 0 && (
              <div className="relative z-10 w-full h-full p-4 overflow-y-auto custom-scrollbar">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800/60 sticky top-0 bg-zinc-900/70 backdrop-blur z-10 -mx-4 px-4">
                  <div className="text-xs text-zinc-400">
                    <span className="text-emerald-400 font-medium">{successResults.length}</span> / {multiResults.length} hazır
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={bulkDownload}
                      disabled={bulkBusy || successResults.length === 0}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      title="Tüm başarılı sonuçları ZIP olarak indir"
                    >
                      {bulkBusy ? (
                        <span className="w-3 h-3 border border-zinc-500 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      )}
                      Toplu İndir (ZIP)
                    </button>
                    <button
                      onClick={buildAlbum}
                      disabled={albumBusy || successResults.length < 2}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      title="Sonuçlardan editoryal albüm/kolaj oluştur"
                    >
                      {albumBusy ? (
                        <span className="w-3 h-3 border border-indigo-200 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                      )}
                      Albüm Oluştur
                    </button>
                  </div>
                </div>

                {/* Üretilen Albüm */}
                {albumUrl && (
                  <div className="mb-4 relative group rounded-xl overflow-hidden border border-indigo-500/30 bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={albumUrl} alt="Albüm" className="w-full object-contain max-h-[400px] cursor-pointer" onClick={() => { setResult(albumUrl); setIsZoomed(true); }} />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-indigo-500/80 text-white text-[10px] font-medium rounded">📓 ALBÜM</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadImage(albumUrl); }}
                      className="absolute top-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-medium rounded flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      İndir
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {multiResults.map(m => {
                    const meta = POSE_CATALOG.find(p => p.id === m.poseId);
                    return (
                      <div key={m.poseId} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 group">
                        {m.state === 'pending' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                            <div className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
                            <div className="text-[10px] text-zinc-400">{meta?.label}</div>
                          </div>
                        )}
                        {m.state === 'failed' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-red-500/10">
                            <div className="text-xs text-red-400 mb-1">Hata</div>
                            <div className="text-[10px] text-red-300/80 line-clamp-3">{m.error}</div>
                          </div>
                        )}
                        {m.state === 'success' && m.url && (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.url} alt={meta?.label || m.poseId} className="w-full h-full object-cover cursor-pointer" onClick={() => { setResult(m.url!); setIsZoomed(true); }} />
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                              <span className="text-[10px] text-white truncate flex items-center gap-1">{meta?.icon} {meta?.label}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); downloadImage(m.url!); }}
                                className="text-[10px] text-indigo-300 hover:text-white px-1.5 py-0.5 bg-indigo-500/30 rounded"
                                title="İndir"
                              >↓</button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Boş Ekran */}
            {multiResults.length === 0 && !result && (
              (activeTab === 'foto' && !image) ||
              (activeTab === 'tasarim' && !designPrompt && !sketchImage) ||
              (activeTab === 'rotush' && !retouchSource && !result)
            ) && (
              <div className="text-center z-10 px-6">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mx-auto mb-4 text-zinc-500 text-2xl">
                  {activeTab === 'foto' ? '📸' : activeTab === 'tasarim' ? '🎨' : '🪄'}
                </div>
                <h2 className="text-xl font-semibold text-zinc-300 mb-2">
                  {activeTab === 'foto' ? "Satışa Hazır Görseller Üretin" : activeTab === 'tasarim' ? "Kendi Modelinizi Tasarlayın" : "Hedefli Rötuş"}
                </h2>
                <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                  {activeTab === 'foto'
                    ? "Amatör fotoğrafları profesyonel stüdyo ve yaşam tarzı e-ticaret karelerine dönüştürün."
                    : activeTab === 'tasarim'
                      ? "Sınıfının en iyisi yapay zeka ile doku, renk ve çizim referanslarını kullanarak sıfırdan model tasarlayın."
                      : "Mevcut ayakkabıdaki tek bir bölgeyi (bağcık, taban, toka...) renk/talimat/referans ile değiştir, gerisi aynı kalsın."}
                </p>
              </div>
            )}

            {/* Input Önizleme */}
            {multiResults.length === 0 && !result && !loading && (
               (activeTab === 'foto' && image) || (activeTab === 'tasarim' && sketchImage) ? (
                <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
                  <img src={(activeTab === 'foto' ? image : sketchImage) as string} alt="Original" className="max-h-full object-contain filter drop-shadow-2xl opacity-80" />
                </div>
               ) : null
            )}

            {loading && (
              <div className="absolute inset-0 z-20 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-zinc-800 border-t-indigo-500 border-l-purple-500 rounded-full animate-spin mb-6"></div>
                <div className="text-lg font-medium text-zinc-100 animate-pulse tracking-wide">Üretim Motoru Aktif</div>
                <div className="text-sm text-zinc-400 mt-2">Doku aslına uygun şekilde korunuyor, dinamik arka plan oluşturuluyor...</div>
              </div>
            )}

            {multiResults.length === 0 && result && activeTab !== 'rotush' && (
              <div className="relative z-10 w-full h-full group p-4 flex items-center justify-center">
                <img src={result} alt="Result" className="max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-[1.02]" />
                
                <div className="absolute bottom-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setIsZoomed(true)} className="px-5 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur border border-zinc-600 rounded-xl text-sm font-medium flex items-center gap-2 text-white shadow-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    Büyüt
                  </button>
                  <button onClick={() => downloadImage(result)} className="px-5 py-2.5 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur border border-indigo-400/50 rounded-xl text-sm font-medium flex items-center gap-2 text-white shadow-xl">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    İndir
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - EXPORT & QUALITY */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 flex-1 break-words">
              <h3 className="text-sm font-medium text-zinc-300 mb-4 pb-3 border-b border-zinc-800/80">Üstün Koruma Filtreleri</h3>
              
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={preserveForm}
                    onChange={e => setPreserveForm(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition ${preserveForm ? 'border-indigo-500 bg-indigo-500/20' : 'border-zinc-600 bg-zinc-800'}`}>
                    {preserveForm && (
                      <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition">Form ve Taban Kilitli</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Ayakkabı şeklinin ve yüksekliğinin bozulmasını önler.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={preserveDetails}
                    onChange={e => setPreserveDetails(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition ${preserveDetails ? 'border-indigo-500 bg-indigo-500/20' : 'border-zinc-600 bg-zinc-800'}`}>
                    {preserveDetails && (
                      <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition">Detay ve Aksesuar Netliği</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Toka, bağcık, dikiş gibi alanların korunmasını maksimize eder.</div>
                  </div>
                </label>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-800/80">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Boyutlar</h3>
                <select
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value as '1:1' | '4:5' | '16:9')}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 transition"
                >
                  <option value="1:1">1:1 (E-Ticaret Standart)</option>
                  <option value="4:5">4:5 (Sosyal Medya)</option>
                  <option value="16:9">16:9 (Kampanya Afişi)</option>
                </select>
              </div>
            </div>

            {history.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-300">Son Üretimler</h3>
                  <span className="text-xs text-zinc-500">{history.length}/{HISTORY_MAX}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {history.map(h => (
                    <div key={h.id} className="relative group aspect-square rounded-md overflow-hidden border border-zinc-800 bg-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={h.url}
                        alt={h.vibe ?? 'Üretim'}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                        onClick={() => { setResult(h.url); setIsZoomed(true); }}
                      />
                      <button
                        onClick={() => removeHistory(h.id)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] opacity-0 group-hover:opacity-100 transition"
                        aria-label="Sil"
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}

            {activeTab === 'rotush' ? (
              <button
                onClick={handleRetouch}
                disabled={
                  loading ||
                  (!(retouchSource || result)) ||
                  (!retouchInstruction.trim() && !retouchReference && !retouchColor)
                }
                className={`w-full p-4 rounded-xl font-semibold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                  !(retouchSource || result) || (!retouchInstruction.trim() && !retouchReference && !retouchColor)
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50'
                    : loading
                      ? 'bg-cyan-600/50 text-cyan-200 border border-cyan-500/30'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-900 border border-cyan-300 hover:scale-[1.02]'
                }`}
              >
                {loading ? 'Rötuş Uygulanıyor...' : 'Rötuş Uygula (1 Kredi)'}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading || (activeTab === 'foto' ? !image : (!designPrompt && !sketchImage))}
                className={`w-full p-4 rounded-xl font-semibold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                  (activeTab === 'foto' ? !image : (!designPrompt && !sketchImage))
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50'
                    : loading
                      ? 'bg-indigo-600/50 text-indigo-300 border border-indigo-500/30'
                      : 'bg-zinc-100 hover:bg-white text-zinc-900 border border-white hover:scale-[1.02]'
                }`}
              >
                {loading ? 'İşleniyor...' : selectedPoses.length > 0 ? (
                  <>{selectedPoses.length} Poz Üret ({selectedPoses.length} Kredi)</>
                ) : (
                  <>
                     {activeTab === 'foto' ? 'Stüdyo Çekimi Üret (1 Kredi)' : 'Sıfırdan Tasarım Üret (2 Kredi)'}
                  </>
                )}
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
