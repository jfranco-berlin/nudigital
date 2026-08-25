// Nu Digital – Service Worker
// Strategie: HTML (die App selbst) IMMER zuerst aus dem Netz holen, wenn online,
// damit Updates sofort ankommen. Nur wenn kein Netz da ist, wird die zuletzt
// gespeicherte Version aus dem Cache gezeigt (Offline-Fähigkeit).
// Icons/Manifest: Cache-first, ändern sich praktisch nie.

const CACHE_VERSION = 'nudigital-v8';
const APP_SHELL = [
  './NuDigital.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const isHTML = request.mode === 'navigate' || request.destination === 'document';

  if (isHTML) {
    // Network-first: immer die neueste Version versuchen, offline auf Cache zurückfallen.
    // cache: 'no-store' verhindert, dass der normale HTTP-Cache des Browsers eine
    // veraltete Antwort zurückgibt, ohne wirklich beim Server nachzufragen.
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('./NuDigital.html', clone));
          return response;
        })
        .catch(() => caches.match('./NuDigital.html'))
    );
    return;
  }

  // Cache-first für alles andere (Icons, Manifest).
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
