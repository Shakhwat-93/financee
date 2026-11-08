/* হিসাব খাতা — অফলাইন সার্ভিস ওয়ার্কার */
const VERSION = 'hisab-v2';
const SHELL = [
  './',
  'index.html',
  'css/app.css',
  'js/store.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // নেভিগেশন (HTML পেজ): আগে ক্যাশ, ব্যাকগ্রাউন্ডে আপডেট (Stale-While-Revalidate)
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('index.html').then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put('index.html', copy));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // এসেটস: ক্যাশ ফার্স্ট, না পেলে নেটওয়ার্ক
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
