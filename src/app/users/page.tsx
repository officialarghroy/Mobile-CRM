import { redirect } from "next/navigation";
import { AppMain } from "@/components/layout/AppMain";
import { TeamMemberRows } from "@/components/user/TeamMemberRows";
import { Container } from "@/components/ui/Container";
import { usersTableClassName, usersTableEmailColumnClass } from "@/components/user/usersTableLayout";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { fetchTeamMembers, getMembershipForUser } from "@/lib/teamAccess";

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
    <AppMain>
      <Container className="flex min-w-0 flex-col space-y-5 pb-[var(--app-page-scroll-pad)]">
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
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <div className="w-full min-w-0">
              <table className={usersTableClassName}>
                <colgroup>
                  <col className="min-w-0" style={{ width: "28%" }} />
                  <col className="min-w-0" style={{ width: "48%" }} />
                  <col className="min-w-0" style={{ width: "24%" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                    <th scope="col" className="crm-section-label min-w-0 px-4 py-3 text-left">
                      Name
                    </th>
                    <th
                      scope="col"
                      className={`crm-section-label min-w-0 py-3 text-left ${usersTableEmailColumnClass}`}
                    >
                      Email
                    </th>
                    <th scope="col" className="crm-section-label min-w-0 px-4 py-3 text-right">
                      Role
                    </th>
                  </tr>
                </thead>
                <TeamMemberRows rows={rows} />
              </table>
            </div>
          </div>
        </div>
      </Container>
    </AppMain>
  );
}
