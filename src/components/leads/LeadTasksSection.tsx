"use client";

import { useMemo } from "react";
import { DeleteCalendarEventButton } from "@/components/calendar/DeleteCalendarEventButton";
import { TaskCompleteControl } from "@/components/tasks/TaskCompleteControl";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import type { CalendarScope } from "@/lib/calendarEventDisplay";
import type { TeamMemberRow } from "@/lib/teamAccess";
import { formatInPST, pstDateKeyFromInstant } from "@/lib/timezone";

export type LeadTasksSectionEvent = {
  id: string;
  title: string;
  start_time: string | null;
  owner_user_id: string | null;
  user_name?: string | null;
  created_by_user_id?: string | null;
  completed_at?: string | null;
  calendar_scope?: CalendarScope | null;
};

type LeadTasksSectionProps = {
  events: LeadTasksSectionEvent[] | null | undefined;
  viewerUserId: string | null;
  viewerEmail: string;
  teamMembers: TeamMemberRow[];
};

function emailsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = a?.trim().toLowerCase();
  const y = b?.trim().toLowerCase();
  return Boolean(x && y && x === y);
}

function rowCalendarScope(row: Pick<LeadTasksSectionEvent, "calendar_scope">): CalendarScope {
  return row.calendar_scope === "personal" ? "personal" : "team";
}

function isCreatedByViewer(
  ev: Pick<LeadTasksSectionEvent, "created_by_user_id" | "user_name">,
  viewerUserId: string | null,
  viewerEmail: string,
): boolean {
  if (viewerUserId && ev.created_by_user_id?.trim() === viewerUserId) {
    return true;
  }
  return emailsMatch(ev.user_name, viewerEmail);
}

function sortByStartAsc(a: LeadTasksSectionEvent, b: LeadTasksSectionEvent): number {
  const ca = Boolean(a.completed_at?.trim());
  const cb = Boolean(b.completed_at?.trim());
  if (ca !== cb) {
    return ca ? 1 : -1;
  }
  const ta = a.start_time ? Date.parse(a.start_time) : Number.MAX_SAFE_INTEGER;
  const tb = b.start_time ? Date.parse(b.start_time) : Number.MAX_SAFE_INTEGER;
  if (ta !== tb) return ta - tb;
  return (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" });
}

function sortByStartDesc(a: LeadTasksSectionEvent, b: LeadTasksSectionEvent): number {
  const ca = Boolean(a.completed_at?.trim());
  const cb = Boolean(b.completed_at?.trim());
  if (ca !== cb) {
    return ca ? 1 : -1;
  }
  const ta = a.start_time ? Date.parse(a.start_time) : Number.MAX_SAFE_INTEGER;
  const tb = b.start_time ? Date.parse(b.start_time) : Number.MAX_SAFE_INTEGER;
  if (ta !== tb) return tb - ta;
  return (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" });
}

/** Upcoming (incl. undated) → today → past; matches My Tasks PST grouping with display order priority. */
function sortLeadTasksForDisplay(events: LeadTasksSectionEvent[]): LeadTasksSectionEvent[] {
  const todayPstKey = pstDateKeyFromInstant(new Date());
  const upcoming: LeadTasksSectionEvent[] = [];
  const today: LeadTasksSectionEvent[] = [];
  const past: LeadTasksSectionEvent[] = [];

  for (const row of events) {
    const start = row.start_time?.trim();
    if (!start) {
      upcoming.push(row);
      continue;
    }
    const eventDayKey = pstDateKeyFromInstant(start);
    if (eventDayKey === todayPstKey) {
      today.push(row);
    } else if (eventDayKey > todayPstKey) {
      upcoming.push(row);
    } else {
      past.push(row);
    }
  }

  upcoming.sort(sortByStartAsc);
  today.sort(sortByStartAsc);
  past.sort(sortByStartDesc);

  return [...upcoming, ...today, ...past];
}

function formatAssigneeLabel(
  ownerUserId: string | null | undefined,
  viewerUserId: string | null,
  teamMembers: TeamMemberRow[],
): string {
  if (!ownerUserId?.trim()) {
    return "Unassigned";
  }
  if (viewerUserId && ownerUserId === viewerUserId) {
    return "You";
  }
  const member = teamMembers.find((m) => m.user_id === ownerUserId);
  if (member) {
    const name = member.display_name.trim();
    if (name && name !== "—") return name;
    const email = member.email.trim();
    if (email) return email;
  }
  return "Unknown";
}

export function LeadTasksSection({
  events,
  viewerUserId,
  viewerEmail,
  teamMembers,
}: LeadTasksSectionProps) {
  const list = useMemo(() => {
    const raw = Array.isArray(events) ? events : [];
    return sortLeadTasksForDisplay(raw);
  }, [events]);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="lead-tasks-heading">
      <h2 id="lead-tasks-heading" className="crm-section-label">
        Tasks for this lead
      </h2>
      {!list.length ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
          No tasks scheduled for this lead
        </div>
      ) : (
        <SurfaceListShell className="transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          {list.map((ev) => {
            const createdByViewer = isCreatedByViewer(ev, viewerUserId, viewerEmail);
            const assigneeLabel = formatAssigneeLabel(ev.owner_user_id, viewerUserId, teamMembers);
            const assigneeLine =
              assigneeLabel === "Unassigned" ? "Unassigned" : `Assigned to ${assigneeLabel}`;
            const done = Boolean(ev.completed_at?.trim());
            const assigneeCanToggle = Boolean(viewerUserId && ev.owner_user_id === viewerUserId);
            const rowClasses = [
              "border-b border-[var(--border)] border-l-[3px] px-3 py-3 text-left last:border-b-0",
              done ? "bg-[var(--surface-muted)]/35" : "",
              createdByViewer
                ? "border-l-[var(--accent-strong)] bg-[var(--surface-accent)]/45 ring-1 ring-inset ring-[var(--accent-strong)]/15"
                : "border-l-[var(--accent-strong)]",
            ]
              .filter(Boolean)
              .join(" ");
            const titleLabel = ev.title?.trim() ? ev.title.trim() : "Untitled task";

            return (
              <div key={ev.id} className={rowClasses}>
                <div className="flex items-start gap-2 pl-0.5 pr-1">
                  {assigneeCanToggle ? (
                    <div className="-ml-1 mt-1 shrink-0">
                      <TaskCompleteControl eventId={ev.id} completed={done} />
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
                      {viewerUserId ? (
                        <DeleteCalendarEventButton
                          kind="task"
                          layout="icon"
                          eventId={ev.id}
                          eventTitle={ev.title ?? ""}
                          calendarScope={rowCalendarScope(ev)}
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 gap-y-1">
                      {createdByViewer ? (
                        <span className="inline-flex shrink-0 rounded-lg border border-[var(--accent-strong)]/35 bg-[var(--surface)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--accent-strong)]">
                          Created by you
                        </span>
                      ) : null}
                      {done && ev.completed_at ? (
                        <span className="inline-flex shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--text-secondary)]">
                          Completed {formatInPST(ev.completed_at)}
                        </span>
                      ) : null}
                    </div>
                    <p className="crm-meta text-[var(--text-secondary)]">
                      {ev.start_time ? formatInPST(ev.start_time) : "Time not set"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] [overflow-wrap:anywhere]">
                      {assigneeLine}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </SurfaceListShell>
      )}
    </section>
  );
}
