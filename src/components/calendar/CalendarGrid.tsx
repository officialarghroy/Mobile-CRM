"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { DayTimeline } from "@/components/calendar/DayTimeline";
import { DeleteCalendarEventButton } from "./DeleteCalendarEventButton";
import type { CalendarGridEvent } from "@/components/calendar/calendarTypes";
import { parseEventStart } from "@/components/calendar/dayTimelineUtils";
import type { CreatorLookup } from "@/lib/calendarCreatorLabel";
import { formatEventCreatorLabel } from "@/lib/calendarCreatorLabel";
import {
  addGregorianMonths,
  currentPstYearMonth,
  daysInGregorianMonth,
  formatPstMonthYear,
  pstDateKeyFromInstant,
  pstWeekdayIndexSunday0,
  startOfPSTCalendarDayUtc,
} from "@/lib/timezone";
import { Button } from "@/components/ui/Button";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";

export type { CalendarGridEvent } from "@/components/calendar/calendarTypes";

type CalendarGridProps = {
  className?: string;
  events: CalendarGridEvent[];
  viewerEmail: string;
  viewerUserId: string | null;
  creatorLookup: CreatorLookup;
  onAddEvent?: () => void;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dayKeysWithTimedEvents(events: CalendarGridEvent[]): Set<string> {
  const s = new Set<string>();
  for (const e of events) {
    const start = parseEventStart(e.start_time);
    if (!start) continue;
    s.add(pstDateKeyFromInstant(start));
  }
  return s;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarGrid({
  className = "",
  events,
  viewerEmail,
  viewerUserId,
  creatorLookup,
  onAddEvent,
}: CalendarGridProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => currentPstYearMonth());
  const [selectedPstKey, setSelectedPstKey] = useState(() => pstDateKeyFromInstant(new Date()));
  const [todayPstKey, setTodayPstKey] = useState(() => pstDateKeyFromInstant(new Date()));

  const goPrevMonth = useCallback(() => {
    setVisibleMonth((vm) => {
      const next = addGregorianMonths(vm.year, vm.monthIndex, -1);
      setSelectedPstKey((prevKey) => {
        const [sy, sm, sd] = prevKey.split("-").map(Number);
        const inCurrentVm = sy === vm.year && sm - 1 === vm.monthIndex;
        let d = inCurrentVm ? sd : 1;
        const dim = daysInGregorianMonth(next.year, next.monthIndex);
        d = Math.min(d, dim);
        return `${next.year}-${pad2(next.monthIndex + 1)}-${pad2(d)}`;
      });
      return next;
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setVisibleMonth((vm) => {
      const next = addGregorianMonths(vm.year, vm.monthIndex, 1);
      setSelectedPstKey((prevKey) => {
        const [sy, sm, sd] = prevKey.split("-").map(Number);
        const inCurrentVm = sy === vm.year && sm - 1 === vm.monthIndex;
        let d = inCurrentVm ? sd : 1;
        const dim = daysInGregorianMonth(next.year, next.monthIndex);
        d = Math.min(d, dim);
        return `${next.year}-${pad2(next.monthIndex + 1)}-${pad2(d)}`;
      });
      return next;
    });
  }, []);

  const goToday = useCallback(() => {
    setVisibleMonth(currentPstYearMonth());
    setSelectedPstKey(pstDateKeyFromInstant(new Date()));
  }, []);

  const { weeks, unscheduled } = useMemo(() => {
    const { year, monthIndex } = visibleMonth;
    const daysInMonth = daysInGregorianMonth(year, monthIndex);
    const firstKey = `${year}-${pad2(monthIndex + 1)}-01`;
    const firstInstant = startOfPSTCalendarDayUtc(firstKey);
    const startPad = pstWeekdayIndexSunday0(firstInstant);

    const cells: (string | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${pad2(monthIndex + 1)}-${pad2(d)}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const w: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      w.push(cells.slice(i, i + 7));
    }

    const unsched = events.filter((e) => !e.start_time?.trim());

    return { weeks: w, unscheduled: unsched };
  }, [visibleMonth, events]);

  const timedDayKeys = useMemo(() => dayKeysWithTimedEvents(events), [events]);

  const monthTitle = formatPstMonthYear(visibleMonth.year, visibleMonth.monthIndex);

  useEffect(() => {
    const syncToday = () => {
      setTodayPstKey(pstDateKeyFromInstant(new Date()));
    };
    const intervalId = window.setInterval(syncToday, 60_000);
    document.addEventListener("visibilitychange", syncToday);
    window.addEventListener("focus", syncToday);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", syncToday);
      window.removeEventListener("focus", syncToday);
    };
  }, []);

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col gap-5 ${className}`.trim()}>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrevMonth}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
          aria-label="Previous month"
        >
          <RiArrowLeftSLine className="h-6 w-6" aria-hidden />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-lg font-semibold text-[var(--text-primary)]">{monthTitle}</p>
        </div>

        <button
          type="button"
          onClick={goNextMonth}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
          aria-label="Next month"
        >
          <RiArrowRightSLine className="h-6 w-6" aria-hidden />
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="ghost" className="shrink-0 px-4" onClick={goToday}>
          Today
        </Button>
        {onAddEvent ? (
          <Button type="button" className="shrink-0 px-4" onClick={onAddEvent}>
            Add Event
          </Button>
        ) : null}
      </div>

      <SurfaceListShell className="shrink-0 transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-muted)] py-1">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-1 text-center text-[0.6rem] font-semibold tabular-nums tracking-tight text-[var(--text-secondary)] sm:text-[0.65rem]">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((row, wi) => (
          <div key={wi} className="grid grid-cols-7 items-stretch border-b border-[var(--border)] last:border-b-0">
            {row.map((pstKey, di) => {
              if (!pstKey) {
                return <div key={`empty-${wi}-${di}`} className="min-h-0 bg-[var(--bg)]/40" aria-hidden />;
              }
              const isToday = pstKey === todayPstKey;
              const isSelected = pstKey === selectedPstKey;
              const hasTimedEvent = timedDayKeys.has(pstKey);
              const dayNum = Number(pstKey.split("-")[2]) || 0;

              return (
                <div key={pstKey} className="flex min-h-0 border-r border-[var(--border)] last:border-r-0">
                  <button
                    type="button"
                    onClick={() => setSelectedPstKey(pstKey)}
                    className={`flex min-h-[2.75rem] w-full flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors hover:bg-[var(--surface-muted)] ${
                      isToday && !isSelected ? "bg-[var(--accent-muted)]/50" : ""
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                        isSelected
                          ? "bg-[var(--accent-strong)] text-white"
                          : isToday
                            ? "text-[var(--accent-strong)]"
                            : "text-[var(--text-primary)]"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <span
                      className={`h-1 w-1 shrink-0 rounded-full ${
                        isToday
                          ? "bg-[var(--success)]"
                          : hasTimedEvent
                            ? "bg-[var(--text-tertiary)]/70"
                            : "bg-transparent"
                      }`}
                      aria-hidden
                    />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </SurfaceListShell>

      <div
        className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col"
        aria-label="Day schedule"
      >
        <DayTimeline
          selectedPstDateKey={selectedPstKey}
          events={events}
          viewerEmail={viewerEmail}
          viewerUserId={viewerUserId}
          creatorLookup={creatorLookup}
        />
      </div>

      {unscheduled.length > 0 ? (
        <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 shadow-[var(--shadow-card)]">
          <p className="crm-section-label mb-2">No start time</p>
          <ul className="flex flex-col gap-2 text-sm text-[var(--text-primary)]">
            {unscheduled.map((ev) => (
              <li key={ev.id} className="flex min-w-0 items-start gap-2 border-b border-[var(--border)] pb-2 last:border-b-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium [overflow-wrap:anywhere] text-[var(--text-primary)]">{ev.title}</p>
                  <p className="mt-1 text-[0.7rem] font-medium text-red-600 dark:text-red-400">
                    Added by {formatEventCreatorLabel(ev, viewerEmail, viewerUserId, creatorLookup)}
                  </p>
                </div>
                <DeleteCalendarEventButton
                  eventId={ev.id}
                  eventTitle={ev.title}
                  layout="icon"
                  calendarScope={ev.calendar_scope}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

    </div>
  );
}
