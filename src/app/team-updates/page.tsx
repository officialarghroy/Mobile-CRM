import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppMain } from "@/components/layout/AppMain";
import { TeamUpdatesPageClient } from "@/components/team-updates/TeamUpdatesPageClient";
import { TeamUpdatesPageSkeleton } from "@/components/team-updates/TeamUpdatesPageSkeleton";
import { Container } from "@/components/ui/Container";
import { buildCreatorLookupFromTeamMembers } from "@/lib/calendarCreatorLabel";
import { fetchTeamUpdatesData } from "@/lib/fetchTeamUpdates";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { fetchTeamMembers } from "@/lib/teamAccess";

export const dynamic = "force-dynamic";

async function TeamUpdatesPageContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const viewerUserId = user.id;
  const [{ rows, leadOptions }, { rows: teamMembers, error: teamMembersError }] = await Promise.all([
    fetchTeamUpdatesData(supabase),
    fetchTeamMembers(supabase),
  ]);

  const creatorLookup = buildCreatorLookupFromTeamMembers(teamMembers);

  return (
    <TeamUpdatesPageClient
      initialRows={rows}
      leadOptions={leadOptions}
      teamMembers={teamMembers}
      teamMembersError={teamMembersError}
      creatorLookup={creatorLookup}
      viewerUserId={viewerUserId}
    />
  );
}

export default function TeamUpdatesPage() {
  return (
    <AppMain>
      <Container className="flex min-h-0 flex-1 flex-col space-y-4 pb-[var(--app-page-scroll-pad)]">
        <Suspense fallback={<TeamUpdatesPageSkeleton />}>
          <TeamUpdatesPageContent />
        </Suspense>
      </Container>
    </AppMain>
  );
}
