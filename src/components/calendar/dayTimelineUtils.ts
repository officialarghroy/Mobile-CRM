import type { CalendarGridEvent } from "./calendarTypes";
import {
  endOfPSTCalendarDayUtc,
  pstDateKeyFromInstant,
  startOfPSTCalendarDayUtc,
} from "@/lib/timezone";

export const TIMELINE_HOUR_HEIGHT_PX = 48;
export const TIMELINE_HOURS = 24;

/** Minimum height only for very short durations so blocks stay tappable (does not inflate longer events). */
const MIN_EVENT_BLOCK_HEIGHT_PX = 44;

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

/** Events whose start_time falls on this PST calendar day (YYYY-MM-DD in America/Los_Angeles). */
export function eventsForPstDay(events: CalendarGridEvent[], pstDateKey: string): CalendarGridEvent[] {
  return events.filter((e) => {
    const start = parseEventStart(e.start_time);
    if (!start) return false;
    return pstDateKeyFromInstant(start) === pstDateKey;
  });
}

export type PlacedEvent = {
  event: CalendarGridEvent;
  topPx: number;
  heightPx: number;
  clippedStart: Date;
  clippedEnd: Date;
};

export function placeEventsForPstDay(pstDateKey: string, events: CalendarGridEvent[]): PlacedEvent[] {
  const dayStart = startOfPSTCalendarDayUtc(pstDateKey);
  const dayEnd = endOfPSTCalendarDayUtc(pstDateKey);
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

    const startMin = (clipStart.getTime() - dayStart.getTime()) / 60000;
    const endMin = (clipEnd.getTime() - dayStart.getTime()) / 60000;
    const durMin = endMin - startMin;

    let topPx = startMin * minutePx;
    const rawHeightPx = durMin * minutePx;
    topPx = Math.max(0, Math.min(topPx, totalMinutes * minutePx));
    const maxHeightPx = totalMinutes * minutePx - topPx;
    const heightPx = Math.min(Math.max(MIN_EVENT_BLOCK_HEIGHT_PX, rawHeightPx), maxHeightPx);

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
 * Stable across SSR and the browser. Hour labels are wall-clock hours in PST for the selected day
 * (0 = midnight America/Los_Angeles through 23).
 */
export function formatHourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${h12} ${suffix}`;
}
