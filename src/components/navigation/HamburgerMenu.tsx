"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  RiCalendarEventLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiLogoutBoxRLine,
  RiTeamLine,
  RiUserLine,
} from "react-icons/ri";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { initialsFromDisplayName } from "@/lib/initialsFromDisplayName";
import type { MenuUserProfile } from "@/lib/menuUserProfile";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const noopSubscribe = () => () => {};

/** Break before @ so line 1 is local part and line 2 is @domain (e.g. @gmail.com). */
function MenuProfileEmail({ email }: { email: string }) {
  const at = email.indexOf("@");
  return (
    <p className="mt-1 text-[0.875rem] font-normal leading-snug text-[var(--text-secondary)] break-words">
      {at === -1 ? (
        email
      ) : (
        <>
          {email.slice(0, at)}
          <wbr />
          {email.slice(at)}
        </>
      )}
    </p>
  );
}

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
                className="absolute inset-0 z-0 bg-black/25 backdrop-blur-[2px]"
              />

              <aside className="absolute inset-y-0 left-0 z-10 flex min-h-0 w-[min(100vw-3rem,280px)] max-w-[280px] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]">
                <div className="shrink-0 pt-[env(safe-area-inset-top)]">
                  <div className="flex w-full items-center gap-3 px-5 py-3">
                    <button
                      type="button"
                      aria-label="Close navigation menu"
                      onClick={() => setIsOpen(false)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                    >
                      <RiCloseLine className="h-6 w-6 shrink-0 text-[var(--text-primary)]" aria-hidden />
                    </button>
                  </div>
                </div>

                <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-2" aria-label="Main navigation">
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

                <div className="mt-auto px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                  <Link
                    href="/leads/deleted"
                    onClick={() => setIsOpen(false)}
                    className="mb-3 flex min-h-[2.75rem] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                  >
                    <RiDeleteBinLine
                      className="h-5 w-5 shrink-0 text-[var(--text-secondary)] opacity-80"
                      aria-hidden
                    />
                    <span className="text-[0.9375rem] font-medium leading-snug text-[var(--text-secondary)]">
                      Recently deleted
                    </span>
                  </Link>

                  <footer className="border-t border-[var(--border)] pt-4">
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex min-h-[3.75rem] items-center gap-3.5 rounded-xl px-2 py-3 transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-start">
                      {initialProfile.avatarUrl ? (
                        <img
                          src={initialProfile.avatarUrl}
                          alt=""
                          className="h-14 w-14 rounded-full object-cover ring-1 ring-[var(--border)]"
                        />
                      ) : (
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[1.25rem] font-semibold text-[var(--text-primary)] ring-1 ring-[var(--border)]"
                          aria-hidden
                        >
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-base font-semibold leading-tight text-[var(--text-primary)]">
                        {initialProfile.displayName.trim() || "Account"}
                      </p>
                      {emailLine ? <MenuProfileEmail email={emailLine} /> : null}
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-3 flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-danger)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center" aria-hidden>
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[var(--text-danger)] ring-1 ring-red-200/90">
                        <RiLogoutBoxRLine className="h-[1.375rem] w-[1.375rem] shrink-0" />
                      </span>
                    </span>
                    <span className="min-w-0 text-[0.9375rem] font-medium leading-tight text-[var(--text-danger)]">
                      Log out
                    </span>
                  </button>
                  </footer>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
