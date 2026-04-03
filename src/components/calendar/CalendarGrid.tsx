"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { DayTimeline } from "@/components/calendar/DayTimeline";
import { MonthChipScroller } from "@/components/calendar/MonthChipScroller";
import type { CalendarGridEvent } from "@/components/calendar/calendarTypes";
import { dayKey } from "@/components/calendar/dayTimelineUtils";
import { Button } from "@/components/ui/Button";

export type { CalendarGridEvent } from "@/components/calendar/calendarTypes";

type CalendarGridProps = {
  className?: string;
  events: CalendarGridEvent[];
  viewerEmail: string;
  onAddEvent?: () => void;
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clampDayInMonth(year: number, month: number, preferredDay: number): Date {
  const last = new Date(year, month + 1, 0).getDate();
  const d = Math.min(preferredDay, last);
  return new Date(year, month, d);
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarGrid({ className = "", events, viewerEmail, onAddEvent }: CalendarGridProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  });
  const applyVisibleMonth = useCallback((nextMonthStart: Date) => {
    const next = startOfMonth(nextMonthStart);
    setVisibleMonth(next);
    setSelectedDate((sel) => clampDayInMonth(next.getFullYear(), next.getMonth(), sel.getDate()));
  }, []);

  const goPrevMonth = useCallback(() => {
    applyVisibleMonth(addMonths(visibleMonth, -1));
  }, [applyVisibleMonth, visibleMonth]);

  const goNextMonth = useCallback(() => {
    applyVisibleMonth(addMonths(visibleMonth, 1));
  }, [applyVisibleMonth, visibleMonth]);

  const goToday = useCallback(() => {
    const t = new Date();
    const start = startOfMonth(t);
    setVisibleMonth(start);
    setSelectedDate(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
  }, []);

  const onSelectChipMonth = useCallback(
    (monthIndex: number) => {
      applyVisibleMonth(new Date(visibleMonth.getFullYear(), monthIndex, 1));
    },
    [applyVisibleMonth, visibleMonth],
  );

  const { weeks, unscheduled } = useMemo(() => {
    const first = startOfMonth(visibleMonth);
    const startPad = first.getDay();
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(first.getFullYear(), first.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    while (cells.length < 42) cells.push(null);

    const w: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      w.push(cells.slice(i, i + 7));
    }

    const unsched = events.filter((e) => !e.start_time?.trim());

    return { weeks: w, unscheduled: unsched };
  }, [visibleMonth, events]);

  const monthTitle = visibleMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

  const [today, setToday] = useState(() => startOfLocalDay(new Date()));

  useEffect(() => {
    const syncToday = () => {
      const next = startOfLocalDay(new Date());
      setToday((prev) => (sameLocalDay(prev, next) ? prev : next));
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

      <div className="shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-muted)] py-1">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-1 text-center text-[0.6rem] font-semibold tabular-nums tracking-tight text-[var(--text-secondary)] sm:text-[0.65rem]">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((row, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-[var(--border)] last:border-b-0">
            {row.map((day, di) => {
              if (!day) {
                return <div key={`empty-${wi}-${di}`} className="min-h-[3rem] bg-[var(--bg)]/40" />;
              }
              const key = dayKey(day);
              const isToday = sameLocalDay(day, today);
              const isSelected = sameLocalDay(day, selectedDate);

              return (
                <div key={key} className="border-r border-[var(--border)] last:border-r-0">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(new Date(day.getFullYear(), day.getMonth(), day.getDate()))}
                    className={`flex w-full flex-col items-center gap-0.5 py-2 transition-colors hover:bg-[var(--surface-muted)] ${
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
                      {day.getDate()}
                    </span>
                    <span
                      className={`h-1 w-1 shrink-0 rounded-full ${isToday ? "bg-[var(--success)]" : "bg-transparent"}`}
                      aria-hidden
                    />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="shrink-0">
        <MonthChipScroller
          year={visibleMonth.getFullYear()}
          activeMonthIndex={visibleMonth.getMonth()}
          onSelectMonth={onSelectChipMonth}
        />
      </div>

      <div
        className="relative left-1/2 flex min-h-0 min-w-0 w-[100dvw] max-w-[100vw] flex-1 -translate-x-1/2 flex-col pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]"
        aria-label="Day schedule"
      >
        <DayTimeline selectedDate={selectedDate} events={events} viewerEmail={viewerEmail} />
      </div>

      {unscheduled.length > 0 ? (
        <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 shadow-[var(--shadow-card)]">
          <p className="crm-section-label mb-2">No start time</p>
          <ul className="flex flex-col gap-2 text-sm text-[var(--text-primary)]">
            {unscheduled.map((ev) => (
              <li key={ev.id} className="truncate">
                {ev.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

    </div>
  );
}
