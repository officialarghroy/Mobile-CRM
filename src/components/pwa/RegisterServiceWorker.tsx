"use client";

import { useEffect } from "react";

/**
 * Marks that this tab has already been controlled by a service worker once.
 * Used to reload only on *updates* (new deploy), not on first install / first control.
 */
const SW_SESSION_KEY = "crm-sw-controller-seen";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    let refreshing = false;
    let visibilityHandler: (() => void) | null = null;

    const onControllerChange = () => {
      if (cancelled || refreshing) return;
      try {
        if (!sessionStorage.getItem(SW_SESSION_KEY)) {
          sessionStorage.setItem(SW_SESSION_KEY, "1");
          return;
        }
      } catch {
        /* Cannot persist; skip auto-reload to avoid refresh loops in strict / private modes */
        return;
      }
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;

        visibilityHandler = () => {
          if (cancelled || document.visibilityState !== "visible") return;
          void registration.update();
        };
        document.addEventListener("visibilitychange", visibilityHandler);

        await registration.update();
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    })();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
      }
    };
  }, []);

  return null;
}
