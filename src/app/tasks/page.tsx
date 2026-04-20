import { redirect } from "next/navigation";
import { AppMain } from "@/components/layout/AppMain";
import { Container } from "@/components/ui/Container";
import {
  TasksPageClient,
  type TaskEventRow,
} from "@/components/tasks/TasksPageClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { fetchTeamMembers } from "@/lib/teamAccess";
import { pstDateKeyFromInstant } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function isTaskCompleted(row: Pick<TaskEventRow, "completed_at">): boolean {
  return Boolean(row.completed_at?.trim());
}

function sortByStartAsc(a: TaskEventRow, b: TaskEventRow): number {
  const ca = isTaskCompleted(a);
  const cb = isTaskCompleted(b);
  if (ca !== cb) {
    return ca ? 1 : -1;
  }
  const ta = a.start_time ? Date.parse(a.start_time) : Number.MAX_SAFE_INTEGER;
  const tb = b.start_time ? Date.parse(b.start_time) : Number.MAX_SAFE_INTEGER;
  if (ta !== tb) return ta - tb;
  return a.title.localeCompare(b.title);
}

function groupTasksByPstDay(rows: TaskEventRow[], todayPstKey: string) {
  const todayTasks: TaskEventRow[] = [];
  const upcomingTasks: TaskEventRow[] = [];
  const pastTasks: TaskEventRow[] = [];

  for (const row of rows) {
    const start = row.start_time?.trim();
    if (!start) {
      upcomingTasks.push(row);
      continue;
    }
    const eventDayKey = pstDateKeyFromInstant(start);
    if (eventDayKey === todayPstKey) {
      todayTasks.push(row);
    } else if (eventDayKey > todayPstKey) {
      upcomingTasks.push(row);
    } else {
      pastTasks.push(row);
    }
  }

  todayTasks.sort(sortByStartAsc);
  upcomingTasks.sort(sortByStartAsc);
  pastTasks.sort((a, b) => sortByStartAsc(b, a));

  return { todayTasks, upcomingTasks, pastTasks };
}

type TasksSearchParams = { highlight?: string | string[] };

function highlightIdFromSearchParams(sp: TasksSearchParams): string | null {
  const raw = sp.highlight;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim()) {
    return raw[0].trim();
  }
  return null;
}

/** Personal tasks you own stay in the main list only (you are always creator and owner). */
function includeInTasksYouAssigned(row: TaskEventRow, viewerUserId: string): boolean {
  const scope = row.calendar_scope === "personal" ? "personal" : "team";
  if (scope === "personal" && row.owner_user_id === viewerUserId) {
    return false;
  }
  return true;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: TasksSearchParams | Promise<TasksSearchParams>;
}) {
  const sp = await Promise.resolve(searchParams);
  const highlightEventId = highlightIdFromSearchParams(sp);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentUserId = user.id;
  const currentUserEmail = user.email ?? "";

  let rows: TaskEventRow[] = [];
  let assignedTaskRows: TaskEventRow[] = [];

  const { rows: teamMemberRows } = await fetchTeamMembers(supabase);

  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, start_time, end_time, lead_id, created_by_user_id, user_name, completed_at, owner_user_id, calendar_scope",
      )
      .eq("owner_user_id", user.id)
      .order("start_time", { ascending: true, nullsFirst: false });

    if (error) {
      const code = (error as { code?: string }).code;
      const msg = String((error as { message?: string }).message ?? "");
      if (code !== "PGRST205") {
        console.error("Failed to fetch tasks:", msg, code ?? "");
      }
    } else {
      rows = (data ?? []) as TaskEventRow[];
    }
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
  }

  try {
    const assignedSelect =
      "id, title, start_time, end_time, lead_id, owner_user_id, user_name, created_by_user_id, completed_at, calendar_scope";

    /** All events you created (assignee can be you or anyone). Excludes `neq(owner)` so self-assign shows here too. */
    const assignedBase = () =>
      supabase
        .from("events")
        .select(assignedSelect)
        .order("start_time", { ascending: true, nullsFirst: false });

    const [{ data: byCreatorId, error: assignedErrId }, { data: byLegacyEmail, error: assignedErrLegacy }] =
      await Promise.all([
        assignedBase().eq("created_by_user_id", currentUserId),
        currentUserEmail.trim()
          ? assignedBase()
              .is("created_by_user_id", null)
              .neq("owner_user_id", currentUserId)
              .ilike("user_name", currentUserEmail.trim())
          : Promise.resolve({ data: null, error: null }),
      ]);

    const logAssignedErr = (err: unknown, label: string) => {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message ?? "")
          : "";
      if (code !== "PGRST205") {
        console.error(label, msg, code ?? "");
      }
    };

    if (assignedErrId) {
      logAssignedErr(assignedErrId, "Failed to fetch assigned tasks (by creator id):");
    }
    if (assignedErrLegacy) {
      logAssignedErr(assignedErrLegacy, "Failed to fetch assigned tasks (legacy email):");
    }

    const merged = new Map<string, TaskEventRow>();
    for (const row of [...(byCreatorId ?? []), ...(byLegacyEmail ?? [])]) {
      merged.set(row.id, row as TaskEventRow);
    }
    assignedTaskRows = [...merged.values()].filter((row) =>
      includeInTasksYouAssigned(row, currentUserId),
    );
  } catch (err) {
    console.error("Failed to fetch assigned tasks:", err);
  }

  const todayPstKey = pstDateKeyFromInstant(new Date());
  const { todayTasks, upcomingTasks, pastTasks } = groupTasksByPstDay(
    rows,
    todayPstKey,
  );
  const {
    todayTasks: assignedTodayTasks,
    upcomingTasks: assignedUpcomingTasks,
    pastTasks: assignedPastTasks,
  } = groupTasksByPstDay(assignedTaskRows, todayPstKey);

  return (
    <AppMain className="items-start">
      <Container className="flex min-h-0 flex-1 flex-col pb-[var(--app-page-scroll-pad)]">
        <TasksPageClient
          viewerUserId={currentUserId}
          viewerEmail={currentUserEmail}
          todayTasks={todayTasks}
          upcomingTasks={upcomingTasks}
          pastTasks={pastTasks}
          assignedTodayTasks={assignedTodayTasks}
          assignedUpcomingTasks={assignedUpcomingTasks}
          assignedPastTasks={assignedPastTasks}
          teamMembers={teamMemberRows}
          highlightEventId={highlightEventId}
        />
      </Container>
    </AppMain>
  );
}
