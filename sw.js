// Birthday Piano offline support (redesign item 9). The page and the game module come from the network first, so
// an update reaches the family on the next open; the cached copy is used only when offline. Pictures are cache-first.
// VERSION is stamped with the commit by the publish workflow, which also clears old caches.
const VERSION = 'fc0ac2c';
const CACHE = 'birthday-piano-' + VERSION;
const SHELL = ['./index.html', './song.mjs', './manifest.webmanifest', './art/valley/icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('birthday-piano-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const isShell = req.mode === 'navigate' || /\.(?:html|mjs|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isShell) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); if (res.ok) caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); if (res.ok) caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
  }
});
