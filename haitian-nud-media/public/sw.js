// Service Worker — Haïtien Nud Média
// Offline cache + Web Push Notifications

const CACHE_NAME = 'haitiannud-v2';
const urlsToCache = ['/', '/index.html', '/logo.jpg'];

// ── Install ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('SW: Some assets could not be cached:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch (offline) ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase')
  ) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        console.warn('SW: Offline — could not fetch', event.request.url);
      });
    })
  );
});

// ── Push notification received ────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'Haïtien Nud Média',
    body: 'Nouvelle vidéo disponible !',
    url: '/',
    icon: '/logo.jpg',
  };

  if (event.data) {
    try {
      data = { ...data, ...JSON.parse(event.data.text()) };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/logo.jpg',
      badge: '/logo.jpg',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      tag: 'haitian-nud-notif',
      requireInteraction: false,
    })
  );
});

// ── Notification click → open/focus app ──────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
