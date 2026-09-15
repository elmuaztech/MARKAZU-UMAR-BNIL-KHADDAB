// ============================================================================
// Markazu Umar bn Al-Khattab SMS - Unified PWA Service Worker
// Fully compliant with PWABuilder, Google Play PWA Packaging & W3C PWA Standards
// 
// Capabilities:
// 1. Offline Navigation Support with fallback page (/offline.html)
// 2. Intelligent Caching (CacheFirst for images, StaleWhileRevalidate for assets)
// 3. Native Web Push Notifications (push, notificationclick, pushsubscriptionchange)
// 4. Background Sync (sync event listener for offline replay)
// 5. Periodic Background Sync (periodicsync event listener for scheduled updates)
// ============================================================================

const CACHE_NAME_PREFIX = 'markazu-sms-v2';
const STATIC_CACHE = `${CACHE_NAME_PREFIX}-static`;
const PAGES_CACHE = `${CACHE_NAME_PREFIX}-pages`;
const IMAGES_CACHE = `${CACHE_NAME_PREFIX}-images`;
const OFFLINE_FALLBACK_PAGE = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/offline.html',
  '/manifest.json',
  '/logo-rounded.png',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/school-bg.jpg',
  '/director.jpg',
  '/screenshots/home-1080x1920.png',
  '/screenshots/home-1920x1080.png',
];

// ----------------------------------------------------------------------------
// 1. Service Worker Installation & Pre-caching
// ----------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial warning:', err);
      });
    })
  );
});

// ----------------------------------------------------------------------------
// 2. Service Worker Activation & Outdated Cache Cleanup
// ----------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('markazu-sms') && name !== STATIC_CACHE && name !== PAGES_CACHE && name !== IMAGES_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ----------------------------------------------------------------------------
// 3. Fetch Event Handler (Offline Support & Has Logic)
// ----------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser extension requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // A. Navigation requests: Network-First with Offline Page Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match(OFFLINE_FALLBACK_PAGE);
          return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // B. Static Images: Cache-First
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(IMAGES_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => caches.match('/favicon.ico'));
      })
    );
    return;
  }

  // C. Scripts & Styles: Stale-While-Revalidate
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/_next/static')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // D. General Requests: Cache with Network Fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// ----------------------------------------------------------------------------
// 4. Native Web Push Notifications (PWABuilder & Mobile App Standard)
// ----------------------------------------------------------------------------
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
    icon: data.icon || '/icon-192.png',
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

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        console.log('[SW] Push subscription refreshed:', subscription.endpoint);
      })
      .catch((err) => {
        console.warn('[SW] Push subscription refresh error:', err);
      })
  );
});

// ----------------------------------------------------------------------------
// 5. Automatic Background Sync & Periodic Sync (PWABuilder & Mobile Sync)
// ----------------------------------------------------------------------------
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync event triggered:', event.tag);
  if (event.tag === 'markazu-auto-sync' || event.tag === 'sync-queue') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_AUTO_SYNC', timestamp: Date.now() });
        });
      })
    );
  }
});

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic Background Sync event triggered:', event.tag);
  if (event.tag === 'markazu-periodic-sync' || event.tag === 'content-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_PERIODIC_SYNC', timestamp: Date.now() });
        });
      })
    );
  }
});
