"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const USERS = ["Argh", "Max", "John"] as const;
type AppUser = (typeof USERS)[number];

const USER_STORAGE_KEY = "crm_user";
const USER_COOKIE_KEY = "crm_user";

type UserSwitcherProps = {
  initialUser: AppUser;
};

export function UserSwitcher({ initialUser }: UserSwitcherProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<AppUser>(initialUser);

  useEffect(() => {
    const stored = window.localStorage.getItem(USER_STORAGE_KEY);
    if (stored && USERS.includes(stored as AppUser) && stored !== selectedUser) {
      const validUser = stored as AppUser;
      setSelectedUser(validUser);
      document.cookie = `${USER_COOKIE_KEY}=${encodeURIComponent(validUser)}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
      return;
    }

    window.localStorage.setItem(USER_STORAGE_KEY, selectedUser);
    document.cookie = `${USER_COOKIE_KEY}=${encodeURIComponent(selectedUser)}; path=/; max-age=31536000; samesite=lax`;
  }, [router, selectedUser]);

  const handleChange = (nextUser: string) => {
    if (!USERS.includes(nextUser as AppUser)) return;
    const validUser = nextUser as AppUser;
    setSelectedUser(validUser);
    window.localStorage.setItem(USER_STORAGE_KEY, validUser);
    document.cookie = `${USER_COOKIE_KEY}=${encodeURIComponent(validUser)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 pt-3">
      <label className="sr-only" htmlFor="user-switcher">
        Switch user
      </label>
      <select
        id="user-switcher"
        value={selectedUser}
        onChange={(event) => handleChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[color:rgba(255,255,255,0.06)] bg-[color:rgba(255,255,255,0.03)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[color:rgba(79,70,229,0.55)]"
      >
        {USERS.map((user) => (
          <option key={user} value={user} className="bg-[var(--bg)] text-[var(--text-primary)]">
            {user}
          </option>
        ))}
      </select>
    </div>
  );
}
