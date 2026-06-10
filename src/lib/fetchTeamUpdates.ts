import type { SupabaseClient } from "@supabase/supabase-js";
import { isLegacyCalendarEventsSchemaError } from "@/lib/calendarEventsSchemaError";
import type { LeadFilterOption, TeamUpdateRow } from "@/lib/teamUpdatesTypes";
import { addDaysToPstKey, pstDateKeyFromInstant, startOfPSTCalendarDayUtc } from "@/lib/timezone";

type RawEventRow = {
  id: string;
  title: string;
  completed_at?: string | null;
  completed_by_user_id?: string | null;
  owner_user_id?: string | null;
  lead_id?: string | null;
  start_time?: string | null;
  user_name?: string | null;
  calendar_scope?: string | null;
};

const EVENT_SELECT_WITH_COMPLETER =
  "id, title, completed_at, completed_by_user_id, owner_user_id, lead_id, start_time, user_name, calendar_scope";

const EVENT_SELECT_STANDARD =
  "id, title, completed_at, owner_user_id, lead_id, start_time, user_name, calendar_scope";

const EVENT_SELECT_LEGACY =
  "id, title, start_time, user_name";

function isMissingCompletedByColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  const msg = "message" in error ? String((error as { message?: string }).message ?? "").toLowerCase() : "";
  return code === "42703" && msg.includes("completed_by_user_id");
}

function isMissingCompletedAtColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  const msg = "message" in error ? String((error as { message?: string }).message ?? "").toLowerCase() : "";
  return code === "42703" && msg.includes("completed_at");
}

function normalizeEventRow(row: RawEventRow): TeamUpdateRow | null {
  const scope = row.calendar_scope === "personal" ? "personal" : "team";
  if (scope !== "team") return null;

  const completedAt =
    typeof row.completed_at === "string" && row.completed_at.trim() ? row.completed_at.trim() : null;
  const status = completedAt ? "completed" : "in_progress";

  return {
    id: row.id,
    title: row.title?.trim() || "Untitled task",
    status,
    completedAt,
    completedByUserId:
      typeof row.completed_by_user_id === "string" && row.completed_by_user_id.trim()
        ? row.completed_by_user_id.trim()
        : null,
    ownerUserId:
      typeof row.owner_user_id === "string" && row.owner_user_id.trim() ? row.owner_user_id.trim() : null,
    assigneeEmail:
      typeof row.user_name === "string" && row.user_name.trim() ? row.user_name.trim() : null,
    leadId: typeof row.lead_id === "string" && row.lead_id.trim() ? row.lead_id.trim() : null,
    leadName: null,
    startTime: typeof row.start_time === "string" && row.start_time.trim() ? row.start_time.trim() : null,
  };
}

function mergeEventRows(rows: RawEventRow[]): RawEventRow[] {
  const byId = new Map<string, RawEventRow>();
  for (const row of rows) {
    if (row?.id) byId.set(row.id, row);
  }
  return [...byId.values()];
}

async function runScopedEventQueries(
  supabase: SupabaseClient,
  select: string,
  sinceIso: string,
  teamScopeOnly: boolean,
): Promise<{ rows: RawEventRow[]; error: unknown | null }> {
  const build = () => {
    let q = supabase.from("events").select(select);
    if (teamScopeOnly) q = q.eq("calendar_scope", "team");
    return q;
  };

  const [completedRes, openRes] = await Promise.all([
    build().gte("completed_at", sinceIso),
    build().is("completed_at", null),
  ]);

  const firstError = completedRes.error ?? openRes.error;
  if (firstError) {
    return { rows: [], error: firstError };
  }

  return {
    rows: mergeEventRows([
      ...((completedRes.data ?? []) as unknown as RawEventRow[]),
      ...((openRes.data ?? []) as unknown as RawEventRow[]),
    ]),
    error: null,
  };
}

function isRecoverableFetchError(error: unknown, select: string): boolean {
  if (isMissingCompletedByColumn(error) && select === EVENT_SELECT_WITH_COMPLETER) return true;
  if (isMissingCompletedAtColumn(error)) return true;
  if (isLegacyCalendarEventsSchemaError(error)) return true;
  return false;
}

async function fetchLegacyEventsWithoutCompletion(
  supabase: SupabaseClient,
): Promise<RawEventRow[]> {
  const res = await supabase
    .from("events")
    .select(EVENT_SELECT_LEGACY)
    .order("start_time", { ascending: false, nullsFirst: false });

  if (res.error) {
    console.error("Failed to fetch team updates events (legacy):", res.error);
    return [];
  }

  return (res.data ?? []) as RawEventRow[];
}

async function fetchRawTeamEvents(
  supabase: SupabaseClient,
  sinceIso: string,
): Promise<RawEventRow[]> {
  const attempts: { select: string; teamScopeOnly: boolean }[] = [
    { select: EVENT_SELECT_WITH_COMPLETER, teamScopeOnly: true },
    { select: EVENT_SELECT_STANDARD, teamScopeOnly: true },
    { select: EVENT_SELECT_STANDARD, teamScopeOnly: false },
  ];

  for (const attempt of attempts) {
    const { rows, error } = await runScopedEventQueries(
      supabase,
      attempt.select,
      sinceIso,
      attempt.teamScopeOnly,
    );

    if (!error) {
      return rows;
    }

    if (isRecoverableFetchError(error, attempt.select)) {
      if (isMissingCompletedAtColumn(error)) {
        return fetchLegacyEventsWithoutCompletion(supabase);
      }
      continue;
    }

    console.error("Failed to fetch team updates events:", error);
    return [];
  }

  return fetchLegacyEventsWithoutCompletion(supabase);
}

/** Fetch team-scoped events for Team Updates (last 30 days window on server). */
export async function fetchTeamUpdatesData(supabase: SupabaseClient): Promise<{
  rows: TeamUpdateRow[];
  leadOptions: LeadFilterOption[];
}> {
  const todayKey = pstDateKeyFromInstant(new Date());
  const sinceKey = addDaysToPstKey(todayKey, -29);
  const sinceIso = startOfPSTCalendarDayUtc(sinceKey).toISOString();

  const rawEvents = await fetchRawTeamEvents(supabase, sinceIso);
  const rows = rawEvents.map(normalizeEventRow).filter((r): r is TeamUpdateRow => r != null);

  const leadIds = [...new Set(rows.map((r) => r.leadId).filter((id): id is string => Boolean(id)))];

  const leadNameById = new Map<string, string>();
  if (leadIds.length) {
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("id, name")
      .in("id", leadIds);

    if (leadsError) {
      console.error("Failed to fetch leads for team updates:", leadsError);
    } else {
      for (const lead of leadsData ?? []) {
        const id = typeof lead.id === "string" ? lead.id : "";
        const name = typeof lead.name === "string" ? lead.name.trim() : "";
        if (id && name) leadNameById.set(id, name);
      }
    }
  }

  const enriched = rows.map((row) => ({
    ...row,
    leadName: row.leadId ? (leadNameById.get(row.leadId) ?? null) : null,
  }));

  const leadOptions: LeadFilterOption[] = [...leadNameById.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return { rows: enriched, leadOptions };
}
