"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalScaffold } from "@/components/ui/ModalScaffold";
import type { CalendarEventRow, CalendarScope } from "@/lib/calendarEventDisplay";
import { getUserFacingErrorMessage } from "@/lib/supabaseActionErrors";
import type { TeamMemberRow } from "@/lib/teamAccess";

type AddEventInlineProps = {
  createEvent: (formData: FormData) => Promise<CalendarEventRow>;
  defaultDate: Date;
  /** Initial Team vs Personal choice when the modal opens (e.g. match the Events list filter). */
  defaultCalendarScope?: CalendarScope;
  onClose: () => void;
  /** Merges the new row into the UI immediately (covers slow or flaky RSC refresh, e.g. installed PWA). */
  onCreated?: (row: CalendarEventRow) => void;
  teamMembers: TeamMemberRow[];
  viewerUserId: string | null;
  viewerEmail: string;
};

function assigneeLabel(m: TeamMemberRow): string {
  const d = m.display_name?.trim();
  if (d && d !== "—") return d;
  return m.email?.trim() || "Team member";
}

function initialAssignedUserId(viewerUserId: string | null, teamMembers: TeamMemberRow[]): string {
  if (viewerUserId && teamMembers.some((m) => m.user_id === viewerUserId)) return viewerUserId;
  if (teamMembers[0]?.user_id) return teamMembers[0].user_id;
  return viewerUserId ?? "";
}

function buildAssigneeRows(
  teamMembers: TeamMemberRow[],
  viewerUserId: string | null,
  viewerEmail: string,
): TeamMemberRow[] {
  const youRow = (uid: string): TeamMemberRow => ({
    user_id: uid,
    email: viewerEmail,
    display_name: "You",
    role: "",
    member_since: "",
  });
  if (teamMembers.length === 0 && viewerUserId) {
    return [youRow(viewerUserId)];
  }
  if (!viewerUserId || teamMembers.some((m) => m.user_id === viewerUserId)) {
    return teamMembers;
  }
  return [youRow(viewerUserId), ...teamMembers];
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startOfDayAtNine(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0, 0);
}

export function AddEventInline({
  createEvent,
  defaultDate,
  defaultCalendarScope = "team",
  onClose,
  onCreated,
  teamMembers,
  viewerUserId,
  viewerEmail,
}: AddEventInlineProps) {
  const router = useRouter();
  const assigneeRows = useMemo(
    () => buildAssigneeRows(teamMembers, viewerUserId, viewerEmail),
    [teamMembers, viewerUserId, viewerEmail],
  );
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [calendarScope, setCalendarScope] = useState<CalendarScope>(defaultCalendarScope);
  const [assignedUserId, setAssignedUserId] = useState(() =>
    initialAssignedUserId(viewerUserId, assigneeRows),
  );

  const [startTime, setStartTime] = useState(() => toDatetimeLocalValue(startOfDayAtNine(defaultDate)));
  const [endTime, setEndTime] = useState(() =>
    toDatetimeLocalValue(new Date(startOfDayAtNine(defaultDate).getTime() + 60 * 60 * 1000)),
  );

  useEffect(() => {
    setAssignedUserId(initialAssignedUserId(viewerUserId, assigneeRows));
  }, [viewerUserId, assigneeRows]);

  useEffect(() => {
    if (calendarScope === "personal" && viewerUserId) {
      setAssignedUserId(viewerUserId);
    }
  }, [calendarScope, viewerUserId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    startTransition(async () => {
      setSaveError(null);
      try {
        const formData = new FormData();
        formData.set("title", trimmedTitle);
        formData.set("start_time", startTime);
        formData.set("end_time", endTime);
        formData.set("calendar_scope", calendarScope);
        formData.set("assigned_user_id", assignedUserId);
        const row = await createEvent(formData);
        onCreated?.(row);
        setTitle("");
        onClose();
        // Defer so parent `router.replace` for filter URL can run before RSC refresh (avoids stale `?u=` / flicker).
        setTimeout(() => {
          router.refresh();
        }, 0);
      } catch (err) {
        console.error("Failed to create event:", err);
        setSaveError(getUserFacingErrorMessage(err, "Could not save the event."));
      }
    });
  };

  return (
    <ModalScaffold open onBackdropClose={onClose} titleId="add-event-calendar-title">
      <div
        className="pointer-events-auto mx-auto box-border w-full min-w-0 max-w-[min(28rem,100%)] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[calc(0.75rem-1px)] p-4 sm:p-5">
          <h2 id="add-event-calendar-title" className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
            New event
          </h2>
          <form className="flex min-w-0 flex-col gap-3" onSubmit={handleSubmit}>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Calendar</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarScope("team")}
                  className={`inline-flex h-10 min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                    calendarScope === "team"
                      ? "border border-transparent bg-[var(--accent-strong)] text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)]"
                      : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  Team
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarScope("personal")}
                  className={`inline-flex h-10 min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                    calendarScope === "personal"
                      ? "border border-transparent bg-[var(--accent-strong)] text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)]"
                      : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  Personal
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                Team is shared with everyone signed in. Personal is only your private events.
              </p>
            </div>
            <Input
              autoFocus
              label="Event title"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="add-event-assigned-user" className="text-sm font-medium text-[var(--text-primary)]">
                Assign to
              </label>
              <select
                id="add-event-assigned-user"
                name="assigned_user_id"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                disabled={isPending || calendarScope === "personal"}
                className="h-11 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assigneeRows.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {assigneeLabel(m)}
                  </option>
                ))}
              </select>
              {calendarScope === "personal" ? (
                <p className="text-xs text-[var(--text-tertiary)]">Personal events are always yours.</p>
              ) : null}
            </div>
            <Input
              type="datetime-local"
              label="Start time"
              step={60}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              type="datetime-local"
              label="End time"
              step={60}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            {saveError ? (
              <p className="text-sm font-medium text-[var(--text-danger)]" role="alert">
                {saveError}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Adding..." : "Save Event"}
            </Button>
          </form>
        </div>
      </div>
    </ModalScaffold>
  );
}
