const CACHE_NAME = 'poker-tracker-v8';
const urlsToCache = [
  '/',
  '/index.html',
  '/connect.html',
  '/multiplayer.html',
  '/guide.html',
  '/blog.html',
  '/about.html',
  '/styles.css',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache each URL independently so one failed fetch (404/network blip)
        // doesn't abort the whole install and break offline mode.
        return Promise.all(
          urlsToCache.map(url =>
            cache.add(url).catch(err =>
              console.warn('SW: failed to cache', url, err)
            )
          )
        );
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip caching for external resources (Google Analytics, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Network failed. For page navigations, fall back to the cached
          // app shell so the PWA still opens offline.
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then(page =>
              page || caches.match('/')
            );
          }
          return new Response('Offline - no cached version available');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
