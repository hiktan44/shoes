// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import type { Lang } from './use-lang';

let root: Root;
let container: HTMLDivElement;
let setLanguage: (lang: Lang) => void;
let resolveCountry: (value: { ok: boolean; json: () => Promise<{ country_code: string }> }) => void;

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { resolveCountry = resolve; })));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function mount() {
  const { useLang } = await import('./use-lang');
  function Consumer() {
    const { lang, setLang } = useLang();
    useEffect(() => { setLanguage = setLang; }, [setLang]);
    return createElement('span', null, lang);
  }
  await act(async () => {
    root.render(createElement('div', null, createElement(Consumer), createElement(Consumer)));
  });
}

async function country(code: string) {
  await act(async () => {
    resolveCountry({ ok: true, json: async () => ({ country_code: code }) });
  });
}

test('kayıtlı dil iki bileşende de uygulanır; ülke sorgusu yapılmaz', async () => {
  localStorage.setItem('ui_lang', 'en');
  await mount();
  expect(container.textContent).toBe('enen');
  expect(fetch).not.toHaveBeenCalled();
});

test('tek ülke sorgusu tüm bileşenleri günceller', async () => {
  await mount();
  expect(container.textContent).toBe('trtr');
  expect(fetch).toHaveBeenCalledTimes(1);
  await country('US');
  expect(container.textContent).toBe('enen');
});

test('gecikmiş ülke sorgusu kullanıcının açık Türkçe tercihini değiştiremez', async () => {
  await mount();
  await act(async () => { setLanguage('tr'); });
  await country('US');
  expect(container.textContent).toBe('trtr');
  expect(localStorage.getItem('ui_lang')).toBe('tr');
  expect(document.cookie).toContain('ui_lang=tr');
});

test('dil düğmesi ve başka sekmedeki tercih tüm bileşenlere ulaşır', async () => {
  localStorage.setItem('ui_lang', 'tr');
  await mount();
  await act(async () => { setLanguage('en'); });
  expect(container.textContent).toBe('enen');
  await act(async () => {
    window.dispatchEvent(new StorageEvent('storage', { key: 'ui_lang', newValue: 'tr' }));
  });
  expect(container.textContent).toBe('trtr');
});

test('depolama engellendiğinde dil seçimi kullanılabilir', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Engellendi'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Engellendi'); });
  await mount();
  await act(async () => { setLanguage('en'); });
  expect(container.textContent).toBe('enen');
});

test('sunucu çıktısı tarayıcı tercihiyle çelişen hidratasyon üretmez', async () => {
  localStorage.setItem('ui_lang', 'en');
  const { useLang } = await import('./use-lang');
  function ServerConsumer() { return createElement('span', null, useLang().lang); }
  expect(renderToString(createElement(ServerConsumer))).toBe('<span>tr</span>');
  expect(fetch).not.toHaveBeenCalled();
});
