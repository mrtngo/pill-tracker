const CACHE_NAME = 'aegis-pill-tracker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Service Worker and cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate SW and clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch interceptor: Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  // Avoid caching browser extensions or external non-http resources
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('https://fonts.')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If response is valid, clone and save in cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try serving from cache
        return caches.match(event.request);
      })
  );
});

// Handle local notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open the app or focus the window if already open
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Listen to push notifications (useful if integrated with a backend push server in the future)
self.addEventListener('push', (event) => {
  let data = { title: '¡Hora de tomar tu pastilla!', body: 'Toma tu pastilla de esta noche para mantener tu racha de adherencia.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '¡Hora de tomar tu pastilla!', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfNotification: Date.now()
    },
    actions: [
      { action: 'confirm', title: '¡La tomé!' },
      { action: 'snooze', title: 'Recordar en 1 hora' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
