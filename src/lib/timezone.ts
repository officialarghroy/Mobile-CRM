export const PST_TIMEZONE = "America/Los_Angeles";

const pstDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PST_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD for the instant in America/Los_Angeles (for grouping and comparisons). */
export function pstDateKeyFromInstant(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return pstDateKeyFormatter.format(date);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Gregorian civil date + `delta` days; used only to build the next PST calendar key from a YYYY-MM-DD key. */
export function addDaysToPstKey(pstKey: string, delta: number): string {
  const [y, mo, d] = pstKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, mo - 1, d));
  base.setUTCDate(base.getUTCDate() + delta);
  const ny = base.getUTCFullYear();
  const nm = base.getUTCMonth() + 1;
  const nd = base.getUTCDate();
  return `${ny}-${pad2(nm)}-${pad2(nd)}`;
}

/** First UTC instant where the PST calendar date is `pstKey` (YYYY-MM-DD). */
export function startOfPSTCalendarDayUtc(pstKey: string): Date {
  let lo = Date.UTC(2020, 0, 1);
  let hi = Date.UTC(2040, 0, 1);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const key = pstDateKeyFromInstant(new Date(mid));
    if (key < pstKey) lo = mid + 1;
    else hi = mid;
  }
  return new Date(lo);
}

export function endOfPSTCalendarDayUtc(pstKey: string): Date {
  const nextKey = addDaysToPstKey(pstKey, 1);
  return new Date(startOfPSTCalendarDayUtc(nextKey).getTime() - 1);
}

export function formatInPST(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: PST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const pstMonthDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PST_TIMEZONE,
  month: "short",
  day: "numeric",
});

/** Lead list row: relative buckets + "Yesterday" by PST date + short month/day in PST. */
export function formatLeadsListActivityLabel(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes}m ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours}h ago`;
  }

  const todayKey = pstDateKeyFromInstant(new Date());
  const eventKey = pstDateKeyFromInstant(date);
  const yesterdayKey = addDaysToPstKey(todayKey, -1);
  if (eventKey === yesterdayKey) return "Yesterday";

  return pstMonthDayFormatter.format(date);
}

/** Same relative rules as the former lead-detail helpers (interval-based). */
export function formatLeadUpdateRelativeTime(createdAt: string): string {
  const now = Date.now();
  const then = new Date(createdAt).getTime();
  const diffInSeconds = Math.max(0, Math.floor((now - then) / 1000));

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 5) return `${diffInWeeks}w ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

const pstWeekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function pstWeekdayIndexSunday0(instant: Date): number {
  const w = new Intl.DateTimeFormat("en-US", { timeZone: PST_TIMEZONE, weekday: "short" }).format(instant);
  const idx = pstWeekdayShort.indexOf(w as (typeof pstWeekdayShort)[number]);
  return idx >= 0 ? idx : 0;
}

export function formatPstMonthYear(pstYear: number, pstMonthIndex: number): string {
  const key = `${pstYear}-${pad2(pstMonthIndex + 1)}-01`;
  const instant = startOfPSTCalendarDayUtc(key);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PST_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(instant);
}

export function daysInGregorianMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function currentPstYearMonth(): { year: number; monthIndex: number } {
  const key = pstDateKeyFromInstant(new Date());
  const [y, m] = key.split("-").map(Number);
  return { year: y, monthIndex: m - 1 };
}

export function addGregorianMonths(year: number, monthIndex: number, delta: number): { year: number; monthIndex: number } {
  const d = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: d.getUTCFullYear(), monthIndex: d.getUTCMonth() };
}
