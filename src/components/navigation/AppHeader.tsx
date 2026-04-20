"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useLayoutEffect, useRef, useState } from "react";
import { RiNotification3Line } from "react-icons/ri";
import { AppHeaderActions } from "@/components/navigation/AppHeaderActions";
import { HamburgerMenu } from "@/components/navigation/HamburgerMenu";
import type { MenuUserProfile } from "@/lib/menuUserProfile";
import { getRouteHeaderMeta } from "@/lib/routeHeaderMeta";
import { useNotificationUnreadCount } from "@/hooks/useNotificationUnreadCount";

type AppHeaderProps = {
  initialProfile: MenuUserProfile;
};

function HeaderNotificationBell({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const [popScale, setPopScale] = useState(1);
  const hasPlayedPop = useRef(false);

  useLayoutEffect(() => {
    if (unreadCount <= 0) {
      hasPlayedPop.current = false;
      return;
    }
    if (hasPlayedPop.current) return;
    hasPlayedPop.current = true;
    startTransition(() => {
      setPopScale(1.12);
    });
    const t = window.setTimeout(() => {
      startTransition(() => {
        setPopScale(1);
      });
    }, 320);
    return () => window.clearTimeout(t);
  }, [unreadCount]);

  return (
    <button
      type="button"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      onClick={() => router.push("/notifications")}
      className="relative flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:bg-[var(--surface-muted)] hover:shadow-[var(--shadow-elevated)] active:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none"
      style={{
        transform: `scale(${popScale})`,
      }}
    >
      <RiNotification3Line className="h-5 w-5 shrink-0" aria-hidden />
      {unreadCount > 0 ? (
        <span
          className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white"
          aria-hidden
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}

export function AppHeader({ initialProfile }: AppHeaderProps) {
  const pathname = usePathname() ?? "";
  const { title, subtitle } = getRouteHeaderMeta(pathname);
  const notificationUnreadCount = useNotificationUnreadCount({
    initialUnreadCount: initialProfile.unreadNotificationCount,
    hasSupabaseAuth: initialProfile.hasSupabaseAuth,
  });

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--surface)] pt-[env(safe-area-inset-top)] shadow-[var(--shadow-card)]">
      <div className="flex w-full items-center gap-3 px-5 py-3">
        <HamburgerMenu
          initialProfile={initialProfile}
          notificationUnreadCount={notificationUnreadCount}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[1.1875rem] font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[1.25rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-[0.8125rem] font-normal leading-snug text-[var(--text-secondary)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <HeaderNotificationBell unreadCount={notificationUnreadCount} />
          <AppHeaderActions />
        </div>
      </div>
    </header>
  );
}
