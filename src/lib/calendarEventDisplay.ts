import { PST_TIMEZONE } from "@/lib/timezone";

/** Shared vs private event; enforced by RLS on `events`. */
export type CalendarScope = "team" | "personal";

export function calendarScopeLabel(scope: CalendarScope): string {
  return scope === "personal" ? "Personal" : "Team";
}

/** Row shape for `events` table (client and server). */
export type CalendarEventRow = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  user_name: string | null;
  calendar_scope: CalendarScope;
  owner_user_id: string | null;
  /** Auth user id of the teammate who created the event (when column exists). */
  created_by_user_id: string | null;
  completed_at: string | null;
};

/** Rows from DB before migration may omit scope; treat as team. */
export function normalizeCalendarEventRow(row: {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  user_name: string | null;
  calendar_scope?: CalendarScope | null;
  owner_user_id?: string | null;
  created_by_user_id?: string | null;
  completed_at?: string | null;
}): CalendarEventRow {
  const scope: CalendarScope = row.calendar_scope === "personal" ? "personal" : "team";
  const createdBy =
    typeof row.created_by_user_id === "string" && row.created_by_user_id.trim()
      ? row.created_by_user_id.trim()
      : null;
  return {
    id: row.id,
    title: row.title,
    start_time: row.start_time,
    end_time: row.end_time,
    user_name: row.user_name,
    calendar_scope: scope,
    owner_user_id: row.owner_user_id ?? null,
    created_by_user_id: createdBy,
    completed_at: row.completed_at?.trim() ? row.completed_at : null,
  };
}

export function isCalendarEventMine(
  row: Pick<CalendarEventRow, "user_name" | "owner_user_id">,
  viewerEmail: string,
  viewerUserId: string | null,
): boolean {
  if (viewerUserId && row.owner_user_id && row.owner_user_id === viewerUserId) return true;
  if (viewerEmail && row.user_name && row.user_name === viewerEmail) return true;
  return false;
}

const pstTimeOnly: Intl.DateTimeFormatOptions = {
  timeZone: PST_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
};

export function formatCalendarTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime && !endTime) return "Time not set";
  const start = startTime
    ? new Intl.DateTimeFormat("en-US", pstTimeOnly).format(new Date(startTime))
    : "TBD";
  const end = endTime
    ? new Intl.DateTimeFormat("en-US", pstTimeOnly).format(new Date(endTime))
    : "TBD";
  return `${start} - ${end}`;
}
