import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { TeamMemberRows } from "@/components/user/TeamMemberRows";
import { UsersPageToolbar } from "@/components/user/UsersPageToolbar";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { fetchTeamMembers, getMembershipForUser, parseTeamRole } from "@/lib/teamAccess";

export async function createUser(formData: FormData) {
  "use server";

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
}

export default async function UsersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { teamId } = await getMembershipForUser(supabase, user.id);

  const { rows, error } = await fetchTeamMembers(supabase);

  return (
    <main className="flex w-full flex-1 flex-col py-5">
      <Container className="flex flex-1 flex-col space-y-5 pb-24">
        <UsersPageToolbar createUser={createUser} />
        {!teamId && !error ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm text-[var(--text-secondary)]">
            You are not assigned to a team yet. Ask an admin to run the team migration or add you in Supabase.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--text-danger)] shadow-[var(--shadow-card)]">
            {error}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          <div
            className="grid grid-cols-[1fr_1fr_minmax(5rem,auto)] gap-3 border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3"
            role="row"
          >
            <div className="crm-section-label min-w-0" role="columnheader">
              Name
            </div>
            <div className="crm-section-label min-w-0 text-right" role="columnheader">
              Email
            </div>
            <div className="crm-section-label min-w-0 text-right" role="columnheader">
              Role
            </div>
          </div>

          {rows.length === 0 && !error ? (
            <div className="py-4 px-5 text-sm text-[var(--text-secondary)]">No team members found.</div>
          ) : null}

          <TeamMemberRows rows={rows} />
        </div>
      </Container>
    </main>
  );
}
