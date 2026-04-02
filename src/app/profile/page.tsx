import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProfileForm } from "@/components/user/ProfileForm";
import { getDisplayNameFromUser } from "@/lib/authDisplayName";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    redirect("/login");
  }

  let displayName = getDisplayNameFromUser(user);
  let avatarUrl: string | null = null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile) {
    const p = profile as { display_name?: string | null; avatar_url?: string | null };
    if (typeof p.display_name === "string" && p.display_name.trim()) {
      displayName = p.display_name.trim();
    }
    if (typeof p.avatar_url === "string" && p.avatar_url.trim()) {
      avatarUrl = p.avatar_url.trim();
    }
  }

  return (
    <main className="flex w-full flex-1 flex-col py-5">
      <Container className="flex flex-1 flex-col space-y-5 pb-24">
        <h1 className="crm-page-title pt-1">Profile</h1>
        <ProfileForm
          userId={user.id}
          email={user.email}
          initialDisplayName={displayName}
          initialAvatarUrl={avatarUrl}
        />
      </Container>
    </main>
  );
}
