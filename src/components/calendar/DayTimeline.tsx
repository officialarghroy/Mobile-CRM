"use client";

import { DeleteCalendarEventButton } from "./DeleteCalendarEventButton";
import type { CalendarGridEvent } from "./calendarTypes";
import {
  TIMELINE_HOUR_HEIGHT_PX,
  TIMELINE_HOURS,
  eventsForLocalDay,
  formatHourLabel,
  placeEventsForDay,
} from "./dayTimelineUtils";

type DayTimelineProps = {
  className?: string;
  selectedDate: Date;
  events: CalendarGridEvent[];
  viewerEmail: string;
};

export function DayTimeline({ className = "", selectedDate, events, viewerEmail }: DayTimelineProps) {
  const dayEvents = eventsForLocalDay(events, selectedDate);
  const placed = placeEventsForDay(selectedDate, dayEvents);

  /** Fixed English abbreviations: `toLocaleDateString(undefined)` differs between Node and browser. */
  const weekdayShort = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][selectedDate.getDay()] ?? "—";
  const dayNum = selectedDate.getDate();

  const totalHeight = TIMELINE_HOURS * TIMELINE_HOUR_HEIGHT_PX;

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 gap-3 ${className}`.trim()}>
      <div className="flex w-11 shrink-0 flex-col items-center pt-1">
        <span className="crm-section-label text-center">{weekdayShort}</span>
        <span
          className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-strong)] text-lg font-semibold text-white"
          aria-hidden
        >
          {dayNum}
        </span>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          role="region"
          aria-label="Hourly schedule"
        >
          <div className="relative flex" style={{ minHeight: totalHeight }}>
            <div className="w-14 shrink-0 border-r border-[var(--border)] bg-[var(--surface-muted)]">
              {Array.from({ length: TIMELINE_HOURS }, (_, h) => (
                <div
                  key={h}
                  className="border-b border-[var(--border)] px-2 text-right crm-meta leading-none"
                  style={{ height: TIMELINE_HOUR_HEIGHT_PX, paddingTop: 2 }}
                >
                  {formatHourLabel(h)}
                </div>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              {Array.from({ length: TIMELINE_HOURS }, (_, h) => (
                <div
                  key={h}
                  className="border-b border-[var(--border)] bg-[var(--surface)]"
                  style={{ height: TIMELINE_HOUR_HEIGHT_PX }}
                />
              ))}

              {placed.map(({ event, topPx, heightPx }) => {
                const mine = event.user_name === viewerEmail;
                return (
                  <div
                    key={event.id}
                    className={`absolute left-1 right-1 overflow-hidden rounded-lg border px-1.5 py-1 text-left shadow-sm ${
                      mine
                        ? "border-[var(--accent-strong)]/30 bg-[var(--accent-muted)] text-[var(--accent-strong)]"
                        : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)]"
                    }`}
                    style={{
                      top: topPx,
                      height: heightPx,
                      minHeight: 28,
                    }}
                    title={event.title}
                  >
                    <div className="flex min-h-0 items-start gap-1">
                      <p className="min-w-0 flex-1 text-xs font-semibold leading-tight line-clamp-2">{event.title}</p>
                      <DeleteCalendarEventButton eventId={event.id} layout="icon" />
                    </div>
                  </div>
                );
              })}

              {placed.length === 0 ? (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
                  aria-hidden
                >
                  <p className="text-center text-sm text-[var(--text-secondary)]">No timed events this day</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
