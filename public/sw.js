// Sharable — Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push events from the server
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Sharable', body: event.data.text(), url: '/alerts' };
  }

  const title = payload.title || 'Sharable';
  const options = {
    body: payload.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.url || '/alerts' },
    vibrate: [100, 50, 100],
    tag: payload.tag || 'sharable-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — open or focus the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/alerts';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, navigate that tab
      for (const client of clientList) {
        if ('navigate' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      // Otherwise open a new tab
      return self.clients.openWindow(targetUrl);
    })
  );
});
