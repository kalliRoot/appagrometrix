/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'agrometrix-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event com estratégias diferentes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls - network-first
  if (url.hostname.includes('api.open-meteo.com') || url.hostname.includes('nominatim.openstreetmap.org')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets - cache-first
  if (request.method === 'GET' && shouldCache(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default - network-first com fallback
  event.respondWith(networkFirstWithFallback(request));
});

/**
 * Cache-first strategy
 */
async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first strategy
 */
async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first com fallback para offline
 */
async function networkFirstWithFallback(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch {
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }

    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Verifica se deve fazer cache
 */
function shouldCache(pathname: string): boolean {
  const extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf'];
  return extensions.some((ext) => pathname.endsWith(ext));
}
