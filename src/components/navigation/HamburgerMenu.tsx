"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  RiAccountCircleLine,
  RiCalendarEventLine,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiTeamLine,
  RiUserLine,
} from "react-icons/ri";
import type { MenuUserProfile } from "@/lib/menuUserProfile";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const noopSubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Pill bars, slate tone, soft under-shadow per bar (matches menu icon reference). */
function HamburgerBar() {
  return (
    <span className="h-[5px] w-[1.125rem] shrink-0 rounded-full bg-[#6B7A8F] shadow-[0_2px_3px_rgba(15,23,42,0.14)]" />
  );
}

function HamburgerGlyph() {
  return (
    <span className="flex flex-col items-center justify-center gap-[5px]" aria-hidden>
      <HamburgerBar />
      <HamburgerBar />
      <HamburgerBar />
    </span>
  );
}

function getInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  if (parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

type HamburgerMenuProps = {
  initialProfile: MenuUserProfile;
};

export function HamburgerMenu({ initialProfile }: HamburgerMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isClient = useIsClient();

  useEffect(() => {
    queueMicrotask(() => setIsOpen(false));
  }, [pathname]);

  const emailLine =
    initialProfile.email ??
    (initialProfile.hasSupabaseAuth ? null : "Local account");

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }

    setIsOpen(false);
    window.location.assign("/login");
  };

  const initials = getInitials(initialProfile.displayName);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      >
        <HamburgerGlyph />
      </button>

      {isClient && isOpen
        ? createPortal(
            <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Navigation menu">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 z-0 bg-black/25 backdrop-blur-[1px]"
              />

              <aside className="absolute inset-y-0 left-0 z-10 flex min-h-0 w-[min(100vw-3rem,280px)] max-w-[280px] flex-col border-r border-[var(--border)] bg-[var(--surface)] p-5 pt-4 shadow-[var(--shadow-elevated)]">
                <div className="mb-4 flex shrink-0 justify-end">
                  <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setIsOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                  >
                    <RiCloseLine className="h-6 w-6 shrink-0" aria-hidden />
                  </button>
                </div>

                <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Main navigation">
                  <Link
                    href="/leads"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-[1.0625rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                  >
                    <RiTeamLine className="h-6 w-6 shrink-0 text-[var(--accent-strong)]" aria-hidden />
                    Leads
                  </Link>
                  <Link
                    href="/calendar"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-[1.0625rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                  >
                    <RiCalendarEventLine className="h-6 w-6 shrink-0 text-[var(--accent-strong)]" aria-hidden />
                    Calendar
                  </Link>
                  {initialProfile.hasSupabaseAuth ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-[1.0625rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                      >
                        <RiAccountCircleLine className="h-6 w-6 shrink-0 text-[var(--accent-strong)]" aria-hidden />
                        Profile
                      </Link>
                      <Link
                        href="/users"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-[1.0625rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                      >
                        <RiUserLine className="h-6 w-6 shrink-0 text-[var(--accent-strong)]" aria-hidden />
                        Users
                      </Link>
                    </>
                  ) : null}
                </nav>

                <footer className="mt-auto border-t border-[var(--border)] pt-4">
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 rounded-lg py-3 transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                  >
                    {initialProfile.avatarUrl ? (
                      <img
                        src={initialProfile.avatarUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[1.0625rem] font-medium text-[var(--text-primary)]"
                        aria-hidden
                      >
                        {initials}
                      </div>
                    )}
                    <p className="min-w-0 flex-1 pt-0.5 text-left text-[1rem] font-normal leading-snug text-[var(--text-secondary)] [overflow-wrap:anywhere]">
                      {emailLine ?? "—"}
                    </p>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-lg py-3 text-[1.0625rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                  >
                    <RiLogoutBoxRLine className="h-5 w-5 shrink-0 text-[var(--text-secondary)]" aria-hidden />
                    Logout
                  </button>
                </footer>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
