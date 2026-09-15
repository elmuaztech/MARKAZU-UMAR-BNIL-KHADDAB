// Custom Service Worker extension for Markazu Umar School Management System
// Handles native device push notifications and background click navigation

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
