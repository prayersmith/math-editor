// Offline support. Change VERSION whenever the files are updated.
const VERSION='v46';
const CACHE='arabic-eq-'+VERSION;
const ASSETS=["./", "index.html", "fonts.css", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "fonts/amiri-arabic-400-italic.woff2", "fonts/amiri-arabic-400-normal.woff2", "fonts/amiri-latin-400-italic.woff2", "fonts/amiri-latin-400-normal.woff2", "fonts/amiri-latin-ext-400-italic.woff2", "fonts/amiri-latin-ext-400-normal.woff2", "fonts/aref-ruqaa-arabic-700-normal.woff2", "fonts/aref-ruqaa-latin-700-normal.woff2", "fonts/aref-ruqaa-latin-ext-700-normal.woff2", "fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2", "fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2", "fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2", "fonts/ibm-plex-sans-arabic-cyrillic-ext-400-normal.woff2", "fonts/ibm-plex-sans-arabic-cyrillic-ext-500-normal.woff2", "fonts/ibm-plex-sans-arabic-cyrillic-ext-600-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-400-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-500-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-600-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-ext-400-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-ext-500-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-ext-600-normal.woff2", "fonts/noto-sans-math-latin-400-normal.woff2"];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET'||new URL(req.url).origin!==location.origin) return;
  if(req.mode==='navigate'){
    const root=new URL('./',self.registration.scope).pathname, p=new URL(req.url).pathname;
    if(p!==root&&p!==root+'index.html') return;   // other pages (e.g. a review copy) are left to the network   // newest page when online, saved copy when offline
    e.respondWith(fetch(req).then(r=>{ const copy=r.clone(); caches.open(CACHE).then(c=>c.put('index.html',copy)); return r; }).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req)));
});
