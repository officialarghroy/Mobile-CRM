import type { CalendarGridEvent } from "./calendarTypes";

export const TIMELINE_HOUR_HEIGHT_PX = 48;
export const TIMELINE_HOURS = 24;

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function parseEventStart(iso: string | null): Date | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseEventEnd(iso: string | null, start: Date): Date {
  if (iso?.trim()) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime()) && d.getTime() > start.getTime()) return d;
  }
  return new Date(start.getTime() + 60 * 60 * 1000);
}

/** Events whose start_time falls on this local calendar day. */
export function eventsForLocalDay(events: CalendarGridEvent[], day: Date): CalendarGridEvent[] {
  const key = dayKey(day);
  return events.filter((e) => {
    const start = parseEventStart(e.start_time);
    if (!start) return false;
    return dayKey(start) === key;
  });
}

export type PlacedEvent = {
  event: CalendarGridEvent;
  topPx: number;
  heightPx: number;
  clippedStart: Date;
  clippedEnd: Date;
};

export function placeEventsForDay(
  day: Date,
  events: CalendarGridEvent[],
): PlacedEvent[] {
  const dayStart = startOfLocalDay(day);
  const dayEnd = endOfLocalDay(day);
  const minutePx = TIMELINE_HOUR_HEIGHT_PX / 60;
  const totalMinutes = TIMELINE_HOURS * 60;

  const placed: PlacedEvent[] = [];

  for (const event of events) {
    const start = parseEventStart(event.start_time);
    if (!start) continue;

    const rawEnd = parseEventEnd(event.end_time, start);
    const clipStart = start < dayStart ? dayStart : start;
    const clipEnd = rawEnd > dayEnd ? dayEnd : rawEnd;
    if (clipEnd <= clipStart) continue;

    const startMin =
      (clipStart.getTime() - dayStart.getTime()) / 60000;
    const endMin = (clipEnd.getTime() - dayStart.getTime()) / 60000;
    const durMin = endMin - startMin;

    let topPx = startMin * minutePx;
    let heightPx = durMin * minutePx;
    topPx = Math.max(0, Math.min(topPx, totalMinutes * minutePx));
    heightPx = Math.max(44, Math.min(heightPx, totalMinutes * minutePx - topPx));

    placed.push({
      event,
      topPx,
      heightPx,
      clippedStart: clipStart,
      clippedEnd: clipEnd,
    });
  }

  placed.sort((a, b) => a.topPx - b.topPx);
  return placed;
}

/**
 * Stable across SSR and the browser. Do not use `toLocaleTimeString(undefined)` here:
 * Node and the client often disagree (e.g. "12 AM" vs "00") and cause hydration errors.
 */
export function formatHourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${h12} ${suffix}`;
}
