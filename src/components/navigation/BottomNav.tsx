"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { RiArrowLeftLine, RiArrowRightLine, RiCalendarEventLine, RiTeamLine } from "react-icons/ri";
import { Container } from "@/components/ui/Container";

function isLeadsRoute(pathname: string): boolean {
  return pathname === "/leads" || pathname.startsWith("/leads/");
}

type NavItemInnerProps = {
  routeActive: boolean;
  label: string;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
};

function BottomNavItemInner({ routeActive, label, Icon }: NavItemInnerProps) {
  const { pending } = useLinkStatus();
  const highlighted = routeActive || pending;

  return (
    <span
      className={`flex min-h-10 w-full flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[0.75rem] font-semibold leading-tight transition-[color,background-color,box-shadow] duration-150 ease-out will-change-[background-color,color] ${
        highlighted
          ? "bg-[var(--surface)] text-[var(--accent-strong)] shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
          : "text-[var(--text-secondary)] group-hover:bg-[var(--surface)]/85 group-hover:text-[var(--text-primary)]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
      <span
        className={`h-0.5 w-0.5 rounded-full bg-[var(--accent-strong)] transition-opacity duration-150 ${highlighted ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      />
    </span>
  );
}

type BottomNavItemProps = {
  href: string;
  routeActive: boolean;
  label: string;
  Icon: NavItemInnerProps["Icon"];
};

function BottomNavItem({ href, routeActive, label, Icon }: BottomNavItemProps) {
  return (
    <Link
      href={href}
      prefetch
      scroll
      className="group touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
      aria-current={routeActive ? "page" : undefined}
    >
      <BottomNavItemInner routeActive={routeActive} label={label} Icon={Icon} />
    </Link>
  );
}

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const leadsActive = isLeadsRoute(pathname);
  const calendarActive = pathname === "/calendar" || pathname.startsWith("/calendar/");

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)] pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(15,23,42,0.07)]"
    >
      <Container>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--text-secondary)] shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-[0.98]"
          >
            <RiArrowLeftLine className="h-5 w-5 shrink-0" aria-hidden />
          </button>
          <div className="min-w-0 flex-1 grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-muted)] p-1">
            <BottomNavItem href="/leads" routeActive={leadsActive} label="Leads" Icon={RiTeamLine} />
            <BottomNavItem href="/calendar" routeActive={calendarActive} label="Calendar" Icon={RiCalendarEventLine} />
          </div>
          <button
            type="button"
            aria-label="Go forward"
            onClick={() => router.forward()}
            className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--text-secondary)] shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-[0.98]"
          >
            <RiArrowRightLine className="h-5 w-5 shrink-0" aria-hidden />
          </button>
        </div>
      </Container>
    </nav>
  );
}
