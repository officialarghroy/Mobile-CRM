"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { deleteCalendarEvent } from "@/app/calendar/actions";
import { Button } from "@/components/ui/Button";
import { getUserFacingErrorMessage } from "@/lib/supabaseActionErrors";

type DeleteCalendarEventButtonProps = {
  eventId: string;
  /** `list`: Events list row with label. `icon`: compact control for calendar cells and unscheduled items. */
  layout?: "list" | "icon";
};

export function DeleteCalendarEventButton({ eventId, layout = "list" }: DeleteCalendarEventButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const runDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCalendarEvent(eventId, new FormData());
        router.refresh();
      } catch (err) {
        setError(getUserFacingErrorMessage(err, "Could not delete."));
      }
    });
  };

  if (layout === "icon") {
    return (
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {error ? (
          <p
            className="max-w-[9.5rem] text-right text-[0.625rem] font-medium leading-snug text-[var(--text-danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={pending}
          aria-label={pending ? "Deleting event" : "Delete event"}
          title="Delete"
          onClick={runDelete}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RiDeleteBinLine className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-stretch justify-center border-l border-[var(--border)] px-2 py-2">
      {error ? (
        <p className="mb-1 max-w-[9rem] text-right text-[0.6875rem] font-medium leading-snug text-[var(--text-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="h-9 min-h-9 rounded-full px-3 text-sm text-[var(--text-secondary)]"
        disabled={pending}
        onClick={runDelete}
      >
        {pending ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}
