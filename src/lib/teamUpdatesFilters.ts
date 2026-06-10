import type { CreatorLookup } from "@/lib/calendarCreatorLabel";
import { eventBelongsToMember } from "@/lib/teamMemberFilters";
import type { TeamMemberRow } from "@/lib/teamAccess";
import { addDaysToPstKey, pstDateKeyFromInstant, startOfPSTCalendarDayUtc } from "@/lib/timezone";
import type { TeamUpdateRow, TeamUpdateTab, TeamUpdateTimeRange } from "@/lib/teamUpdatesTypes";
import { GENERAL_LEAD_KEY, teamUpdateDayKey } from "@/lib/teamUpdatesGrouping";

export function timeRangeStartIso(range: TeamUpdateTimeRange, now = new Date()): string | null {
  const todayKey = pstDateKeyFromInstant(now);
  if (range === "today") {
    return startOfPSTCalendarDayUtc(todayKey).toISOString();
  }
  const daysBack = range === "7d" ? 6 : 29;
  const sinceKey = addDaysToPstKey(todayKey, -daysBack);
  return startOfPSTCalendarDayUtc(sinceKey).toISOString();
}

export function resolveCompleterUserId(
  row: Pick<TeamUpdateRow, "completedByUserId" | "ownerUserId">,
): string | null {
  return row.completedByUserId?.trim() || row.ownerUserId?.trim() || null;
}

export function completerDisplayName(
  row: TeamUpdateRow,
  viewerUserId: string | null,
  lookup: CreatorLookup,
): string {
  const uid = resolveCompleterUserId(row);
  if (viewerUserId && uid && uid === viewerUserId) return "You";
  if (uid) {
    const fromId = lookup.byUserId[uid];
    if (fromId && fromId !== "—") return fromId;
  }
  const em = row.assigneeEmail?.trim().toLowerCase();
  if (em) {
    const fromEmail = lookup.byEmail[em];
    if (fromEmail && fromEmail !== "—") return fromEmail;
    const local = row.assigneeEmail!.split("@")[0]?.trim();
    if (local) return local;
  }
  return "Unknown";
}

export function filterTeamUpdates(
  rows: TeamUpdateRow[],
  opts: {
    tab: TeamUpdateTab;
    range: TeamUpdateTimeRange;
    search: string;
    leadId: string;
    userId: string;
    teamMembers: TeamMemberRow[];
    viewerUserId: string | null;
  },
): TeamUpdateRow[] {
  const q = opts.search.trim().toLowerCase();
  const rangeStart = timeRangeStartIso(opts.range);
  const todayKey = pstDateKeyFromInstant(new Date());

  return rows.filter((row) => {
    if (row.status !== opts.tab) return false;

    if (opts.tab === "completed") {
      const sortIso = row.completedAt;
      if (rangeStart && sortIso) {
        if (Date.parse(sortIso) < Date.parse(rangeStart)) return false;
      }
      if (opts.range === "today" && teamUpdateDayKey(row) !== todayKey) return false;
    } else {
      if (opts.range === "today") {
        const dayKey = teamUpdateDayKey(row);
        if (dayKey !== "0000-00-00" && dayKey !== todayKey) return false;
      } else if (rangeStart && row.startTime) {
        if (Date.parse(row.startTime) < Date.parse(rangeStart)) return false;
      }
    }

    if (opts.leadId !== "all") {
      if (opts.leadId === GENERAL_LEAD_KEY) {
        if (row.leadId) return false;
      } else if (row.leadId !== opts.leadId) {
        return false;
      }
    }

    if (opts.userId !== "all") {
      const member = opts.teamMembers.find((m) => m.user_id === opts.userId);
      if (!member) return false;
      if (opts.tab === "completed") {
        const completer = resolveCompleterUserId(row);
        if (completer !== member.user_id) return false;
      } else if (
        !eventBelongsToMember(
          { owner_user_id: row.ownerUserId, user_name: row.assigneeEmail },
          member,
        )
      ) {
        return false;
      }
    }

    if (q) {
      const title = row.title.toLowerCase();
      const lead = (row.leadName ?? "").toLowerCase();
      if (!title.includes(q) && !lead.includes(q)) return false;
    }

    return true;
  });
}

export function tabCounts(
  rows: TeamUpdateRow[],
  opts: Omit<Parameters<typeof filterTeamUpdates>[1], "tab">,
): Record<TeamUpdateTab, number> {
  return {
    completed: filterTeamUpdates(rows, { ...opts, tab: "completed" }).length,
    in_progress: filterTeamUpdates(rows, { ...opts, tab: "in_progress" }).length,
  };
}
