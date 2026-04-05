"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { parseTeamRole } from "@/lib/teamAccess";

export async function createUser(formData: FormData) {
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user: sessionUser },
  } = await sessionClient.auth.getUser();

  if (!sessionUser?.id) {
    throw new Error("You must be signed in.");
  }

  const { data: teamIdRaw, error: teamErr } = await sessionClient.rpc("get_my_team_id");
  if (teamErr || teamIdRaw == null) {
    throw new Error("You are not on a team. Run the teams migration or contact support.");
  }
  const teamId = String(teamIdRaw);

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  const roleRaw = String(formData.get("role") || "").trim();
  const newRole = parseTeamRole(roleRaw);

  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (password !== passwordConfirm) {
    throw new Error("Passwords do not match");
  }
  if (!newRole) {
    throw new Error("Choose a valid role");
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      provision_team_id: teamId,
      provision_role: newRole,
    },
    ...(displayName ? { user_metadata: { name: displayName } } : {}),
  });

  if (error) {
    throw new Error(error.message);
  }

  const newId = created.user?.id;
  if (!newId) {
    throw new Error("User was not created");
  }

  const { error: memErr } = await supabaseAdmin.from("team_members").upsert(
    {
      team_id: teamId,
      user_id: newId,
      role: newRole,
    },
    { onConflict: "team_id,user_id" },
  );

  if (memErr) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(newId);
    } catch {
      /* best effort */
    }
    throw new Error(memErr.message);
  }

  if (displayName) {
    await supabaseAdmin.from("user_profiles").upsert(
      { user_id: newId, display_name: displayName },
      { onConflict: "user_id" },
    );
  }

  revalidatePath("/users");
  revalidatePath("/calendar", "page");
}
