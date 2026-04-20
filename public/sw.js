/**
 * Minimal PWA worker: parity with the browser tab when online.
 * - No HTML precache (avoids stale / personalized documents).
 * - No cache-first for Next.js chunks (avoids stale JS/CSS after deploys).
 * - Navigations are network-only; offline falls back to a static shell page.
 * - Bump CACHE_NAME when PRECACHE_URLS or shell behavior change so old shells are deleted on activate.
 * - Client reloads on new worker (RegisterServiceWorker) so installs pick up new sw.js/fast.
 * - Keep theme colors in sync: public/manifest.json, public/offline.html, src/app/layout.tsx (viewport.themeColor).
 */
const CACHE_NAME = "crm-pwa-shell-v9";
const PRECACHE_URLS = ["/offline.html", "/manifest.json", "/Logo.webp"];

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

  const url = new URL(request.url);

  /** Never let the worker sit between Next.js RSC / data fetches and the network (avoids stale calendar after mutations in PWA). */
  if (url.pathname.startsWith("/_next/") || request.headers.get("RSC") === "1" || request.headers.get("Next-Router-Prefetch") === "1") {
    event.respondWith(fetch(request));
    return;
  }

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
