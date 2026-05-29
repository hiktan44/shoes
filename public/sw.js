// Fasheone Shoes — minimal PWA service worker
// Statik kabuk: cache-first; sayfa: network-first; /api: her zaman network (cache yok).
const CACHE = 'fasheone-shell-v1';
const PRECACHE = ['/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // API ve auth: ASLA cache (taze + güvenlik için)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;
  // Aynı origin statikler için cache-first
  if (url.origin === self.location.origin && /\.(?:png|jpg|jpeg|svg|webp|woff2?|css|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then((c) => c.put(req, clone)); }
        return res;
      })).catch(() => caches.match(req))
    );
    return;
  }
  // Navigasyon: network-first, offline'da minimal fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => new Response(
        '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Çevrimdışı</title><style>body{font-family:system-ui;background:#0a0a0a;color:#e4e4e7;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}h1{font-size:24px;margin:8px 0}p{color:#a1a1aa}a{color:#a5b4fc}</style><div><h1>📡 Çevrimdışısın</h1><p>Bağlantını kontrol edip yeniden dene.</p><p><a href="/">Ana sayfaya dön</a></p></div>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
      ))
    );
  }
});
