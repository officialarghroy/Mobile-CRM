"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine } from "react-icons/ri";
import { createCalendarEvent } from "@/app/calendar/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalScaffold } from "@/components/ui/ModalScaffold";
import type { CalendarEventRow } from "@/lib/calendarEventDisplay";
import { getUserFacingErrorMessage } from "@/lib/supabaseActionErrors";
import type { TeamMemberRow } from "@/lib/teamAccess";

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startOfDayAtNine(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0, 0);
}

function assigneeLabel(m: TeamMemberRow): string {
  const d = m.display_name?.trim();
  if (d && d !== "—") return d;
  return m.email?.trim() || "Team member";
}

function initialAssignedUserId(viewerUserId: string | null, rows: TeamMemberRow[]): string {
  if (viewerUserId && rows.some((m) => m.user_id === viewerUserId)) return viewerUserId;
  if (rows[0]?.user_id) return rows[0].user_id;
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

export type CreateCalendarEventAction = (formData: FormData) => Promise<CalendarEventRow>;

type AddEventFromLeadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  teamMembers: TeamMemberRow[];
  viewerUserId: string | null;
  viewerEmail: string;
  createEvent?: CreateCalendarEventAction;
};

export function AddEventFromLeadModal({
  open,
  onOpenChange,
  leadId,
  leadName,
  teamMembers,
  viewerUserId,
  viewerEmail,
  createEvent = createCalendarEvent,
}: AddEventFromLeadModalProps) {
  const router = useRouter();
  const assigneeRows = useMemo(
    () => buildAssigneeRows(teamMembers, viewerUserId, viewerEmail),
    [teamMembers, viewerUserId, viewerEmail],
  );
  const [title, setTitle] = useState(leadName);
  const [startTime, setStartTime] = useState(() =>
    toDatetimeLocalValue(startOfDayAtNine(new Date())),
  );
  const [endTime, setEndTime] = useState(() =>
    toDatetimeLocalValue(new Date(startOfDayAtNine(new Date()).getTime() + 60 * 60 * 1000)),
  );
  const [assignedUserId, setAssignedUserId] = useState(() =>
    initialAssignedUserId(viewerUserId, assigneeRows),
  );
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    setTitle(leadName);
    const now = new Date();
    const nine = startOfDayAtNine(now);
    setStartTime(toDatetimeLocalValue(nine));
    setEndTime(toDatetimeLocalValue(new Date(nine.getTime() + 60 * 60 * 1000)));
    setAssignedUserId(initialAssignedUserId(viewerUserId, assigneeRows));
  }, [open, leadName, viewerUserId, assigneeRows]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const close = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    startTransition(async () => {
      setSaveError(null);
      try {
        const formData = new FormData(event.currentTarget);
        formData.set("title", trimmedTitle);
        formData.set("start_time", startTime);
        formData.set("end_time", endTime);
        formData.set("calendar_scope", "team");
        formData.set("assigned_user_id", assignedUserId);
        await createEvent(formData);
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        console.error("Failed to create event from lead:", err);
        setSaveError(getUserFacingErrorMessage(err, "Could not save the event."));
      }
    });
  };

  return (
    <ModalScaffold open={open} onBackdropClose={close} titleId="add-event-from-lead-title">
      <div
        className="pointer-events-auto mx-auto box-border w-full min-w-0 max-w-[min(28rem,100%)] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[calc(0.75rem-1px)] p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 id="add-event-from-lead-title" className="text-xl font-semibold text-[var(--text-primary)]">
              Schedule event
            </h2>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={close}
              disabled={isPending}
              className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <RiCloseLine className="h-5 w-5 shrink-0" aria-hidden />
            </button>
          </div>
          <form className="flex min-w-0 flex-col gap-3" onSubmit={handleSubmit}>
            <input type="hidden" name="lead_id" value={leadId} readOnly aria-hidden />
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
              disabled={isPending}
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="lead-event-assigned-user" className="text-sm font-medium text-[var(--text-primary)]">
                Assign to
              </label>
              <select
                id="lead-event-assigned-user"
                name="assigned_user_id"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                disabled={isPending}
                className="h-11 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assigneeRows.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {assigneeLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <Input
              type="datetime-local"
              label="Start time"
              step={60}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isPending}
            />
            <Input
              type="datetime-local"
              label="End time"
              step={60}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isPending}
            />
            {saveError ? (
              <p className="text-sm font-medium text-[var(--text-danger)]" role="alert">
                {saveError}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving…" : "Save to calendar"}
            </Button>
          </form>
        </div>
      </div>
    </ModalScaffold>
  );
}
