// السبورة الرياضية — العمل بدون إنترنت.
// The board page: newest copy when online, saved copy when offline.
// Fonts, pdf.js, icons and styles: kept after first use (CSS/JS refreshed in the background).
// The Arabic editor (../index.html) is cached by the editor's own service worker.
const VERSION = 'b1';
const CACHE = 'arabic-board-' + VERSION;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  '../fonts.css', '../custom-fonts.css', '../pdfjs/pdf.min.js', '../pdfjs/pdf.worker.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled(CORE.map(u => c.add(new Request(u, { cache: 'reload' })))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('arabic-board-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const STATIC = /\.(woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webmanifest)$/i;
const REFRESH = /\.(css|js|mjs)$/i;

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const scope = new URL(self.registration.scope).pathname;

  if (req.mode === 'navigate') {
    if (!url.pathname.startsWith(scope)) return;
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }
      return r;
    }).catch(() => caches.match('index.html', { ignoreSearch: true })));
    return;
  }

  const p = url.pathname;
  if (STATIC.test(p)) {                       // cache first
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
      if (r.ok && r.type === 'basic') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    })));
    return;
  }
  if (REFRESH.test(p)) {                      // saved copy now, fresh copy for next time
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(r => {
        if (r.ok && r.type === 'basic') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return r;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
