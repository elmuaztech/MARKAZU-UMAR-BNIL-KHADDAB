// Markazu Umar bn Al-Khattab SMS - Service Worker
// Powered by Workbox 7

const CACHE_NAME_PREFIX = 'markazu-sms';
const OFFLINE_FALLBACK_PAGE = '/offline.html';
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/offline.html',
  '/manifest.json',
  '/logo-rounded.png',
  '/logo.png',
  '/favicon.ico',
  '/school-bg.jpg',
  '/director.jpg',
];

// 1. Attempt to load Workbox from CDN
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
} catch (e) {
  console.warn('[SW] Workbox CDN could not be loaded offline; native cache fallback active.');
}

if (typeof workbox !== 'undefined') {
  workbox.setConfig({ debug: false });
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // 2. Precache Core Shell on Install
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(`${CACHE_NAME_PREFIX}-core-v1`).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Core precache partial warning:', err);
        });
      })
    );
  });

  // 3. Navigation Route: Network-First with Offline Page Fallback
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: `${CACHE_NAME_PREFIX}-pages-v1`,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // Fallback for navigation if both network and cache fail
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document' || event.request.mode === 'navigate') {
      const offlinePage = await caches.match(OFFLINE_FALLBACK_PAGE);
      if (offlinePage) return offlinePage;
    }
    return Response.error();
  });

  // 4. Next.js Static JS & CSS Chunks
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/_next/static/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `${CACHE_NAME_PREFIX}-static-v1`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 120,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 Days
        }),
      ],
    })
  );

  // 5. Images and Logos
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'image' ||
      /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname),
    new workbox.strategies.CacheFirst({
      cacheName: `${CACHE_NAME_PREFIX}-images-v1`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 6. Google Fonts (Stylesheets and WebFont Binaries)
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `${CACHE_NAME_PREFIX}-fonts-v1`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
        }),
      ],
    })
  );
} else {
  // Native fallback if workbox script is not present
  self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
      caches.open(`${CACHE_NAME_PREFIX}-core-v1`).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch(() => {});
      })
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request).catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match(OFFLINE_FALLBACK_PAGE);
          return fallback || Response.error();
        })
      );
      return;
    }

    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              const resClone = res.clone();
              caches.open(`${CACHE_NAME_PREFIX}-runtime-v1`).then((cache) => {
                cache.put(request, resClone);
              });
            }
            return res;
          })
        );
      })
    );
  });
}

// =======================================================
// 7. Mobile Push Notifications & Notification Click Hooks
// =======================================================
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Markazu Umar Islamiyyah', body: event.data.text() };
    }
  }

  const title = data.title || 'Markazu Umar SMS Alert';
  const options = {
    body: data.body || 'You have an important school update.',
    icon: data.icon || '/logo-rounded.png',
    badge: data.badge || '/favicon.ico',
    image: data.image || undefined,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
      id: data.id || Date.now(),
    },
    tag: data.tag || 'markazu-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
