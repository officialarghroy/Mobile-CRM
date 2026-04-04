"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { AddEventInline } from "@/components/calendar/AddEventInline";
import { CalendarGrid, type CalendarGridEvent } from "@/components/calendar/CalendarGrid";
import { DeleteCalendarEventButton } from "@/components/calendar/DeleteCalendarEventButton";
import { Button } from "@/components/ui/Button";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import { formatCalendarTimeRange, type CalendarEventRow } from "@/lib/calendarEventDisplay";

type ListEvent = {
  id: string;
  title: string;
  time: string;
  user: string;
  mine: boolean;
};

type CreateEventAction = (formData: FormData) => Promise<CalendarEventRow>;

type CalendarPageClientProps = {
  listEvents: ListEvent[];
  gridEvents: CalendarGridEvent[];
  viewerEmail: string;
  createEvent: CreateEventAction;
};

function viewFromSearchParams(searchParams: ReadonlyURLSearchParams): "list" | "calendar" {
  return searchParams.get("view") === "calendar" ? "calendar" : "list";
}

function rowToListEvent(row: CalendarGridEvent, viewerEmail: string): ListEvent {
  const mine = row.user_name === viewerEmail;
  return {
    id: row.id,
    title: row.title,
    time: formatCalendarTimeRange(row.start_time, row.end_time),
    user: mine ? "You" : (row.user_name ?? "Unknown"),
    mine,
  };
}

function mergeAndSortEvents(server: CalendarGridEvent[], staged: CalendarEventRow[]): CalendarGridEvent[] {
  const byId = new Map(server.map((e) => [e.id, e]));
  const out = [...server];
  for (const s of staged) {
    if (!byId.has(s.id)) out.push(s);
  }
  return out.sort((a, b) => {
    const ta = a.start_time ? Date.parse(a.start_time) : Number.MAX_SAFE_INTEGER;
    const tb = b.start_time ? Date.parse(b.start_time) : Number.MAX_SAFE_INTEGER;
    if (ta !== tb) return ta - tb;
    return a.title.localeCompare(b.title);
  });
}

export function CalendarPageClient({
  listEvents,
  gridEvents,
  viewerEmail,
  createEvent,
}: CalendarPageClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"list" | "calendar">(() => viewFromSearchParams(searchParams));
  const [newEventOpenedAt, setNewEventOpenedAt] = useState<number | null>(null);
  const [stagedEvents, setStagedEvents] = useState<CalendarEventRow[]>([]);

  useEffect(() => {
    const serverIds = new Set(gridEvents.map((e) => e.id));
    setStagedEvents((prev) => prev.filter((e) => !serverIds.has(e.id)));
  }, [gridEvents]);

  const displayGridEvents = useMemo(
    () => mergeAndSortEvents(gridEvents, stagedEvents),
    [gridEvents, stagedEvents],
  );

  const displayListEvents = useMemo(
    () => displayGridEvents.map((e) => rowToListEvent(e, viewerEmail)),
    [displayGridEvents, viewerEmail],
  );

  const handleEventCreated = useCallback((row: CalendarEventRow) => {
    setStagedEvents((prev) => (prev.some((e) => e.id === row.id) ? prev : [...prev, row]));
  }, []);

  const setCalendarView = useCallback(
    (next: "list" | "calendar") => {
      setView(next);
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (next === "calendar") {
        params.set("view", "calendar");
      } else {
        params.delete("view");
      }
      const q = params.toString();
      const path = pathname || window.location.pathname;
      window.history.replaceState(window.history.state, "", q ? `${path}?${q}` : path);
    },
    [pathname],
  );

  const activeSegment =
    "border border-transparent bg-[var(--accent-strong)] text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)]";
  const inactiveSegment =
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {newEventOpenedAt != null ? (
        <AddEventInline
          key={newEventOpenedAt}
          createEvent={createEvent}
          defaultDate={new Date(newEventOpenedAt)}
          onCreated={handleEventCreated}
          onClose={() => setNewEventOpenedAt(null)}
        />
      ) : null}

      <div className="isolate flex shrink-0 flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setCalendarView("list")}
          className={`inline-flex h-11 min-h-11 items-center rounded-full px-5 text-sm font-medium transition-colors ${
            view === "list" ? activeSegment : inactiveSegment
          }`}
        >
          Events
        </button>
        <button
          type="button"
          onClick={() => setCalendarView("calendar")}
          className={`inline-flex h-11 min-h-11 items-center rounded-full px-5 text-sm font-medium transition-colors ${
            view === "calendar" ? activeSegment : inactiveSegment
          }`}
        >
          Calendar
        </button>
      </div>

      <section
        className={`flex shrink-0 flex-col space-y-5 ${view !== "list" ? "hidden" : ""}`}
        aria-hidden={view !== "list"}
        aria-label="All events"
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="crm-section-label">All events</p>
          <Button type="button" className="shrink-0 px-4" onClick={() => setNewEventOpenedAt(Date.now())}>
            Add Event
          </Button>
        </div>
        {!displayListEvents.length ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
            No events
          </div>
        ) : (
          <SurfaceListShell className="transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
            {displayListEvents.map((event) => (
              <div
                key={event.id}
                className={`flex items-stretch gap-0 border-b border-[var(--border)] border-l-[3px] bg-[var(--surface)] last:border-b-0 ${
                  event.mine ? "border-l-[var(--accent-strong)]" : "border-l-[#94a3b8]"
                }`}
              >
                <div className="min-w-0 flex-1 px-4 py-4 pl-5">
                  <p className="text-card-title [overflow-wrap:anywhere]">{event.title}</p>
                  <p
                    className="crm-meta mt-1 min-w-0 truncate font-medium text-[var(--text-tertiary)]"
                    title={event.user}
                  >
                    {event.user}
                  </p>
                  <p className="text-card-meta mt-1">{event.time}</p>
                </div>
                <DeleteCalendarEventButton eventId={event.id} />
              </div>
            ))}
          </SurfaceListShell>
        )}
      </section>

      <div
        className={`min-h-0 min-w-0 flex-1 flex flex-col ${view !== "calendar" ? "hidden" : ""}`}
        aria-hidden={view !== "calendar"}
      >
        <CalendarGrid
          className="min-h-0 min-w-0 flex-1"
          events={displayGridEvents}
          viewerEmail={viewerEmail}
          onAddEvent={() => setNewEventOpenedAt(Date.now())}
        />
      </div>
    </div>
  );
}
