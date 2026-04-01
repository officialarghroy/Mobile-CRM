import type { User } from "@supabase/supabase-js";

/** Display name from user_metadata.name / full_name, else email local part. */
export function getDisplayNameFromUser(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fromMeta =
    (typeof meta?.name === "string" && meta.name.trim()) ||
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    null;
  const email = user.email ?? "";
  return (fromMeta ?? (email ? email.split("@")[0] : "")) || "Account";
}
