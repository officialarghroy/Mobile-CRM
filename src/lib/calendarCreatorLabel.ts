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

/** Display name for whoever created the event (uses `created_by_user_id`, then legacy `user_name`). */
export function formatEventAddedByLabel(
  event: Pick<CalendarEventRow, "user_name" | "created_by_user_id">,
  _viewerEmail: string,
  viewerUserId: string | null,
  lookup: CreatorLookup,
): string {
  const cid = event.created_by_user_id?.trim();
  if (viewerUserId && cid && cid === viewerUserId) {
    return "You";
  }
  if (cid) {
    const fromId = lookup.byUserId[cid];
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

/** Display name for whoever owns / is assigned the task. */
export function formatEventAssigneeLabel(
  event: Pick<CalendarEventRow, "owner_user_id">,
  viewerUserId: string | null,
  lookup: CreatorLookup,
): string {
  const oid = event.owner_user_id?.trim();
  if (!oid) return "Unassigned";
  if (viewerUserId && oid === viewerUserId) return "You";
  const fromId = lookup.byUserId[oid];
  if (fromId && fromId !== "—") return fromId;
  return "Unknown";
}

/** @deprecated Use formatEventAddedByLabel for creator lines. Kept for any legacy callers. */
export function formatEventCreatorLabel(
  event: Pick<CalendarEventRow, "user_name" | "owner_user_id" | "created_by_user_id">,
  viewerEmail: string,
  viewerUserId: string | null,
  lookup: CreatorLookup,
): string {
  return formatEventAddedByLabel(event, viewerEmail, viewerUserId, lookup);
}

/** Short text for tight calendar cells (initials or first word). */
export function shortCreatorTag(
  event: Pick<CalendarEventRow, "user_name" | "owner_user_id" | "created_by_user_id">,
  viewerEmail: string,
  viewerUserId: string | null,
  lookup: CreatorLookup,
): string {
  const full = formatEventAssigneeLabel(event, viewerUserId, lookup);
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]![0] ?? "";
    const b = parts[1]![0] ?? "";
    return `${a}${b}`.toUpperCase() || full.slice(0, 2).toUpperCase();
  }
  return full.length > 4 ? `${full.slice(0, 3)}…` : full;
}
