// Service worker: fa funzionare l'app anche senza connessione.
// Quando modifichi i file dell'app, aumenta il numero di VERSION.
const VERSION = 'biblioteca-v3';
const IMG_CACHE = 'biblioteca-immagini';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION && k !== IMG_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // File dell'app: prima la rete (così arrivano gli aggiornamenti), poi la copia salvata.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Copertine e font: prima la copia salvata, così si vedono anche offline.
  if (req.destination === 'image' || req.destination === 'font' || url.hostname === 'fonts.googleapis.com') {
    e.respondWith(
      caches.open(IMG_CACHE).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              c.put(req, res.clone());
              return res;
            })
        )
      )
    );
  }
  // Ricerche su Google Books / Open Library: sempre dalla rete.
});
