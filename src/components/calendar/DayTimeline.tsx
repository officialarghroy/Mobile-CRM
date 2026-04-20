"use client";

import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import type { CreatorLookup } from "@/lib/calendarCreatorLabel";
import { formatEventAddedByLabel, formatEventAssigneeLabel } from "@/lib/calendarCreatorLabel";
import { calendarScopeLabel, isCalendarEventMine } from "@/lib/calendarEventDisplay";
import { pstWeekdayIndexSunday0, startOfPSTCalendarDayUtc } from "@/lib/timezone";
import { DeleteCalendarEventButton } from "./DeleteCalendarEventButton";
import type { CalendarGridEvent } from "./calendarTypes";
import {
  TIMELINE_HOUR_HEIGHT_PX,
  TIMELINE_HOURS,
  eventsForPstDay,
  formatHourLabel,
  placeEventsForPstDay,
} from "./dayTimelineUtils";

const WEEKDAY_SUN0 = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

type DayTimelineProps = {
  className?: string;
  /** PST calendar date YYYY-MM-DD (America/Los_Angeles). */
  selectedPstDateKey: string;
  events: CalendarGridEvent[];
  viewerEmail: string;
  viewerUserId: string | null;
  creatorLookup: CreatorLookup;
};

function eventBlockClasses(event: CalendarGridEvent, viewerEmail: string, viewerUserId: string | null): string {
  const done = Boolean(event.completed_at?.trim());
  const opacity = done ? " opacity-[0.72]" : "";
  const mine = isCalendarEventMine(event, viewerEmail, viewerUserId);
  if (event.calendar_scope === "personal") {
    return `border-violet-500/40 bg-violet-500/10 text-violet-900 dark:text-violet-100${opacity}`;
  }
  if (mine) {
    return `border-[var(--accent-strong)]/30 bg-[var(--accent-muted)] text-[var(--accent-strong)]${opacity}`;
  }
  return `border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)]${opacity}`;
}

export function DayTimeline({
  className = "",
  selectedPstDateKey,
  events,
  viewerEmail,
  viewerUserId,
  creatorLookup,
}: DayTimelineProps) {
  const dayEvents = eventsForPstDay(events, selectedPstDateKey);
  const placed = placeEventsForPstDay(selectedPstDateKey, dayEvents);

  const start = startOfPSTCalendarDayUtc(selectedPstDateKey);
  const weekdayShort = WEEKDAY_SUN0[pstWeekdayIndexSunday0(start)] ?? "—";
  const dayNum = Number(selectedPstDateKey.split("-")[2]) || 0;

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

      <SurfaceListShell className="flex min-h-0 min-w-0 flex-1 flex-col" innerClassName="flex min-h-0 min-w-0 flex-1 flex-col">
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
                const addedBy = formatEventAddedByLabel(event, viewerEmail, viewerUserId, creatorLookup);
                const assignedTo = formatEventAssigneeLabel(event, viewerUserId, creatorLookup);
                const titleTip = `${event.title} · ${calendarScopeLabel(event.calendar_scope)} · Added by ${addedBy} · Assigned to ${assignedTo}`;
                const fullDetail = heightPx >= 62;
                const showMeta = heightPx >= 28;
                const padClass = fullDetail ? "px-1.5 py-1.5" : showMeta ? "px-1 py-1" : "px-1 py-0.5";
                const titleClampClass = fullDetail ? "line-clamp-2" : "line-clamp-1";

                return (
                  <div
                    key={event.id}
                    className={`absolute left-1 right-1 rounded-lg border text-left shadow-sm ${eventBlockClasses(event, viewerEmail, viewerUserId)}`}
                    style={{
                      top: topPx,
                      height: heightPx,
                    }}
                    title={titleTip}
                  >
                    <div
                      className={`flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden rounded-[calc(0.5rem-1px)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${padClass}`}
                    >
                      <div className="flex min-h-0 flex-1 items-start gap-1">
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold leading-tight [overflow-wrap:anywhere] ${titleClampClass} ${
                              event.completed_at?.trim()
                                ? "line-through decoration-[var(--text-secondary)] opacity-90"
                                : ""
                            }`}
                          >
                            {event.title}
                          </p>
                          {fullDetail ? (
                            <>
                              <p className="mt-1 text-[0.65rem] font-medium leading-snug text-red-600 [overflow-wrap:anywhere] dark:text-red-400">
                                Added by {addedBy}
                              </p>
                              <p className="mt-0.5 text-[0.65rem] font-medium leading-snug text-[var(--text-secondary)] [overflow-wrap:anywhere]">
                                Assigned to {assignedTo}
                              </p>
                            </>
                          ) : showMeta ? (
                            <p className="mt-0.5 truncate text-[0.58rem] font-medium leading-tight text-[var(--text-secondary)]">
                              <span className="text-red-600 dark:text-red-400">Added by {addedBy}</span>
                              <span className="text-[var(--text-tertiary)]" aria-hidden>
                                {" "}
                                ·{" "}
                              </span>
                              <span>Assigned to {assignedTo}</span>
                            </p>
                          ) : null}
                        </div>
                        <DeleteCalendarEventButton
                          eventId={event.id}
                          eventTitle={event.title}
                          layout="icon"
                          calendarScope={event.calendar_scope}
                        />
                      </div>
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
      </SurfaceListShell>
    </div>
  );
}
