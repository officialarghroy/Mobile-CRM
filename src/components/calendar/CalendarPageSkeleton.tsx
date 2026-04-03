/** Placeholder while calendar data streams in (matches CalendarPageClient chrome). */
export function CalendarPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5" aria-busy="true" aria-label="Loading calendar">
      <div className="isolate flex shrink-0 flex-wrap gap-3">
        <div className="h-11 w-[6.25rem] animate-pulse rounded-full bg-[var(--surface-muted)]" />
        <div className="h-11 w-[6.25rem] animate-pulse rounded-full bg-[var(--surface-muted)]" />
      </div>
      <div className="min-h-[14rem] flex-1 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
    </div>
  );
}
