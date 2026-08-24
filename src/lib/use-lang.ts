'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ui_lang';
const COOKIE_KEY = 'ui_lang';
const EVENT_KEY = 'ui_lang_change';
const IP_CACHE_KEY = 'ui_ip_country';
const IP_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export type Lang = 'tr' | 'en';

const getIpCountry = async (): Promise<string | null> => {
  try {
    const cached = localStorage.getItem(IP_CACHE_KEY);
    if (cached) {
      const { country, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < IP_CACHE_DURATION) {
        return country;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://ipwho.is/', {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    const country = data?.country_code?.toUpperCase() || null;

    if (country) {
      localStorage.setItem(IP_CACHE_KEY, JSON.stringify({
        country,
        timestamp: Date.now()
      }));
    }

    return country;
  } catch {
    return null;
  }
};

const detectInitialLang = async (): Promise<Lang> => {
  // 1. Check localStorage preference (highest priority)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'tr' || stored === 'en') return stored;

  // 2. Check IP-based detection
  const country = await getIpCountry();
  if (country === 'TR') return 'tr';
  if (country) return 'en';

  // 3. Fallback to navigator.language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('tr')) return 'tr';
  }

  // 4. Ultimate fallback
  return 'tr';
};

let currentLang: Lang | null = null;
let langResolve: ((lang: Lang) => void) | null = null;

export const useLang = () => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (currentLang) return currentLang;
    // Sync with localStorage immediately for SSR safety
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return (stored === 'tr' || stored === 'en') ? stored : 'tr';
  });

  useEffect(() => {
    if (currentLang) {
      setLangState(currentLang);
      return;
    }

    if (!langResolve) {
      langResolve = () => {};
      detectInitialLang().then(detected => {
        currentLang = detected;
        setLangState(detected);
        if (langResolve) langResolve(detected);
      });
    }
  }, []);

  const setLang = (newLang: Lang) => {
    currentLang = newLang;
    setLangState(newLang);
    
    // Persist
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `${COOKIE_KEY}=${newLang}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    } catch {}

    // Dispatch event for other tabs/components
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: { lang: newLang } }));
  };

  useEffect(() => {
    const handleLangChange = (e: CustomEvent) => {
      setLangState(e.detail.lang);
    };
    window.addEventListener(EVENT_KEY, handleLangChange as EventListener);
    return () => window.removeEventListener(EVENT_KEY, handleLangChange as EventListener);
  }, []);

  return { lang, setLang };
};

export const pickByLang = <T,>(lang: Lang, tr: T, en: T): T => lang === 'tr' ? tr : en;
