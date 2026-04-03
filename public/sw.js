/**
 * Minimal PWA worker: parity with the browser tab when online.
 * - No HTML precache (avoids stale / personalized documents).
 * - No cache-first for Next.js chunks (avoids stale JS/CSS after deploys).
 * - Navigations are network-only; offline falls back to a static shell page.
 */
const CACHE_NAME = "crm-pwa-shell-v2";
const PRECACHE_URLS = ["/offline.html", "/manifest.json", "/icon-192.svg", "/icon-512.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        for (const url of PRECACHE_URLS) {
          try {
            const res = await fetch(url);
            if (res.ok) await cache.put(url, res);
          } catch (e) {
            console.error("Precache miss:", url, e);
          }
        }
      } catch (err) {
        console.error("Service worker install precache:", err);
      } finally {
        await self.skipWaiting();
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match("/offline.html");
        if (fallback) return fallback;
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      }),
    );
  }
});
