"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCalendarEvent } from "@/app/calendar/actions";
import { Button } from "@/components/ui/Button";
import { getUserFacingErrorMessage } from "@/lib/supabaseActionErrors";

type DeleteCalendarEventButtonProps = {
  eventId: string;
};

export function DeleteCalendarEventButton({ eventId }: DeleteCalendarEventButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await deleteCalendarEvent(eventId, new FormData());
              router.refresh();
            } catch (err) {
              setError(getUserFacingErrorMessage(err, "Could not delete."));
            }
          });
        }}
      >
        {pending ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}
