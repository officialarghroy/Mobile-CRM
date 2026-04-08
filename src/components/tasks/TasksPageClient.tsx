"use client";

import Link from "next/link";
import { useCallback, useState, type KeyboardEvent } from "react";
import { DeleteCalendarEventButton } from "@/components/calendar/DeleteCalendarEventButton";
import { TaskCompleteControl } from "@/components/tasks/TaskCompleteControl";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import type { CalendarScope } from "@/lib/calendarEventDisplay";
import type { TeamMemberRow } from "@/lib/teamAccess";
import { formatInPST } from "@/lib/timezone";

export type TaskEventRow = {
  id: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  lead_id: string | null;
  owner_user_id?: string | null;
  created_by_user_id?: string | null;
  user_name?: string | null;
  completed_at?: string | null;
  calendar_scope?: CalendarScope | null;
};

type TasksTabId = "today" | "upcoming" | "past";

function rowCalendarScope(row: Pick<TaskEventRow, "calendar_scope">): CalendarScope {
  return row.calendar_scope === "personal" ? "personal" : "team";
}

const TABS: { id: TasksTabId; label: string; emptyMessage: string }[] = [
  {
    id: "today",
    label: "Today",
    emptyMessage: "Nothing scheduled for you today.",
  },
  { id: "upcoming", label: "Upcoming", emptyMessage: "No upcoming tasks." },
  { id: "past", label: "Past", emptyMessage: "No past tasks." },
];

function assignerDisplayLabel(
  task: Pick<TaskEventRow, "created_by_user_id" | "user_name">,
  teamMembers: TeamMemberRow[],
  viewerUserId: string | null,
): string | null {
  const cid = task.created_by_user_id?.trim();
  if (viewerUserId && cid === viewerUserId) {
    return "You";
  }
  if (cid) {
    const member = teamMembers.find((m) => m.user_id === cid);
    if (member) {
      const name = member.display_name?.trim();
      if (name && name !== "—") {
        return name;
      }
      const email = member.email?.trim();
      if (email) {
        return email;
      }
    }
  }
  const stored = task.user_name?.trim();
  if (stored) {
    const local = stored.split("@")[0]?.trim();
    return local || stored;
  }
  return null;
}

function TaskList({
  tasks,
  teamMembers,
  viewerUserId,
}: {
  tasks: TaskEventRow[];
  teamMembers: TeamMemberRow[];
  viewerUserId: string | null;
}) {
  if (!tasks.length) return null;
  const canToggle = Boolean(viewerUserId);
  return (
    <SurfaceListShell className="transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
      {tasks.map((task) => {
        const assigner = assignerDisplayLabel(task, teamMembers, viewerUserId);
        const done = Boolean(task.completed_at?.trim());
        const titleLabel = task.title?.trim() ? task.title.trim() : "Untitled task";
        return (
          <div
            key={task.id}
            className={`border-b border-[var(--border)] border-l-[3px] border-l-[var(--accent-strong)] px-3 py-3 text-left last:border-b-0 ${
              done ? "bg-[var(--surface-muted)]/40" : ""
            }`}
          >
            <div className="flex items-start gap-2 pl-0.5 pr-1">
              {canToggle ? (
                <div className="-ml-1 mt-1 shrink-0">
                  <TaskCompleteControl eventId={task.id} completed={done} />
                </div>
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <p
                    className={`min-w-0 flex-1 text-[0.9375rem] font-normal leading-snug [overflow-wrap:anywhere] ${
                      done
                        ? "text-[var(--text-secondary)] line-through decoration-[var(--text-tertiary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {titleLabel}
                  </p>
                  {canToggle ? (
                    <DeleteCalendarEventButton
                      kind="task"
                      layout="icon"
                      eventId={task.id}
                      eventTitle={task.title ?? ""}
                      calendarScope={rowCalendarScope(task)}
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                <p className="crm-meta text-[var(--text-secondary)]">
                  {task.start_time ? formatInPST(task.start_time) : "Time not set"}
                </p>
                {done && task.completed_at ? (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Completed {formatInPST(task.completed_at)}
                  </p>
                ) : null}
                {assigner ? (
                  <p className="text-xs text-[var(--text-secondary)] [overflow-wrap:anywhere]">
                    Assigned by {assigner}
                  </p>
                ) : null}
                {task.lead_id ? (
                  <Link
                    href={`/leads/${task.lead_id}`}
                    prefetch
                    className="inline-flex w-fit rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-strong)] shadow-sm"
                  >
                    View lead
                  </Link>
                ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </SurfaceListShell>
  );
}

function assigneeDisplayName(
  ownerUserId: string | null | undefined,
  teamMembers: TeamMemberRow[],
): string {
  if (!teamMembers.length) {
    return "Assigned user";
  }
  const uid = ownerUserId?.trim();
  if (!uid) {
    return "Assigned user";
  }
  const member = teamMembers.find((m) => m.user_id === uid);
  if (!member) {
    return "Assigned user";
  }
  const name = member.display_name?.trim();
  if (name && name !== "—") {
    return name;
  }
  const email = member.email?.trim();
  if (email) {
    return email;
  }
  return "Assigned user";
}

function AssignedTaskList({
  tasks,
  teamMembers,
  viewerUserId,
}: {
  tasks: TaskEventRow[];
  teamMembers: TeamMemberRow[];
  viewerUserId: string | null;
}) {
  if (!tasks.length) return null;
  const canToggle = Boolean(viewerUserId);
  return (
    <SurfaceListShell className="transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
      {tasks.map((task) => {
        const done = Boolean(task.completed_at?.trim());
        const titleLabel = task.title?.trim() ? task.title.trim() : "Untitled task";
        return (
          <div
            key={task.id}
            className={`border-b border-[var(--border)] border-l-[3px] border-l-[var(--accent-strong)] px-3 py-3 text-left last:border-b-0 ${
              done ? "bg-[var(--surface-muted)]/40" : ""
            }`}
          >
            <div className="flex items-start gap-2 pl-0.5 pr-1">
              {canToggle ? (
                <div className="-ml-1 mt-1 shrink-0">
                  <TaskCompleteControl eventId={task.id} completed={done} />
                </div>
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <p
                    className={`min-w-0 flex-1 text-[0.9375rem] font-normal leading-snug [overflow-wrap:anywhere] ${
                      done
                        ? "text-[var(--text-secondary)] line-through decoration-[var(--text-tertiary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {titleLabel}
                  </p>
                  {canToggle ? (
                    <DeleteCalendarEventButton
                      kind="task"
                      layout="icon"
                      eventId={task.id}
                      eventTitle={task.title ?? ""}
                      calendarScope={rowCalendarScope(task)}
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                <p className="crm-meta text-[var(--text-secondary)]">
                  {task.start_time ? formatInPST(task.start_time) : "Time not set"}
                </p>
                {done && task.completed_at ? (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Completed {formatInPST(task.completed_at)}
                  </p>
                ) : null}
                <p className="text-xs text-[var(--text-secondary)] [overflow-wrap:anywhere]">
                  Assigned: {assigneeDisplayName(task.owner_user_id, teamMembers)}
                </p>
                {task.lead_id ? (
                  <Link
                    href={`/leads/${task.lead_id}`}
                    prefetch
                    className="inline-flex w-fit rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-strong)] shadow-sm"
                  >
                    View lead
                  </Link>
                ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </SurfaceListShell>
  );
}

type TasksPageClientProps = {
  viewerUserId: string | null;
  todayTasks: TaskEventRow[];
  upcomingTasks: TaskEventRow[];
  pastTasks: TaskEventRow[];
  assignedTodayTasks?: TaskEventRow[];
  assignedUpcomingTasks?: TaskEventRow[];
  assignedPastTasks?: TaskEventRow[];
  teamMembers?: TeamMemberRow[];
};

export function TasksPageClient({
  viewerUserId,
  todayTasks,
  upcomingTasks,
  pastTasks,
  assignedTodayTasks = [],
  assignedUpcomingTasks = [],
  assignedPastTasks = [],
  teamMembers = [],
}: TasksPageClientProps) {
  const [active, setActive] = useState<TasksTabId>("today");
  const [assignedActive, setAssignedActive] = useState<TasksTabId>("today");

  const tasksByTab: Record<TasksTabId, TaskEventRow[]> = {
    today: todayTasks,
    upcoming: upcomingTasks,
    past: pastTasks,
  };

  const activeTabMeta = TABS.find((t) => t.id === active)!;
  const activeTasks = tasksByTab[active];

  const assignedTasksByTab: Record<TasksTabId, TaskEventRow[]> = {
    today: assignedTodayTasks,
    upcoming: assignedUpcomingTasks,
    past: assignedPastTasks,
  };
  const assignedActiveTabMeta = TABS.find((t) => t.id === assignedActive)!;
  const assignedActiveTasks = assignedTasksByTab[assignedActive];
  const assignedTotalCount =
    assignedTodayTasks.length + assignedUpcomingTasks.length + assignedPastTasks.length;

  const focusTab = useCallback((id: TasksTabId) => {
    setActive(id);
    document.getElementById(`tasks-tab-${id}`)?.focus();
  }, []);

  const focusAssignedTab = useCallback((id: TasksTabId) => {
    setAssignedActive(id);
    document.getElementById(`assigned-tasks-tab-${id}`)?.focus();
  }, []);

  const onTabKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const idx = TABS.findIndex((t) => t.id === active);
      if (idx < 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = TABS[(idx + 1) % TABS.length].id;
        focusTab(next);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = TABS[(idx - 1 + TABS.length) % TABS.length].id;
        focusTab(next);
      } else if (e.key === "Home") {
        e.preventDefault();
        focusTab(TABS[0].id);
      } else if (e.key === "End") {
        e.preventDefault();
        focusTab(TABS[TABS.length - 1].id);
      }
    },
    [active, focusTab],
  );

  const onAssignedTabKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const idx = TABS.findIndex((t) => t.id === assignedActive);
      if (idx < 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = TABS[(idx + 1) % TABS.length].id;
        focusAssignedTab(next);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = TABS[(idx - 1 + TABS.length) % TABS.length].id;
        focusAssignedTab(next);
      } else if (e.key === "Home") {
        e.preventDefault();
        focusAssignedTab(TABS[0].id);
      } else if (e.key === "End") {
        e.preventDefault();
        focusAssignedTab(TABS[TABS.length - 1].id);
      }
    },
    [assignedActive, focusAssignedTab],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <div
            className="flex flex-wrap gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]"
            role="tablist"
            aria-label="Task date range"
            onKeyDown={onTabKeyDown}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tasks-tab-${tab.id}`}
                aria-selected={active === tab.id}
                aria-controls="tasks-panel"
                tabIndex={active === tab.id ? 0 : -1}
                onClick={() => setActive(tab.id)}
                className={`touch-manipulation rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active === tab.id
                    ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div
          id="tasks-panel"
          role="tabpanel"
          aria-labelledby={`tasks-tab-${active}`}
          className="flex flex-col space-y-3"
        >
          {!activeTasks.length ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
              {activeTabMeta.emptyMessage}
            </div>
          ) : (
            <TaskList tasks={activeTasks} teamMembers={teamMembers} viewerUserId={viewerUserId} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <h2 className="crm-section-label">Tasks you assigned</h2>
        {assignedTotalCount === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
            No tasks assigned to others yet
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <div
                className="flex flex-wrap gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]"
                role="tablist"
                aria-label="Assigned task date range"
                onKeyDown={onAssignedTabKeyDown}
              >
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`assigned-tasks-tab-${tab.id}`}
                    aria-selected={assignedActive === tab.id}
                    aria-controls="assigned-tasks-panel"
                    tabIndex={assignedActive === tab.id ? 0 : -1}
                    onClick={() => setAssignedActive(tab.id)}
                    className={`touch-manipulation rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      assignedActive === tab.id
                        ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              id="assigned-tasks-panel"
              role="tabpanel"
              aria-labelledby={`assigned-tasks-tab-${assignedActive}`}
              className="flex flex-col space-y-3"
            >
              {!assignedActiveTasks.length ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
                  {assignedActiveTabMeta.emptyMessage}
                </div>
              ) : (
                <AssignedTaskList
                  tasks={assignedActiveTasks}
                  teamMembers={teamMembers}
                  viewerUserId={viewerUserId}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
