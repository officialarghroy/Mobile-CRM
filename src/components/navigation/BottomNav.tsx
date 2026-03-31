"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm"
    >
      <Container className="px-0">
        <div className="grid grid-cols-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            href="/leads"
            className={`flex min-h-14 items-center justify-center text-sm transition-colors ${
              leadsActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            }`}
            aria-current={leadsActive ? "page" : undefined}
          >
            Leads
          </Link>
          <Link
            href="/calendar"
            className={`flex min-h-14 items-center justify-center text-sm transition-colors ${
              calendarActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            }`}
            aria-current={calendarActive ? "page" : undefined}
          >
            Calendar
          </Link>
        </div>
      </Container>
    </nav>
  );
}
