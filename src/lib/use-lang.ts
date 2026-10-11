'use client';

import { useSyncExternalStore } from 'react';

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
  const stored = readPreference();
  if (stored) return stored;

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
let detectionStarted = false;

function isLang(value: unknown): value is Lang {
  return value === 'tr' || value === 'en';
}

function readPreference(): Lang | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLang(stored) ? stored : null;
  } catch {
    return null;
  }
}

function getSnapshot(): Lang {
  return currentLang ?? readPreference() ?? 'tr';
}

function announce(lang: Lang) {
  window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: { lang } }));
}

function subscribe(callback: () => void) {
  const handleLangChange = (event: Event) => {
    const value = (event as CustomEvent<{ lang?: unknown }>).detail?.lang;
    if (!isLang(value)) return;
    currentLang = value;
    callback();
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    currentLang = isLang(event.newValue) ? event.newValue : 'tr';
    callback();
  };
  window.addEventListener(EVENT_KEY, handleLangChange);
  window.addEventListener('storage', handleStorage);

  if (currentLang === null) currentLang = readPreference();
  if (currentLang === null && !detectionStarted) {
    detectionStarted = true;
    void detectInitialLang().then(detected => {
      // Bekleyen ülke sorgusu açık bir kullanıcı tercihini değiştiremez.
      if (currentLang !== null) return;
      currentLang = detected;
      announce(detected);
    });
  }

  return () => {
    window.removeEventListener(EVENT_KEY, handleLangChange);
    window.removeEventListener('storage', handleStorage);
  };
}

function setLang(newLang: Lang) {
  if (!isLang(newLang) || typeof window === 'undefined') return;
  currentLang = newLang;
  try {
    window.localStorage.setItem(STORAGE_KEY, newLang);
  } catch {}
  try {
    document.cookie = `${COOKIE_KEY}=${newLang}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
  } catch {}
  announce(newLang);
}

export const useLang = () => {
  const lang = useSyncExternalStore(subscribe, getSnapshot, () => 'tr' as const);
  return { lang, setLang };
};

export const pickByLang = <T,>(lang: Lang, tr: T, en: T): T => lang === 'tr' ? tr : en;
