"use client";
import React from 'react';

export type PoseMeta = {
  id: string;
  label: string;
  desc: string;
  icon: string;
  faceVisible: boolean;
};

export const POSE_LIST: PoseMeta[] = [
  { id: 'koltuk-bel-alti',         label: 'Koltukta Oturan',          desc: 'Ayaklar yerde, belden aşağı, yüz yok',     icon: '🛋️', faceVisible: false },
  { id: 'sandalye-bacakbacak',     label: 'Bacak Bacak Üstü',         desc: 'Sandalyede, belden aşağı, yüz yok',         icon: '🪑', faceVisible: false },
  { id: 'studyo-ayakta-bel-alti',  label: 'Stüdyoda Ayakta',          desc: 'Düz duruş, belden aşağı, yüz yok',          icon: '🧍‍♀️', faceVisible: false },
  { id: 'sokak-yuruyus',           label: 'Sokakta Yürürken',         desc: 'Mid-stride, belden aşağı, yüz yok',          icon: '🚶‍♀️', faceVisible: false },
  { id: 'bank-park',               label: 'Park Bankında',            desc: 'Bankta oturan, belden aşağı, yüz yok',       icon: '🪵', faceVisible: false },
  { id: 'studyo-tam-vucut-yuz',    label: 'Stüdyo Tam Boy',           desc: 'Tam vücut, yüz var, ayakkabı odak',          icon: '📸', faceVisible: true },
  { id: 'koltuk-tamboy-yuz',       label: 'Koltukta Tam Boy',         desc: 'Lounge poz, yüz var, ayakkabı odak',         icon: '🛋️', faceVisible: true },
  { id: 'sokak-tam-yuz',           label: 'Sokak Editoryalı',         desc: 'Tam boy şehir, yüz var, ayakkabı odak',      icon: '🌆', faceVisible: true },
];

export default function PoseGrid({
  selected,
  onToggle,
  onClear,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-zinc-300">Çoklu Poz Kataloğu</h3>
        {selected.length > 0 && onClear && (
          <button onClick={onClear} className="text-xs text-zinc-500 hover:text-red-300">Temizle</button>
        )}
      </div>
      <p className="text-xs text-zinc-500 mb-3">
        Birden fazla seç → her biri için ayrı görsel üretilir. Aynı model, aynı kıyafet.
        {selected.length > 0 && <span className="text-indigo-300"> · {selected.length} poz seçildi</span>}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {POSE_LIST.map(pose => {
          const active = selected.includes(pose.id);
          return (
            <button
              key={pose.id}
              onClick={() => onToggle(pose.id)}
              className={`relative flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all ${
                active
                  ? 'bg-indigo-500/10 border-indigo-500/50'
                  : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-base leading-none">{pose.icon}</span>
                <span className={`text-xs font-medium leading-tight flex-1 ${active ? 'text-indigo-300' : 'text-zinc-200'}`}>{pose.label}</span>
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'bg-indigo-500 border-indigo-400' : 'border-zinc-600'}`}>
                  {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 leading-tight">{pose.desc}</div>
              <span className={`absolute top-1.5 right-6 text-[8px] px-1 py-0.5 rounded uppercase tracking-wide ${pose.faceVisible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-700/50 text-zinc-400'}`}>
                {pose.faceVisible ? 'Yüz' : 'Bel↓'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
