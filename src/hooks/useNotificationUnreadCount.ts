"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type UseNotificationUnreadCountArgs = {
  initialUnreadCount: number;
  hasSupabaseAuth: boolean;
};

/**
 * Unread in-app notification count for the signed-in user.
 * Refetches on route changes, tab focus / visibility, and Supabase Realtime on `notifications`.
 */
export function useNotificationUnreadCount({
  initialUnreadCount,
  hasSupabaseAuth,
}: UseNotificationUnreadCountArgs): number {
  const pathname = usePathname() ?? "";
  const [count, setCount] = useState(() => Math.max(0, initialUnreadCount));

  const refresh = useCallback(async () => {
    if (!hasSupabaseAuth) {
      setCount(0);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCount(0);
        return;
      }
      const { count: next, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code?: string }).code ?? "")
            : "";
        if (code === "PGRST205") {
          setCount(0);
        }
        return;
      }
      if (typeof next === "number") {
        setCount(Math.max(0, next));
      }
    } catch {
      /* keep last known count */
    }
  }, [hasSupabaseAuth]);

  useEffect(() => {
    void refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    if (!hasSupabaseAuth) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onWindowFocus = () => void refresh();

    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hasSupabaseAuth, refresh]);

  useEffect(() => {
    if (!hasSupabaseAuth) return;

    const supabase = getSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`crm-notifications-unread:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (!cancelled) void refresh();
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [hasSupabaseAuth, refresh]);

  return count;
}
