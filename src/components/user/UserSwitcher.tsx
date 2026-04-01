"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const USERS = ["Argh", "Max", "John"] as const;
type AppUser = (typeof USERS)[number];

const USER_STORAGE_KEY = "crm_user";
const USER_COOKIE_KEY = "crm_user";

type UserSwitcherProps = {
  initialUser: AppUser;
  compact?: boolean;
};

export function UserSwitcher({ initialUser, compact = false }: UserSwitcherProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<AppUser>(() => {
    if (typeof window === "undefined") return initialUser;
    const stored = window.localStorage.getItem(USER_STORAGE_KEY);
    if (stored && USERS.includes(stored as AppUser)) {
      return stored as AppUser;
    }
    return initialUser;
  });

  useEffect(() => {
    window.localStorage.setItem(USER_STORAGE_KEY, selectedUser);
    document.cookie = `${USER_COOKIE_KEY}=${encodeURIComponent(selectedUser)}; path=/; max-age=31536000; samesite=lax`;
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser !== initialUser) {
      router.refresh();
    }
  }, [initialUser, router, selectedUser]);

  const handleChange = (nextUser: string) => {
    if (!USERS.includes(nextUser as AppUser)) return;
    const validUser = nextUser as AppUser;
    setSelectedUser(validUser);
    window.localStorage.setItem(USER_STORAGE_KEY, validUser);
    document.cookie = `${USER_COOKIE_KEY}=${encodeURIComponent(validUser)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div className={compact ? "w-auto shrink-0" : "mx-auto w-full max-w-[480px] px-4 pt-3"}>
      <label className="sr-only" htmlFor="user-switcher">
        Switch user
      </label>
      <select
        id="user-switcher"
        value={selectedUser}
        onChange={(event) => handleChange(event.target.value)}
        className={`rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] text-[0.8125rem] font-medium text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent-strong)] ${
          compact ? "h-10 min-h-10 w-[128px] px-3" : "h-11 min-h-11 w-full px-3.5"
        }`}
      >
        {USERS.map((user) => (
          <option key={user} value={user} className="bg-[var(--surface)] text-[var(--text-primary)]">
            {user}
          </option>
        ))}
      </select>
    </div>
  );
}
