// Service worker de Krinkels Plan : appli disponible hors ligne et mises à jour immédiates.
// La version vient de index.html (APPV), passée dans l'adresse : sw.js?v=…
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = 'krinkels-' + VERSION;
const TILES = 'krinkels-tuiles';
const MAX_TILES = 400;
const FILES = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))
      .then(() => c.add(new Request('./stations.json', { cache: 'reload' })).catch(() => {})))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== TILES).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Réseau d'abord (sans cache HTTP) pour avoir tout de suite la dernière version ; copie locale si pas de connexion.
function networkFirst(req) {
  return fetch(req, { cache: 'no-cache' }).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r =>
    r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
}

// Morceaux de carte OpenStreetMap : copie locale d'abord, pour revoir la carte sans réseau.
function tile(req) {
  return caches.open(TILES).then(c => c.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) {
      c.put(req, r.clone());
      c.keys().then(k => { for (let i = 0; i < k.length - MAX_TILES; i++) c.delete(k[i]); });
    }
    return r;
  })));
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname === 'tile.openstreetmap.org') { e.respondWith(tile(req)); return; }
  if (url.origin !== location.origin) return;
  // version.json sert à détecter les mises à jour : toujours en direct, jamais en cache.
  if (url.pathname.endsWith('/version.json')) return;
  e.respondWith(networkFirst(req));
});
