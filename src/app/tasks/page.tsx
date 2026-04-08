import Link from "next/link";
import { redirect } from "next/navigation";
import { AppMain } from "@/components/layout/AppMain";
import { Container } from "@/components/ui/Container";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatInPST, pstDateKeyFromInstant } from "@/lib/timezone";

export const dynamic = "force-dynamic";

type TaskEventRow = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  lead_id: string | null;
};

function sortByStartAsc(a: TaskEventRow, b: TaskEventRow): number {
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

function TaskSection({
  label,
  tasks,
  emptyMessage,
}: {
  label: string;
  tasks: TaskEventRow[];
  emptyMessage: string;
}) {
  return (
    <section className="flex flex-col space-y-3" aria-label={label}>
      <p className="crm-section-label">{label}</p>
      {!tasks.length ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
          {emptyMessage}
        </div>
      ) : (
        <SurfaceListShell className="transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border-b border-[var(--border)] border-l-[3px] border-l-[var(--accent-strong)] px-3 py-3 text-left last:border-b-0"
            >
              <div className="flex flex-col gap-2 pl-1">
                <p className="text-base font-medium text-[var(--text-primary)] [overflow-wrap:anywhere]">{task.title}</p>
                <p className="crm-meta text-[var(--text-secondary)]">
                  {task.start_time ? formatInPST(task.start_time) : "Time not set"}
                </p>
                {task.lead_id ? (
                  <Link
                    href={`/leads/${task.lead_id}`}
                    prefetch
                    className="inline-flex w-fit rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-strong)] shadow-sm"
                  >
                    From lead
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </SurfaceListShell>
      )}
    </section>
  );
}

export default async function TasksPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let rows: TaskEventRow[] = [];

  try {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, start_time, end_time, lead_id")
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

  const todayPstKey = pstDateKeyFromInstant(new Date());
  const { todayTasks, upcomingTasks, pastTasks } = groupTasksByPstDay(rows, todayPstKey);

  return (
    <AppMain className="items-start">
      <Container className="flex min-h-0 flex-1 flex-col space-y-6 pb-[var(--app-page-scroll-pad)]">
        <TaskSection label="Today" tasks={todayTasks} emptyMessage="Nothing scheduled for you today." />
        <TaskSection label="Upcoming" tasks={upcomingTasks} emptyMessage="No upcoming tasks." />
        <TaskSection label="Past" tasks={pastTasks} emptyMessage="No past tasks." />
      </Container>
    </AppMain>
  );
}
