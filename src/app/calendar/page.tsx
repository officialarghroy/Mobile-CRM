import { revalidatePath } from "next/cache";
import { Container } from "@/components/ui/Container";
import { AddEventInline } from "@/components/calendar/AddEventInline";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/currentUser";
import { createSupabaseServerClient } from "@/lib/supabase";

type EventRow = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  user_name: string | null;
};

type PersonalEvent = {
  id: string;
  title: string;
  time: string;
  user: string;
};

type TeamEvent = {
  id: string;
  title: string;
  time: string;
  user: string;
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
  const currentUser = await getCurrentUser();

  const createEvent = async (formData: FormData) => {
    "use server";

    const supabase = await createSupabaseServerClient();
    const title = String(formData.get("title") ?? "").trim();
    const startTime = String(formData.get("start_time") ?? "").trim();
    const endTime = String(formData.get("end_time") ?? "").trim();

    if (!title) return;

    try {
      const { error } = await supabase.from("events").insert({
        title,
        start_time: startTime || null,
        end_time: endTime || null,
        user_name: currentUser,
      });

      if (error) {
        throw error;
      }

      revalidatePath("/calendar");
    } catch (error) {
      console.error("Failed to create event:", error);
      throw error;
    }
  };

  const deleteEvent = async (eventId: string, _formData: FormData) => {
    "use server";

    if (!eventId) return;

    const supabase = await createSupabaseServerClient();

    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);

      if (error) {
        throw error;
      }

      revalidatePath("/calendar");
    } catch (error) {
      console.error("Failed to delete event:", error);
      throw error;
    }
  };

  let personalEvents: PersonalEvent[] = [];
  let teamEvents: TeamEvent[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, start_time, end_time, user_name")
      .order("start_time", { ascending: true });

    if (error) {
      throw error;
    }

    const events = (data as EventRow[]) ?? [];

    personalEvents = events
      .filter((event) => event.user_name === currentUser)
      .map((event) => ({
        id: event.id,
        title: event.title,
        time: formatTimeRange(event.start_time, event.end_time),
        user: "You",
      }));

    teamEvents = events
      .filter((event) => event.user_name !== currentUser)
      .map((event) => ({
        id: event.id,
        title: event.title,
        time: formatTimeRange(event.start_time, event.end_time),
        user: event.user_name ?? "Unknown",
      }));
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  return (
    <main className="flex min-h-dvh w-full items-start py-5">
      <Container className="space-y-6 pb-24">
        <header className="pt-1">
          <AddEventInline createEvent={createEvent} />
        </header>

        <section className="mt-6" aria-label="Personal events">
          <h2 className="crm-section-label mb-3">Personal</h2>
          {!personalEvents.length ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-[0.8125rem] text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
              No personal events
            </div>
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
              {personalEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-stretch gap-0 border-b border-[var(--border)] border-l-[3px] border-l-[var(--accent-strong)] bg-[var(--surface)] last:border-b-0"
                >
                  <div className="min-w-0 flex-1 px-3 py-3.5 pl-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-card-title truncate">{event.title}</p>
                        <p className="text-card-meta mt-1">{event.time}</p>
                      </div>
                      <p className="shrink-0 pt-0.5 text-right text-[0.75rem] font-medium text-[var(--text-tertiary)]">
                        {event.user}
                      </p>
                    </div>
                  </div>
                  <form action={deleteEvent.bind(null, event.id)} className="flex shrink-0 items-center border-l border-[var(--border)] px-2">
                    <Button type="submit" variant="ghost" className="h-9 min-h-9 px-3 text-[0.8125rem] text-[var(--text-secondary)]">
                      Delete
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 h-px bg-[var(--border)]" />

        <section className="mt-8" aria-label="Team events">
          <h2 className="crm-section-label mb-3">Team</h2>
          {!teamEvents.length ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-[0.8125rem] text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
              No team events
            </div>
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
              {teamEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-stretch gap-0 border-b border-[var(--border)] border-l-[3px] border-l-[#94a3b8] bg-[var(--surface)] last:border-b-0"
                >
                  <div className="min-w-0 flex-1 px-3 py-3.5 pl-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-card-title truncate">{event.title}</p>
                        <p className="text-card-meta mt-1">{event.time}</p>
                      </div>
                      <p className="shrink-0 pt-0.5 text-right text-[0.75rem] font-medium text-[var(--text-tertiary)]">
                        {event.user}
                      </p>
                    </div>
                  </div>
                  <form action={deleteEvent.bind(null, event.id)} className="flex shrink-0 items-center border-l border-[var(--border)] px-2">
                    <Button type="submit" variant="ghost" className="h-9 min-h-9 px-3 text-[0.8125rem] text-[var(--text-secondary)]">
                      Delete
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
