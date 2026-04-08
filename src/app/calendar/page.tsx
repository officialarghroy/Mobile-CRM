import { Suspense } from "react";
import { AppMain } from "@/components/layout/AppMain";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { CalendarPageSkeleton } from "@/components/calendar/CalendarPageSkeleton";
import { Container } from "@/components/ui/Container";
import { buildCreatorLookupFromTeamMembers, EMPTY_CREATOR_LOOKUP } from "@/lib/calendarCreatorLabel";
import { normalizeCalendarEventRow, type CalendarEventRow } from "@/lib/calendarEventDisplay";
import { isLegacyCalendarEventsSchemaError } from "@/lib/calendarEventsSchemaError";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { fetchTeamMembers, type TeamMemberRow } from "@/lib/teamAccess";
import { createCalendarEvent } from "./actions";

export const dynamic = "force-dynamic";

async function CalendarPageContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerEmail = user?.email ?? "";
  const viewerUserId = user?.id ?? null;

  let gridEvents: CalendarEventRow[] = [];
  let creatorLookup = EMPTY_CREATOR_LOOKUP;
  let teamMemberRows: TeamMemberRow[] = [];

  const { rows: fetchedTeamMembers } = await fetchTeamMembers(supabase);
  teamMemberRows = fetchedTeamMembers;
  creatorLookup = buildCreatorLookupFromTeamMembers(teamMemberRows);

  try {
    const extended = await supabase
      .from("events")
      .select("id, title, start_time, end_time, user_name, calendar_scope, owner_user_id, completed_at")
      .order("start_time", { ascending: true, nullsFirst: false });

    let rows: Parameters<typeof normalizeCalendarEventRow>[0][] = [];

    if (extended.error && isLegacyCalendarEventsSchemaError(extended.error)) {
      const legacy = await supabase
        .from("events")
        .select("id, title, start_time, end_time, user_name")
        .order("start_time", { ascending: true, nullsFirst: false });
      if (legacy.error) {
        throw legacy.error;
      }
      rows = (legacy.data ?? []) as Parameters<typeof normalizeCalendarEventRow>[0][];
    } else if (extended.error) {
      throw extended.error;
    } else {
      rows = (extended.data ?? []) as Parameters<typeof normalizeCalendarEventRow>[0][];
    }

    gridEvents = rows.map((r) => normalizeCalendarEventRow(r));
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  return (
    <CalendarPageClient
      gridEvents={gridEvents}
      viewerEmail={viewerEmail}
      viewerUserId={viewerUserId}
      creatorLookup={creatorLookup}
      teamMembers={teamMemberRows}
      createEvent={createCalendarEvent}
    />
  );
}

export default function CalendarPage() {
  return (
    <AppMain>
      <Container className="flex min-h-0 flex-1 flex-col space-y-5 pb-[var(--app-page-scroll-pad)]">
        <Suspense fallback={<CalendarPageSkeleton />}>
          <CalendarPageContent />
        </Suspense>
      </Container>
    </AppMain>
  );
}
