import { Container } from "@/components/ui/Container";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createCalendarEvent, deleteCalendarEvent } from "./actions";

type EventRow = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  user_name: string | null;
};

type ListEvent = {
  id: string;
  title: string;
  time: string;
  user: string;
  mine: boolean;
};

function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime && !endTime) return "Time not set";
  const start = startTime
    ? new Date(startTime).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "TBD";
  const end = endTime
    ? new Date(endTime).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "TBD";
  return `${start} - ${end}`;
}

export default async function CalendarPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerEmail = user?.email ?? "";

  let listEvents: ListEvent[] = [];
  let gridEvents: EventRow[] = [];

  try {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, start_time, end_time, user_name")
      .order("start_time", { ascending: true });

    if (error) {
      throw error;
    }

    const events = (data as EventRow[]) ?? [];
    gridEvents = events;

    listEvents = events.map((event) => {
      const mine = event.user_name === viewerEmail;
      return {
        id: event.id,
        title: event.title,
        time: formatTimeRange(event.start_time, event.end_time),
        user: mine ? "You" : (event.user_name ?? "Unknown"),
        mine,
      };
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  return (
    <main className="flex min-h-dvh w-full flex-col overflow-x-hidden py-5">
      <Container className="flex min-h-0 flex-1 flex-col space-y-5 pb-24">
        <CalendarPageClient
          listEvents={listEvents}
          gridEvents={gridEvents}
          viewerEmail={viewerEmail}
          createEvent={createCalendarEvent}
          deleteEvent={deleteCalendarEvent}
        />
      </Container>
    </main>
  );
}
