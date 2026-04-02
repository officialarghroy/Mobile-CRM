import { getDisplayNameFromUser } from "@/lib/authDisplayName";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type MenuUserProfile = {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  hasSupabaseAuth: boolean;
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

      return {
        displayName,
        email,
        avatarUrl,
        hasSupabaseAuth: true,
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
  };
}
