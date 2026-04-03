"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { RiCalendarEventLine, RiCloseLine, RiLogoutBoxRLine, RiTeamLine, RiUserLine } from "react-icons/ri";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { initialsFromDisplayName } from "@/lib/initialsFromDisplayName";
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

type HamburgerMenuProps = {
  initialProfile: MenuUserProfile;
};

export function HamburgerMenu({ initialProfile }: HamburgerMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isClient = useIsClient();

  useBodyScrollLock(isOpen && isClient);

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

  const initials = initialsFromDisplayName(initialProfile.displayName);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
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

              <aside className="absolute inset-y-0 left-0 z-10 flex min-h-0 w-[min(100vw-3rem,280px)] max-w-[280px] flex-col border-r border-[var(--border)] bg-[var(--surface)] p-5 pt-[max(1rem,env(safe-area-inset-top))] shadow-[var(--shadow-elevated)]">
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

                <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto" aria-label="Main navigation">
                  <Link
                    href="/leads"
                    onClick={() => setIsOpen(false)}
                    className="flex min-h-[3rem] items-center gap-4 rounded-xl px-4 py-4 text-xl font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                  >
                    <RiTeamLine className="h-8 w-8 shrink-0 text-[var(--accent-strong)]" aria-hidden />
                    Leads
                  </Link>
                  <Link
                    href="/calendar"
                    onClick={() => setIsOpen(false)}
                    className="flex min-h-[3rem] items-center gap-4 rounded-xl px-4 py-4 text-xl font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                  >
                    <RiCalendarEventLine className="h-8 w-8 shrink-0 text-[var(--accent-strong)]" aria-hidden />
                    Calendar
                  </Link>
                  {initialProfile.hasSupabaseAuth ? (
                    <>
                      <Link
                        href="/users"
                        onClick={() => setIsOpen(false)}
                        className="flex min-h-[3rem] items-center gap-4 rounded-xl px-4 py-4 text-xl font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                      >
                        <RiUserLine className="h-8 w-8 shrink-0 text-[var(--accent-strong)]" aria-hidden />
                        Users
                      </Link>
                    </>
                  ) : null}
                </nav>

                <footer className="mt-auto border-t border-[var(--border)] pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                  >
                    {initialProfile.avatarUrl ? (
                      <img
                        src={initialProfile.avatarUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-[var(--border)]"
                      />
                    ) : (
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[1.0625rem] font-semibold text-[var(--text-primary)] ring-1 ring-[var(--border)]"
                        aria-hidden
                      >
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[0.9375rem] font-semibold leading-tight text-[var(--text-primary)]">
                        {initialProfile.displayName.trim() || "Account"}
                      </p>
                      {emailLine ? (
                        <p
                          className="mt-1 truncate text-[0.8125rem] font-normal leading-snug text-[var(--text-secondary)]"
                          title={emailLine}
                        >
                          {emailLine}
                        </p>
                      ) : null}
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] ring-1 ring-[var(--border)]"
                      aria-hidden
                    >
                      <RiLogoutBoxRLine className="h-5 w-5 shrink-0" />
                    </span>
                    <span className="min-w-0 text-[0.9375rem] font-medium leading-tight text-[var(--text-secondary)]">
                      Log out
                    </span>
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
