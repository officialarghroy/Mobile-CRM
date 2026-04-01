const CACHE_NAME = "crm-v1";
const ESSENTIAL_ROUTES = ["/", "/leads", "/calendar"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        for (const url of ESSENTIAL_ROUTES) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.error("Failed to cache:", url, err);
          }
        }
      } catch (err) {
        console.error("Service worker install (cache open):", err);
      } finally {
        await self.skipWaiting();
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return Promise.resolve(false);
        }),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAssetRequest(request) {
  const destination = request.destination;
  return destination === "style" || destination === "script" || destination === "image";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match("/leads");
        }
      })(),
    );
    return;
  }

  if (isStaticAssetRequest(request)) {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      })(),
    );
  }
});
