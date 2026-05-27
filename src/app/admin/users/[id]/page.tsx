"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

/* eslint-disable @next/next/no-img-element */

type Profile = {
  id: string; email: string; registered_at: string; last_sign_in_at: string | null;
  credits: number; is_admin: boolean; total_generations: number; credits_used: number; total_paid: number;
};
type Gen = { id: string; result_url: string; mode: string; vibe: string | null; created_at: string };
type Tx = { id: string; type: string; credits: number; amount: number | null; reason: string | null; provider: string | null; status: string; created_at: string };

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n: number | null) => (n ? `${Number(n).toLocaleString('tr-TR')} ₺` : '—');

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [generations, setGenerations] = useState<Gen[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/user?id=${encodeURIComponent(id)}`);
      if (r.status === 403) { setDenied(true); setLoading(false); return; }
      const d = await r.json();
      if (r.ok) { setProfile(d.profile); setGenerations(d.generations || []); setTransactions(d.transactions || []); }
    } catch { /* sessiz */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const adjust = async () => {
    if (!profile) return;
    const v = window.prompt(`${profile.email}\nMevcut: ${profile.credits} kredi\n\n+/- kredi miktarı:`, '');
    if (v === null) return;
    const delta = parseInt(v, 10);
    if (!Number.isFinite(delta) || delta === 0) return;
    setBusy(true);
    await fetch('/api/admin/credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, delta, note: 'admin detay' }) });
    setBusy(false); load();
  };
  const toggleAdmin = async () => {
    if (!profile) return;
    if (!window.confirm(`${profile.email} ${profile.is_admin ? 'admin yetkisi KALDIRILSIN' : 'ADMIN yapılsın'} mı?`)) return;
    setBusy(true);
    await fetch('/api/admin/role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, isAdmin: !profile.is_admin }) });
    setBusy(false); load();
  };

  if (denied) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-semibold">Yetkiniz yok</h1>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm">Ana sayfa</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {zoom && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-w-full max-h-[92vh] object-contain rounded-lg" />
        </div>
      )}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">F</div>
          <span className="font-semibold text-lg">Fasheone <span className="text-zinc-500">Admin</span></span>
        </div>
        <button onClick={() => router.push('/admin')} className="text-zinc-400 hover:text-white transition text-sm">← Kullanıcılar</button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading && <div className="text-zinc-500 py-12 text-center">Yükleniyor…</div>}
        {!loading && profile && (
          <>
            {/* Profil başlık */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-semibold">
                {profile.email[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{profile.email}</h1>
                  {profile.is_admin && <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px]">ADMIN</span>}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Kayıt: {fmtDate(profile.registered_at)} · Son giriş: {fmtDate(profile.last_sign_in_at)}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={adjust} disabled={busy} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs text-white disabled:opacity-50">± Kredi</button>
                <button onClick={toggleAdmin} disabled={busy} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs disabled:opacity-50">{profile.is_admin ? 'Admin kaldır' : 'Admin yap'}</button>
              </div>
            </div>

            {/* Özet kartlar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { l: 'Mevcut Kredi', v: profile.credits.toLocaleString('tr-TR'), c: 'text-indigo-300' },
                { l: 'Toplam Üretim', v: profile.total_generations.toLocaleString('tr-TR'), c: 'text-zinc-100' },
                { l: 'Harcanan Kredi', v: profile.credits_used.toLocaleString('tr-TR'), c: 'text-zinc-300' },
                { l: 'Toplam Ödeme', v: fmtMoney(profile.total_paid), c: 'text-emerald-400' },
              ].map(s => (
                <div key={s.l} className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4">
                  <div className={`text-2xl font-bold tabular-nums ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Üretimler galerisi */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 mb-8">
              <h2 className="text-sm font-semibold text-zinc-200 mb-4">Üretimler <span className="text-zinc-500 font-normal">({generations.length})</span></h2>
              {generations.length === 0 ? (
                <div className="text-zinc-500 text-sm py-6 text-center">Henüz üretim yok</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {generations.map(g => (
                    <div key={g.id} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 group cursor-pointer" onClick={() => setZoom(g.result_url)}>
                      <img src={g.result_url} alt={g.vibe || g.mode} className="w-full h-full object-cover group-hover:opacity-80" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[9px] text-zinc-300 truncate">{g.vibe || g.mode}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* İşlem geçmişi */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-zinc-200 mb-4">İşlem Geçmişi</h2>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-500 text-left border-b border-zinc-800">
                      <th className="py-2 pr-4 font-medium">Tip</th>
                      <th className="py-2 px-3 font-medium">Kredi</th>
                      <th className="py-2 px-3 font-medium">Tutar</th>
                      <th className="py-2 px-3 font-medium">Neden</th>
                      <th className="py-2 px-3 font-medium">Sağlayıcı</th>
                      <th className="py-2 pl-3 font-medium">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-zinc-500">İşlem yok</td></tr>}
                    {transactions.map(t => (
                      <tr key={t.id} className="border-b border-zinc-800/50">
                        <td className="py-2 pr-4">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            t.type === 'purchase' ? 'bg-emerald-500/15 text-emerald-400'
                            : t.type === 'usage' ? 'bg-zinc-700/50 text-zinc-400'
                            : t.type === 'refund' ? 'bg-blue-500/15 text-blue-400'
                            : 'bg-amber-500/15 text-amber-400'}`}>{t.type}</span>
                        </td>
                        <td className={`py-2 px-3 tabular-nums ${t.credits >= 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>{t.credits >= 0 ? '+' : ''}{t.credits}</td>
                        <td className="py-2 px-3 tabular-nums">{fmtMoney(t.amount)}</td>
                        <td className="py-2 px-3 text-zinc-500">{t.reason || '—'}</td>
                        <td className="py-2 px-3 text-zinc-500">{t.provider || '—'}</td>
                        <td className="py-2 pl-3 text-zinc-500">{fmtDate(t.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
