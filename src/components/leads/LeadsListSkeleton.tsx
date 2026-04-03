/** Placeholder while leads data streams in (matches LeadsListSection layout). */
export function LeadsListSkeleton() {
  return (
    <section className="flex flex-col space-y-4" aria-label="Loading leads" aria-busy="true">
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-card)]">
          <div className="h-10 w-[3.25rem] animate-pulse rounded-lg bg-[var(--surface-muted)]" />
          <div className="h-10 w-[3.5rem] animate-pulse rounded-lg bg-[var(--surface-muted)]" />
          <div className="h-10 w-[4.25rem] animate-pulse rounded-lg bg-[var(--surface-muted)]" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-[var(--border)] px-3 py-3 last:border-b-0"
          >
            <div className="flex flex-col gap-2 pl-1">
              <div className="flex items-start justify-between gap-3">
                <div className="h-5 w-[40%] max-w-[10rem] animate-pulse rounded-md bg-[var(--surface-muted)]" />
                <div className="h-5 w-12 animate-pulse rounded-md bg-[var(--surface-muted)]" />
              </div>
              <div className="h-4 w-[55%] animate-pulse rounded-md bg-[var(--surface-muted)]" />
              <div className="flex items-start justify-between gap-3 pt-0.5">
                <div className="h-4 w-[70%] animate-pulse rounded-md bg-[var(--surface-muted)]" />
                <div className="h-3 w-14 shrink-0 animate-pulse rounded-md bg-[var(--surface-muted)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
