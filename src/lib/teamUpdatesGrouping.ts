import type { TeamUpdateRow } from "@/lib/teamUpdatesTypes";
import { addDaysToPstKey, pstDateKeyFromInstant } from "@/lib/timezone";

export const GENERAL_LEAD_KEY = "__general__";

export function leadGroupKey(row: TeamUpdateRow): string {
  return row.leadId ?? GENERAL_LEAD_KEY;
}

export function leadGroupLabel(row: TeamUpdateRow): string {
  const name = row.leadName?.trim();
  if (name) return name;
  return "General";
}

/** PST calendar day key for sorting and grouping (completed_at or start_time). */
export function teamUpdateDayKey(row: TeamUpdateRow): string {
  const iso = row.completedAt ?? row.startTime;
  if (!iso?.trim()) return "0000-00-00";
  return pstDateKeyFromInstant(iso);
}

export function teamUpdateSortInstant(row: TeamUpdateRow): number {
  const iso = row.completedAt ?? row.startTime;
  if (!iso?.trim()) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

export type TeamUpdateLeadGroup = {
  leadKey: string;
  leadLabel: string;
  items: TeamUpdateRow[];
};

export type TeamUpdateDayGroup = {
  dayKey: string;
  dayLabel: string;
  summary: string;
  leadGroups: TeamUpdateLeadGroup[];
};

const pstDayHeadingFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function formatTeamUpdateDayHeading(dayKey: string, todayKey: string): string {
  if (dayKey === "0000-00-00") return "No date";
  if (dayKey === todayKey) return "Today";
  const yesterdayKey = addDaysToPstKey(todayKey, -1);
  if (dayKey === yesterdayKey) return "Yesterday";
  const [y, mo, d] = dayKey.split("-").map(Number);
  const instant = new Date(Date.UTC(y, mo - 1, d, 12));
  return pstDayHeadingFormatter.format(instant);
}

export function formatDayGroupSummary(count: number, tab: "completed" | "in_progress"): string {
  const noun = count === 1 ? "task" : "tasks";
  if (tab === "completed") return `${count} ${noun} completed`;
  return `${count} ${noun} in progress`;
}

export function groupTeamUpdatesByDayAndLead(
  rows: TeamUpdateRow[],
  tab: "completed" | "in_progress",
  todayKey: string,
): TeamUpdateDayGroup[] {
  const sorted = [...rows].sort((a, b) => teamUpdateSortInstant(b) - teamUpdateSortInstant(a));

  const byDay = new Map<string, TeamUpdateRow[]>();
  for (const row of sorted) {
    const key = teamUpdateDayKey(row);
    const list = byDay.get(key) ?? [];
    list.push(row);
    byDay.set(key, list);
  }

  const dayGroups: TeamUpdateDayGroup[] = [];
  for (const [dayKey, dayRows] of byDay) {
    const byLead = new Map<string, TeamUpdateRow[]>();
    for (const row of dayRows) {
      const lk = leadGroupKey(row);
      const list = byLead.get(lk) ?? [];
      list.push(row);
      byLead.set(lk, list);
    }

    const leadGroups: TeamUpdateLeadGroup[] = [];
    for (const [leadKey, leadRows] of byLead) {
      const label = leadGroupLabel(leadRows[0]!);
      leadGroups.push({
        leadKey,
        leadLabel: label,
        items: leadRows.sort((a, b) => teamUpdateSortInstant(b) - teamUpdateSortInstant(a)),
      });
    }

    leadGroups.sort((a, b) => a.leadLabel.localeCompare(b.leadLabel, undefined, { sensitivity: "base" }));

    dayGroups.push({
      dayKey,
      dayLabel: formatTeamUpdateDayHeading(dayKey, todayKey),
      summary: formatDayGroupSummary(dayRows.length, tab),
      leadGroups,
    });
  }

  dayGroups.sort((a, b) => b.dayKey.localeCompare(a.dayKey));
  return dayGroups;
}
