"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine } from "react-icons/ri";
import { deleteCalendarEvent } from "@/app/calendar/actions";
import { Button } from "@/components/ui/Button";
import { ModalScaffold } from "@/components/ui/ModalScaffold";
import { getUserFacingErrorMessage } from "@/lib/supabaseActionErrors";
import type { CalendarScope } from "@/lib/calendarEventDisplay";

const CONFIRM_TITLE_ID = "delete-calendar-event-confirm-title";

type DeleteCalendarEventButtonProps = {
  eventId: string;
  eventTitle: string;
  /** `list`: Events list row with label. `icon`: compact control for calendar cells and unscheduled items. */
  layout?: "list" | "icon";
  calendarScope?: CalendarScope;
};

export function DeleteCalendarEventButton({
  eventId,
  eventTitle,
  layout = "list",
  calendarScope = "team",
}: DeleteCalendarEventButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const closeModal = () => {
    if (pending) return;
    setConfirmOpen(false);
    setError(null);
  };

  useEffect(() => {
    if (!confirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || pending) return;
      setConfirmOpen(false);
      setError(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen, pending]);

  const openModal = () => {
    setError(null);
    setConfirmOpen(true);
  };

  const runDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCalendarEvent(eventId, new FormData());
        setConfirmOpen(false);
        router.refresh();
      } catch (err) {
        setError(getUserFacingErrorMessage(err, "Could not delete."));
      }
    });
  };

  const displayTitle = eventTitle.trim() || "Untitled event";

  const modal = (
    <ModalScaffold open={confirmOpen} onBackdropClose={closeModal} titleId={CONFIRM_TITLE_ID}>
      <div
        className="pointer-events-auto mx-auto box-border w-full min-w-0 max-w-[min(28rem,100%)] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[calc(0.75rem-1px)] p-4 sm:p-5">
          <h2 id={CONFIRM_TITLE_ID} className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
            Delete this event?
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            {calendarScope === "personal"
              ? "This removes your personal event. You cannot undo it."
              : "This removes the event for everyone on the team. You cannot undo it."}
          </p>
          <p className="mb-4 text-sm font-medium text-[var(--text-primary)]">
            Event
            <span className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-[0.9375rem] font-normal [overflow-wrap:anywhere] text-[var(--text-primary)]">
              {displayTitle}
            </span>
          </p>
          {error ? (
            <p className="mb-4 text-sm font-medium text-[var(--text-danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" className="w-full sm:w-auto" disabled={pending} onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full gap-2 border-0 bg-red-600 text-white shadow-[0_4px_14px_rgba(220,38,38,0.35)] hover:bg-red-700 hover:brightness-100 focus-visible:ring-red-500 sm:w-auto"
              disabled={pending}
              onClick={runDelete}
            >
              <RiDeleteBinLine className="size-4 shrink-0" aria-hidden />
              {pending ? "Deleting…" : "Delete event"}
            </Button>
          </div>
        </div>
      </div>
    </ModalScaffold>
  );

  if (layout === "icon") {
    return (
      <>
        {modal}
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <button
            type="button"
            disabled={pending}
            aria-label="Delete event"
            aria-haspopup="dialog"
            aria-expanded={confirmOpen}
            title="Delete"
            onClick={openModal}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RiDeleteBinLine className="size-4" aria-hidden />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {modal}
      <div className="flex shrink-0 flex-col items-stretch justify-center border-l border-[var(--border)] px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          className="h-9 min-h-9 rounded-full px-3 text-sm text-[var(--text-secondary)]"
          disabled={pending}
          aria-haspopup="dialog"
          aria-expanded={confirmOpen}
          onClick={openModal}
        >
          Delete
        </Button>
      </div>
    </>
  );
}
