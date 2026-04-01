"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiCalendarEventLine, RiTeamLine } from "react-icons/ri";
import { Container } from "@/components/ui/Container";

function isLeadsRoute(pathname: string): boolean {
  return pathname === "/leads" || pathname.startsWith("/leads/");
}

export function BottomNav() {
  const pathname = usePathname();
  const leadsActive = isLeadsRoute(pathname);
  const calendarActive = pathname === "/calendar" || pathname.startsWith("/calendar/");

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-30 bg-transparent"
    >
      <Container className="pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-0.5 shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          <Link
            href="/leads"
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] py-2 text-[0.75rem] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ${
              leadsActive
                ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-current={leadsActive ? "page" : undefined}
          >
            <RiTeamLine className="h-[1.125rem] w-[1.125rem]" aria-hidden />
            <span>Leads</span>
            <span
              className={`mt-0.5 h-1 w-1 rounded-full bg-[var(--accent-strong)] transition-opacity ${leadsActive ? "opacity-100" : "opacity-0"}`}
              aria-hidden
            />
          </Link>
          <Link
            href="/calendar"
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] py-2 text-[0.75rem] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ${
              calendarActive
                ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-current={calendarActive ? "page" : undefined}
          >
            <RiCalendarEventLine className="h-[1.125rem] w-[1.125rem]" aria-hidden />
            <span>Calendar</span>
            <span
              className={`mt-0.5 h-1 w-1 rounded-full bg-[var(--accent-strong)] transition-opacity ${calendarActive ? "opacity-100" : "opacity-0"}`}
              aria-hidden
            />
          </Link>
        </div>
      </Container>
    </nav>
  );
}
