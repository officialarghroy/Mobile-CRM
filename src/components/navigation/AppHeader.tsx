"use client";

import { usePathname } from "next/navigation";
import { AppHeaderActions } from "@/components/navigation/AppHeaderActions";
import { HamburgerMenu } from "@/components/navigation/HamburgerMenu";
import type { MenuUserProfile } from "@/lib/menuUserProfile";
import { getRouteHeaderMeta } from "@/lib/routeHeaderMeta";

type AppHeaderProps = {
  initialProfile: MenuUserProfile;
};

export function AppHeader({ initialProfile }: AppHeaderProps) {
  const pathname = usePathname() ?? "";
  const { title, subtitle } = getRouteHeaderMeta(pathname);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--surface)] pt-[env(safe-area-inset-top)] shadow-[var(--shadow-card)]">
      <div className="flex w-full items-center gap-3 px-5 py-3">
        <HamburgerMenu initialProfile={initialProfile} />
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
        <AppHeaderActions />
      </div>
    </header>
  );
}
