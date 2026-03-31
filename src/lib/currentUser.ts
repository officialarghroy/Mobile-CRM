import { cookies } from "next/headers";

export const USERS = ["Argh", "Max", "John"] as const;
export type AppUser = (typeof USERS)[number];

export const DEFAULT_USER: AppUser = "Argh";
export const USER_COOKIE_KEY = "crm_user";

export async function getCurrentUser(): Promise<AppUser> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(USER_COOKIE_KEY)?.value;

  if (fromCookie && USERS.includes(fromCookie as AppUser)) {
    return fromCookie as AppUser;
  }

  return DEFAULT_USER;
}
