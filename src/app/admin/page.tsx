"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';

type UserRow = {
  id: string; email: string; registered_at: string; last_sign_in_at: string | null;
  credits: number; is_admin: boolean; suspended: boolean; total_generations: number; today_generations: number;
  credits_used: number; total_paid: number; last_activity: string | null;
};
type Tx = {
  id: string; email: string; type: string; credits: number; amount: number | null;
  reason: string | null; provider: string | null; status: string; created_at: string;
};
type SeriesPoint = { day: string; revenue: number; generations: number; orders: number };
type Overview = {
  stats: Record<string, number>;
  users: UserRow[];
  transactions: Tx[];
  series: SeriesPoint[];
  me: string;
  error?: string;
};

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n: number | null) => (n ? `${Number(n).toLocaleString('tr-TR')} ₺` : '—');

// Basit SVG bar chart — son N gün
function BarChart({ data, valueKey, color, format }: {
  data: SeriesPoint[]; valueKey: 'revenue' | 'generations'; color: string; format: (n: number) => string;
}) {
  const vals = data.map(d => Number(d[valueKey]) || 0);
  const max = Math.max(1, ...vals);
  const total = vals.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="flex items-end gap-[3px] h-32">
        {data.map((d, i) => {
          const v = Number(d[valueKey]) || 0;
          const h = Math.round((v / max) * 100);
          return (
            <div key={d.day} className="flex-1 group relative flex items-end" style={{ height: '100%' }}>
              <div
                className="w-full rounded-t transition-all"
                style={{ height: `${Math.max(2, h)}%`, background: color, opacity: v === 0 ? 0.25 : 1 }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-[10px] z-10">
                {d.day.slice(5)} · {format(v)}
                {i === data.length - 1 ? ' (bugün)' : ''}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
        <span>{data[0]?.day.slice(5)}</span>
        <span>Toplam: {format(total)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { t } = useT();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('registered_desc');

  const load = useCallback(async (
    query = '', f = '', t = '',
    flt: { role?: string; status?: string; sort?: string } = {}
  ) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (query) qs.set('q', query);
      if (f) qs.set('from', f);
      if (t) qs.set('to', t);
      if (flt.role) qs.set('role', flt.role);
      if (flt.status) qs.set('status', flt.status);
      if (flt.sort) qs.set('sort', flt.sort);
      const r = await fetch(`/api/admin/overview?${qs.toString()}`);
      if (r.status === 403) { setDenied(true); setLoading(false); return; }
      const d = await r.json();
      setData(d);
    } catch { /* sessiz */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

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
    load(q, from, to, { role, status, sort });
  };

  const toggleAdmin = async (u: UserRow) => {
    if (!window.confirm(`${u.email} ${u.is_admin ? 'admin yetkisi KALDIRILSIN' : 'ADMIN yapılsın'} mı?`)) return;
    setBusy(u.id);
    await fetch('/api/admin/role', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, isAdmin: !u.is_admin }),
    });
    setBusy(null);
    load(q, from, to, { role, status, sort });
  };

  const toggleSuspend = async (u: UserRow) => {
    if (!window.confirm(`${u.email} ${u.suspended ? 'askıdan ÇIKARILSIN' : 'ASKIYA alınsın (üretim yapamaz)'} mı?`)) return;
    setBusy(u.id);
    await fetch('/api/admin/user-action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, action: 'suspend', value: !u.suspended }),
    });
    setBusy(null);
    load(q, from, to, { role, status, sort });
  };

  const removeUser = async (u: UserRow) => {
    if (!window.confirm(`${u.email} KALICI olarak silinsin mi?\nTüm üretimleri, işlemleri ve hesabı silinir. Bu işlem geri alınamaz.`)) return;
    if (!window.confirm('Emin misiniz? Son onay.')) return;
    setBusy(u.id);
    await fetch('/api/admin/user-action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, action: 'delete' }),
    });
    setBusy(null);
    load(q, from, to, { role, status, sort });
  };

  const exportCsv = (type: 'users' | 'transactions') => {
    window.open(`/api/admin/export?type=${type}`, '_blank');
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
    { labelKey: 'admin.statUsers', value: s.total_users, icon: '👥' },
    { labelKey: 'admin.statAdmins', value: s.admin_users, icon: '🛡️' },
    { labelKey: 'admin.statCredits', value: s.total_credits, icon: '◆' },
    { labelKey: 'admin.statGenerations', value: s.total_generations, sub: `${t('admin.statToday')} ${s.today_generations ?? 0}`, icon: '🎨' },
    { labelKey: 'admin.statRevenue', value: undefined, money: s.total_revenue, sub: `${t('admin.statToday')} ${fmtMoney(s.today_revenue ?? 0)}`, icon: '💰' },
    { labelKey: 'admin.statOrders', value: s.total_orders, icon: '🧾' },
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
          <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white transition">{t('admin.back')}</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stat kartları */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {STAT_CARDS.map(c => (
            <div key={c.labelKey} className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4">
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="text-2xl font-bold tabular-nums">
                {loading ? '…' : c.money !== undefined ? fmtMoney(c.money) : (c.value ?? 0).toLocaleString('tr-TR')}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">{t(c.labelKey as any)}</div>
              {c.sub && <div className="text-[10px] text-zinc-600 mt-0.5">{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* Araç çubuğu — tarih aralığı + CSV export */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">{t('admin.filterStart')}</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200" />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">{t('admin.filterEnd')}</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200" />
          </div>
          <button onClick={() => load(q, from, to, { role, status, sort })} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs text-white">{t('admin.filterApply')}</button>
          {(from || to) && <button onClick={() => { setFrom(''); setTo(''); load(q, '', ''); }} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs">{t('admin.filterReset')}</button>}
          <div className="flex-1" />
          <button onClick={() => exportCsv('users')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs flex items-center gap-1.5">⬇ Kullanıcılar CSV</button>
          <button onClick={() => exportCsv('transactions')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs flex items-center gap-1.5">⬇ İşlemler CSV</button>
        </div>

        {/* Grafikler */}
        {data?.series && data.series.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-zinc-200 mb-1">💰 Günlük Gelir <span className="text-zinc-500 font-normal">· {(from || to) ? 'seçili aralık' : 'son 30 gün'}</span></h2>
              <p className="text-[11px] text-zinc-500 mb-4">Tamamlanan satın almalar (₺)</p>
              <BarChart data={data.series} valueKey="revenue" color="#34d399" format={(n) => `${n.toLocaleString('tr-TR')} ₺`} />
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-zinc-200 mb-1">🎨 Günlük Üretim <span className="text-zinc-500 font-normal">· {(from || to) ? 'seçili aralık' : 'son 30 gün'}</span></h2>
              <p className="text-[11px] text-zinc-500 mb-4">Oluşturulan görsel sayısı</p>
              <BarChart data={data.series} valueKey="generations" color="#818cf8" format={(n) => `${n.toLocaleString('tr-TR')}`} />
            </div>
          </div>
        )}

        {/* Kullanıcı tablosu */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
            <h2 className="text-sm font-semibold text-zinc-200">Kullanıcılar</h2>
            <form onSubmit={(e) => { e.preventDefault(); load(q, from, to, { role, status, sort }); }} className="flex flex-wrap gap-2">
              <input
                value={q} onChange={e => setQ(e.target.value)}
                placeholder="E-posta ara…"
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs w-44 focus:outline-none focus:border-indigo-500"
              />
              <select value={role} onChange={e => setRole(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300">
                <option value="">Tüm roller</option>
                <option value="admin">Admin</option>
                <option value="user">Üye</option>
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300">
                <option value="">Tüm durumlar</option>
                <option value="active">Aktif</option>
                <option value="suspended">Askıda</option>
              </select>
              <select value={sort} onChange={e => setSort(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300">
                <option value="registered_desc">En yeni kayıt</option>
                <option value="registered_asc">En eski kayıt</option>
                <option value="credits_desc">En çok kredi</option>
                <option value="generations_desc">En çok üretim</option>
                <option value="paid_desc">En çok ödeme</option>
                <option value="activity_desc">Son aktivite</option>
              </select>
              <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs">Filtrele</button>
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
                    <td className="py-2.5 pr-4">
                      <button onClick={() => router.push(`/admin/users/${u.id}`)} className="text-indigo-300 hover:text-indigo-200 hover:underline text-left">
                        {u.email}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-indigo-300 tabular-nums">{u.credits}</td>
                    <td className="py-2.5 px-3 tabular-nums">{u.total_generations}</td>
                    <td className="py-2.5 px-3 tabular-nums">{u.today_generations}</td>
                    <td className="py-2.5 px-3 tabular-nums text-zinc-400">{u.credits_used}</td>
                    <td className="py-2.5 px-3 tabular-nums text-emerald-400">{fmtMoney(u.total_paid)}</td>
                    <td className="py-2.5 px-3 text-zinc-500">{fmtDate(u.last_activity)}</td>
                    <td className="py-2.5 px-3 text-zinc-500">{fmtDate(u.registered_at)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        {u.is_admin
                          ? <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] w-fit">ADMIN</span>
                          : <span className="text-zinc-600 text-[10px]">üye</span>}
                        {u.suspended && <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 text-[10px] w-fit">ASKIDA</span>}
                      </div>
                    </td>
                    <td className="py-2.5 pl-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => adjust(u)} disabled={busy === u.id}
                          className="px-2 py-1 bg-indigo-600/80 hover:bg-indigo-500 rounded text-[10px] text-white disabled:opacity-50"
                        >± Kredi</button>
                        <button
                          onClick={() => toggleAdmin(u)} disabled={busy === u.id}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-[10px] disabled:opacity-50"
                        >{u.is_admin ? 'Admin kaldır' : 'Admin yap'}</button>
                        <button
                          onClick={() => toggleSuspend(u)} disabled={busy === u.id}
                          className="px-2 py-1 bg-zinc-800 hover:bg-amber-900/40 border border-zinc-700 rounded text-[10px] text-amber-300 disabled:opacity-50"
                        >{u.suspended ? 'Aktifleştir' : 'Askıya al'}</button>
                        <button
                          onClick={() => removeUser(u)} disabled={busy === u.id}
                          className="px-2 py-1 bg-zinc-800 hover:bg-red-900/40 border border-zinc-700 rounded text-[10px] text-red-400 disabled:opacity-50"
                        >Sil</button>
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
