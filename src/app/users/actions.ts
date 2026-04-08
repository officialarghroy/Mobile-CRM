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
  /* Lowercase so auth app_metadata matches handle_new_user_team's UUID check (case-sensitive regex in DB). */
  const teamId = String(teamIdRaw).trim().toLowerCase();

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
    /* GoTrue often returns only "Database error creating new user" here; the real cause is in Postgres (usually the auth.users trigger). */
    const err = error as Error & { code?: string; status?: number };
    console.error("auth.admin.createUser failed:", {
      message: err.message,
      code: err.code,
      status: err.status,
      email,
    });
    if (err.message === "Database error creating new user") {
      throw new Error(
        "Supabase rolled back user creation: almost always permission denied inside public.handle_new_user_team (auth triggers run as supabase_auth_admin). Apply supabase/migrations/20260409120000_fix_handle_new_user_team_auth_admin_permissions.sql in the SQL Editor (OWNER TO postgres, SECURITY DEFINER). Then check Postgres logs if it persists.",
      );
    }
    throw new Error(err.message);
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

  const { data: membershipCheck, error: membershipVerifyErr } = await supabaseAdmin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("user_id", newId)
    .maybeSingle();

  if (membershipVerifyErr || !membershipCheck) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(newId);
    } catch {
      /* best effort */
    }
    throw new Error(
      "The user was created but could not be confirmed on your team. Check database migrations (handle_new_user_team / team_members) or try again.",
    );
  }

  if (displayName) {
    const { error: profileErr } = await supabaseAdmin.from("user_profiles").upsert(
      { user_id: newId, display_name: displayName },
      { onConflict: "user_id" },
    );
    if (profileErr) {
      console.error("user_profiles upsert after createUser:", profileErr.message);
    }
  }

  revalidatePath("/users");
  revalidatePath("/users", "layout");
  revalidatePath("/calendar", "page");
}
