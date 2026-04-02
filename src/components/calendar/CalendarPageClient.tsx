"use client";

import { useState } from "react";
import { AddEventInline } from "@/components/calendar/AddEventInline";
import { Button } from "@/components/ui/Button";
import { CalendarGrid, type CalendarGridEvent } from "@/components/calendar/CalendarGrid";

type ListEvent = {
  id: string;
  title: string;
  time: string;
  user: string;
  mine: boolean;
};

type CreateEventAction = (formData: FormData) => Promise<void>;
type DeleteEventAction = (eventId: string, formData: FormData) => Promise<void>;

type CalendarPageClientProps = {
  listEvents: ListEvent[];
  gridEvents: CalendarGridEvent[];
  viewerEmail: string;
  createEvent: CreateEventAction;
  deleteEvent: DeleteEventAction;
};

export function CalendarPageClient({
  listEvents,
  gridEvents,
  viewerEmail,
  createEvent,
  deleteEvent,
}: CalendarPageClientProps) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [newEventOpenedAt, setNewEventOpenedAt] = useState<number | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {newEventOpenedAt != null ? (
        <AddEventInline
          key={newEventOpenedAt}
          createEvent={createEvent}
          defaultDate={new Date(newEventOpenedAt)}
          onClose={() => setNewEventOpenedAt(null)}
        />
      ) : null}

      <div className="flex shrink-0 flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`inline-flex h-11 min-h-11 items-center rounded-full px-5 text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-[var(--accent-strong)] text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)]"
              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          Events
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`inline-flex h-11 min-h-11 items-center rounded-full px-5 text-sm font-medium transition-colors ${
            view === "calendar"
              ? "bg-[var(--accent-strong)] text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)]"
              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          Calendar
        </button>
      </div>

      {view === "list" ? (
        <>
          <section className="flex shrink-0 flex-col space-y-5" aria-label="All events">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="crm-section-label">All events</p>
              <Button
                type="button"
                className="shrink-0 px-4"
                onClick={() => setNewEventOpenedAt(Date.now())}
              >
                Add Event
              </Button>
            </div>
            {!listEvents.length ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
                No events
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
                {listEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-stretch gap-0 border-b border-[var(--border)] border-l-[3px] bg-[var(--surface)] last:border-b-0 ${
                      event.mine ? "border-l-[var(--accent-strong)]" : "border-l-[#94a3b8]"
                    }`}
                  >
                    <div className="min-w-0 flex-1 px-4 py-4 pl-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-card-title truncate">{event.title}</p>
                          <p className="text-card-meta mt-1">{event.time}</p>
                        </div>
                        <p className="crm-meta shrink-0 pt-0.5 text-right font-medium text-[var(--text-tertiary)]">
                          {event.user}
                        </p>
                      </div>
                    </div>
                    <form action={deleteEvent.bind(null, event.id)} className="flex shrink-0 items-center border-l border-[var(--border)] px-2">
                      <Button type="submit" variant="ghost" className="h-9 min-h-9 rounded-full px-3 text-sm text-[var(--text-secondary)]">
                        Delete
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <CalendarGrid
          className="min-h-0 min-w-0 flex-1"
          events={gridEvents}
          viewerEmail={viewerEmail}
          onAddEvent={() => setNewEventOpenedAt(Date.now())}
        />
      )}
    </div>
  );
}
