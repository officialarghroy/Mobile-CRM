import { getDisplayNameFromUser } from "@/lib/authDisplayName";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type MenuUserProfile = {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  hasSupabaseAuth: boolean;
  /** Unread in-app notifications (best-effort; may be 0 if table or columns are missing). */
  unreadNotificationCount: number;
};

export async function getMenuUserProfile(): Promise<MenuUserProfile> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const email = user.email ?? null;
      let displayName = getDisplayNameFromUser(user);

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      let avatarUrl: string | null = null;
      if (!profileError && profile) {
        const fromProfile =
          typeof profile.display_name === "string" ? profile.display_name.trim() : "";
        if (fromProfile) {
          displayName = fromProfile;
        }
        const raw =
          profile && typeof (profile as { avatar_url?: unknown }).avatar_url === "string"
            ? String((profile as { avatar_url: string }).avatar_url).trim()
            : "";
        avatarUrl = raw || null;
      }

      let unreadNotificationCount = 0;
      try {
        const { count, error: unreadError } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
        const code =
          unreadError && typeof unreadError === "object" && "code" in unreadError
            ? String((unreadError as { code?: string }).code ?? "")
            : "";
        if (!unreadError && typeof count === "number") {
          unreadNotificationCount = count;
        } else if (code && code !== "PGRST205") {
          console.error("Unread notifications count failed:", unreadError);
        }
      } catch {
        /* ignore */
      }

      return {
        displayName,
        email,
        avatarUrl,
        hasSupabaseAuth: true,
        unreadNotificationCount,
      };
    }
  } catch {
    /* Supabase session unavailable */
  }

  return {
    displayName: "Sign in",
    email: null,
    avatarUrl: null,
    hasSupabaseAuth: false,
    unreadNotificationCount: 0,
  };
}
