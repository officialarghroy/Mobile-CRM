import type { CalendarScope } from "@/lib/calendarEventDisplay";
import { calendarScopeLabel } from "@/lib/calendarEventDisplay";

type CalendarScopeTagProps = {
  scope: CalendarScope;
  /** Timeline uses smaller text. */
  size?: "sm" | "md";
};

export function CalendarScopeTag({ scope, size = "md" }: CalendarScopeTagProps) {
  const sizeClass =
    size === "sm"
      ? "px-1 py-px text-[0.5rem] sm:text-[0.55rem]"
      : "px-1.5 py-0.5 text-[0.6rem] sm:text-[0.65rem]";

  if (scope === "team") {
    return (
      <span
        className={`inline-flex shrink-0 items-center rounded-md bg-red-100 font-semibold uppercase tracking-wide text-red-900 ring-1 ring-inset ring-red-300/90 dark:bg-red-800 dark:text-white dark:ring-red-950/40 ${sizeClass}`}
      >
        {calendarScopeLabel(scope)}
      </span>
    );
  }

  return <span className="font-semibold">{calendarScopeLabel(scope)}</span>;
}
