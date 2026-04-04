import { Suspense } from "react";
import { AppMain } from "@/components/layout/AppMain";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { CalendarPageSkeleton } from "@/components/calendar/CalendarPageSkeleton";
import { Container } from "@/components/ui/Container";
import { formatCalendarTimeRange, type CalendarEventRow } from "@/lib/calendarEventDisplay";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createCalendarEvent } from "./actions";

export const dynamic = "force-dynamic";

type ListEvent = {
  id: string;
  title: string;
  time: string;
  user: string;
  mine: boolean;
};

async function CalendarPageContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerEmail = user?.email ?? "";

  let listEvents: ListEvent[] = [];
  let gridEvents: CalendarEventRow[] = [];

  try {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, start_time, end_time, user_name")
      .order("start_time", { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    const events = (data as CalendarEventRow[]) ?? [];
    gridEvents = events;

    listEvents = events.map((event) => {
      const mine = event.user_name === viewerEmail;
      return {
        id: event.id,
        title: event.title,
        time: formatCalendarTimeRange(event.start_time, event.end_time),
        user: mine ? "You" : (event.user_name ?? "Unknown"),
        mine,
      };
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  return (
    <CalendarPageClient
      listEvents={listEvents}
      gridEvents={gridEvents}
      viewerEmail={viewerEmail}
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
