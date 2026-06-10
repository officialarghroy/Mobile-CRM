export function TeamUpdatesPageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading team updates">
      <div className="h-11 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-11 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
        <div className="h-11 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
      </div>
      <div className="h-11 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
      <div className="flex gap-2">
        <div className="h-10 w-28 animate-pulse rounded-full bg-[var(--surface-muted)]" />
        <div className="h-10 w-32 animate-pulse rounded-full bg-[var(--surface-muted)]" />
      </div>
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="h-24 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
        <div className="h-24 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
      </div>
    </div>
  );
}
