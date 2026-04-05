import type { CalendarEventRow } from "@/lib/calendarEventDisplay";
import type { TeamMemberRow } from "@/lib/teamAccess";

export type CreatorLookup = {
  byUserId: Record<string, string>;
  byEmail: Record<string, string>;
};

export const EMPTY_CREATOR_LOOKUP: CreatorLookup = { byUserId: {}, byEmail: {} };

export function buildCreatorLookupFromTeamMembers(rows: TeamMemberRow[]): CreatorLookup {
  const byUserId: Record<string, string> = {};
  const byEmail: Record<string, string> = {};
  for (const r of rows) {
    const name = r.display_name?.trim() || "—";
    if (r.user_id) byUserId[r.user_id] = name;
    const em = r.email?.trim().toLowerCase();
    if (em) byEmail[em] = name;
  }
  return { byUserId, byEmail };
}

/** Full label for list and tooltips: team display name when known, else email local part. */
export function formatEventCreatorLabel(
  event: Pick<CalendarEventRow, "user_name" | "owner_user_id">,
  _viewerEmail: string,
  _viewerUserId: string | null,
  lookup: CreatorLookup,
): string {
  if (event.owner_user_id) {
    const fromId = lookup.byUserId[event.owner_user_id];
    if (fromId && fromId !== "—") return fromId;
  }
  const em = event.user_name?.trim().toLowerCase();
  if (em) {
    const fromEmail = lookup.byEmail[em];
    if (fromEmail && fromEmail !== "—") return fromEmail;
  }
  if (event.user_name?.trim()) {
    const local = event.user_name.split("@")[0]?.trim();
    return local || event.user_name;
  }
  return "Unknown";
}

/** Short text for tight calendar cells (initials or first word). */
export function shortCreatorTag(
  event: Pick<CalendarEventRow, "user_name" | "owner_user_id">,
  viewerEmail: string,
  viewerUserId: string | null,
  lookup: CreatorLookup,
): string {
  const full = formatEventCreatorLabel(event, viewerEmail, viewerUserId, lookup);
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]![0] ?? "";
    const b = parts[1]![0] ?? "";
    return `${a}${b}`.toUpperCase() || full.slice(0, 2).toUpperCase();
  }
  return full.length > 4 ? `${full.slice(0, 3)}…` : full;
}
