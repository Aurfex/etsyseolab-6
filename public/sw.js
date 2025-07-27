// A basic service worker for PWA functionality (caching)

const CACHE_NAME = 'etsy-seo-optimizer-cache-v2'; // <--- UPDATED CACHE VERSION
const urlsToCache = [
  '/',
  '/index.html',
  // Note: We don't cache index.tsx or other source files directly.
  // We cache the bundled JS that the browser requests.
  // For this environment, we will let the browser cache esm.sh modules.
  // In a real build system, we'd cache the actual bundled JS files.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              if (response.type !== 'opaque' && response.type !== 'cors') {
                 // Don't cache esm.sh or other cross-origin scripts with this basic setup
                 return response;
              }
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});