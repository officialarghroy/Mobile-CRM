"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RiCalendarEventLine, RiTeamLine } from "react-icons/ri";

export function HamburgerMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      >
        <span className="grid grid-cols-2 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-primary)]/80" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-primary)]/80" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-primary)]/80" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-primary)]/80" />
        </span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 z-0 bg-black/25 backdrop-blur-[1px]"
          />

          <aside className="absolute inset-y-0 left-0 z-10 flex w-[min(100vw-3rem,280px)] max-w-[280px] flex-col border-r border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-elevated)]">
            <nav className="mt-4 space-y-1" aria-label="Main navigation">
              <p className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">Navigation</p>
              <Link
                href="/leads"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-[0.8125rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
              >
                <RiTeamLine className="h-[1.125rem] w-[1.125rem] shrink-0 text-[var(--accent-strong)]" aria-hidden />
                Leads
              </Link>
              <Link
                href="/calendar"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-[0.8125rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
              >
                <RiCalendarEventLine className="h-[1.125rem] w-[1.125rem] shrink-0 text-[var(--accent-strong)]" aria-hidden />
                Calendar
              </Link>
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
