'use client';

import { useLang } from '@/lib/use-lang';
import type { Lang } from '@/lib/use-lang';

export default function LangSwitch() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-1">
      <button
        onClick={() => setLang('tr' as Lang)}
        className={`px-2.5 py-1 text-xs font-medium rounded transition ${
          lang === 'tr' 
            ? 'bg-indigo-500 text-white shadow-sm' 
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
        }`}
        title="Türkçe"
      >
        TR
      </button>
      <button
        onClick={() => setLang('en' as Lang)}
        className={`px-2.5 py-1 text-xs font-medium rounded transition ${
          lang === 'en' 
            ? 'bg-indigo-500 text-white shadow-sm' 
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
