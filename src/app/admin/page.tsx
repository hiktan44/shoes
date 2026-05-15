"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type UserRow = {
  id: string; email: string; registered_at: string; last_sign_in_at: string | null;
  credits: number; is_admin: boolean; total_generations: number; today_generations: number;
  credits_used: number; total_paid: number; last_activity: string | null;
};
type Tx = {
  id: string; email: string; type: string; credits: number; amount: number | null;
  reason: string | null; provider: string | null; status: string; created_at: string;
};
type Overview = {
  stats: Record<string, number>;
  users: UserRow[];
  transactions: Tx[];
  me: string;
  error?: string;
};

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n: number | null) => (n ? `${Number(n).toLocaleString('tr-TR')} ₺` : '—');

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/overview?q=${encodeURIComponent(query)}`);
      if (r.status === 403) { setDenied(true); setLoading(false); return; }
      const d = await r.json();
      setData(d);
    } catch { /* sessiz */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const adjust = async (u: UserRow) => {
    const v = window.prompt(`${u.email}\nMevcut: ${u.credits} kredi\n\n+/- kredi miktarı gir (örn: 50 veya -20):`, '');
    if (v === null) return;
    const delta = parseInt(v, 10);
    if (!Number.isFinite(delta) || delta === 0) return;
    setBusy(u.id);
    await fetch('/api/admin/credits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, delta, note: 'admin panel' }),
    });
    setBusy(null);
    load(q);
  };

  const toggleAdmin = async (u: UserRow) => {
    if (!window.confirm(`${u.email} ${u.is_admin ? 'admin yetkisi KALDIRILSIN' : 'ADMIN yapılsın'} mı?`)) return;
    setBusy(u.id);
    await fetch('/api/admin/role', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, isAdmin: !u.is_admin }),
    });
    setBusy(null);
    load(q);
  };

  if (denied) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-semibold">Bu sayfaya erişim yetkiniz yok</h1>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Ana sayfaya dön</button>
      </div>
    );
  }

  const s = data?.stats || {};
  const STAT_CARDS = [
    { label: 'Toplam Kullanıcı', value: s.total_users, icon: '👥' },
    { label: 'Admin Kullanıcı', value: s.admin_users, icon: '🛡️' },
    { label: 'Toplam Kredi (bakiye)', value: s.total_credits, icon: '◆' },
    { label: 'Toplam Üretim', value: s.total_generations, sub: `bugün ${s.today_generations ?? 0}`, icon: '🎨' },
    { label: 'Toplam Gelir', value: undefined, money: s.total_revenue, sub: `bugün ${fmtMoney(s.today_revenue ?? 0)}`, icon: '💰' },
    { label: 'Sipariş', value: s.total_orders, icon: '🧾' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">F</div>
          <span className="font-semibold text-lg">Fasheone <span className="text-zinc-500">Admin</span></span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {data?.me && <span className="text-zinc-500 text-xs">{data.me}</span>}
          <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white transition">← Uygulama</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stat kartları */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {STAT_CARDS.map(c => (
            <div key={c.label} className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4">
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="text-2xl font-bold tabular-nums">
                {loading ? '…' : c.money !== undefined ? fmtMoney(c.money) : (c.value ?? 0).toLocaleString('tr-TR')}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">{c.label}</div>
              {c.sub && <div className="text-[10px] text-zinc-600 mt-0.5">{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* Kullanıcı tablosu */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-sm font-semibold text-zinc-200">Kullanıcılar</h2>
            <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex gap-2">
              <input
                value={q} onChange={e => setQ(e.target.value)}
                placeholder="E-posta ara…"
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs w-48 focus:outline-none focus:border-indigo-500"
              />
              <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs border border-zinc-700">Ara</button>
            </form>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 text-left border-b border-zinc-800">
                  <th className="py-2 pr-4 font-medium">Kullanıcı</th>
                  <th className="py-2 px-3 font-medium">Kredi</th>
                  <th className="py-2 px-3 font-medium">Üretim</th>
                  <th className="py-2 px-3 font-medium">Bugün</th>
                  <th className="py-2 px-3 font-medium">Harcanan</th>
                  <th className="py-2 px-3 font-medium">Ödeme</th>
                  <th className="py-2 px-3 font-medium">Son Aktivite</th>
                  <th className="py-2 px-3 font-medium">Kayıt</th>
                  <th className="py-2 px-3 font-medium">Rol</th>
                  <th className="py-2 pl-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={10} className="py-8 text-center text-zinc-500">Yükleniyor…</td></tr>}
                {!loading && data?.users?.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-zinc-500">Kullanıcı yok</td></tr>}
                {!loading && data?.users?.map(u => (
                  <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2.5 pr-4 text-zinc-200">{u.email}</td>
                    <td className="py-2.5 px-3 font-medium text-indigo-300 tabular-nums">{u.credits}</td>
                    <td className="py-2.5 px-3 tabular-nums">{u.total_generations}</td>
                    <td className="py-2.5 px-3 tabular-nums">{u.today_generations}</td>
                    <td className="py-2.5 px-3 tabular-nums text-zinc-400">{u.credits_used}</td>
                    <td className="py-2.5 px-3 tabular-nums text-emerald-400">{fmtMoney(u.total_paid)}</td>
                    <td className="py-2.5 px-3 text-zinc-500">{fmtDate(u.last_activity)}</td>
                    <td className="py-2.5 px-3 text-zinc-500">{fmtDate(u.registered_at)}</td>
                    <td className="py-2.5 px-3">
                      {u.is_admin
                        ? <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px]">ADMIN</span>
                        : <span className="text-zinc-600 text-[10px]">üye</span>}
                    </td>
                    <td className="py-2.5 pl-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => adjust(u)} disabled={busy === u.id}
                          className="px-2 py-1 bg-indigo-600/80 hover:bg-indigo-500 rounded text-[10px] text-white disabled:opacity-50"
                        >± Kredi</button>
                        <button
                          onClick={() => toggleAdmin(u)} disabled={busy === u.id}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-[10px] disabled:opacity-50"
                        >{u.is_admin ? 'Admin kaldır' : 'Admin yap'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Son işlemler */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Son İşlemler</h2>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 text-left border-b border-zinc-800">
                  <th className="py-2 pr-4 font-medium">Kullanıcı</th>
                  <th className="py-2 px-3 font-medium">Tip</th>
                  <th className="py-2 px-3 font-medium">Kredi</th>
                  <th className="py-2 px-3 font-medium">Tutar</th>
                  <th className="py-2 px-3 font-medium">Neden</th>
                  <th className="py-2 px-3 font-medium">Sağlayıcı</th>
                  <th className="py-2 pl-3 font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {!loading && data?.transactions?.map(t => (
                  <tr key={t.id} className="border-b border-zinc-800/50">
                    <td className="py-2 pr-4 text-zinc-300">{t.email}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        t.type === 'purchase' ? 'bg-emerald-500/15 text-emerald-400'
                        : t.type === 'usage' ? 'bg-zinc-700/50 text-zinc-400'
                        : t.type === 'refund' ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-amber-500/15 text-amber-400'}`}>{t.type}</span>
                    </td>
                    <td className={`py-2 px-3 tabular-nums ${t.credits >= 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      {t.credits >= 0 ? '+' : ''}{t.credits}
                    </td>
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
      </div>
    </div>
  );
}
