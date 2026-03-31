import { revalidatePath } from "next/cache";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { AddEventInline } from "@/components/calendar/AddEventInline";
import { getCurrentUser } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";

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

  let personalEvents: PersonalEvent[] = [];
  let teamEvents: TeamEvent[] = [];

  try {
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
    <main className="flex min-h-dvh w-full items-start py-6">
      <Container className="space-y-6 pb-24">
        <header className="pt-2">
          <AddEventInline createEvent={createEvent} />
        </header>

        <section className="mt-8" aria-label="Personal events">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-[var(--text-secondary)]">Personal</h2>
          {!personalEvents.length ? (
            <p className="py-6 text-center text-sm text-[var(--text-secondary)]">No personal events</p>
          ) : null}
          <div className="space-y-4">
            {personalEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                className="block w-full text-left transition-transform duration-150 active:scale-[0.98]"
              >
                <Card className="rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[1.06rem] font-semibold leading-tight text-[var(--text-primary)]">
                        {event.title}
                      </p>
                      <p className="mt-1 text-sm leading-[1.45] text-[var(--text-secondary)]/92">{event.time}</p>
                    </div>
                    <p className="shrink-0 pt-0.5 text-right text-xs text-[var(--text-secondary)]/62">{event.user}</p>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-8 h-px bg-[color:rgba(255,255,255,0.05)]" />

        <section className="mt-8" aria-label="Team events">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-[var(--text-secondary)]">Team</h2>
          {!teamEvents.length ? <p className="py-6 text-center text-sm text-[var(--text-secondary)]">No team events</p> : null}
          <div className="space-y-4">
            {teamEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                className="block w-full text-left transition-transform duration-150 active:scale-[0.98]"
              >
                <Card className="rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[1.06rem] font-semibold leading-tight text-[var(--text-primary)]">
                        {event.title}
                      </p>
                      <p className="mt-1 text-sm leading-[1.45] text-[var(--text-secondary)]/92">{event.time}</p>
                    </div>
                    <p className="shrink-0 pt-0.5 text-right text-xs text-[var(--text-secondary)]/62">{event.user}</p>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
