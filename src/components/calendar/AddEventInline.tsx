"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalScaffold } from "@/components/ui/ModalScaffold";
import type { CalendarEventRow } from "@/lib/calendarEventDisplay";
import { getUserFacingErrorMessage } from "@/lib/supabaseActionErrors";

type AddEventInlineProps = {
  createEvent: (formData: FormData) => Promise<CalendarEventRow>;
  defaultDate: Date;
  onClose: () => void;
  /** Merges the new row into the UI immediately (covers slow or flaky RSC refresh, e.g. installed PWA). */
  onCreated?: (row: CalendarEventRow) => void;
};

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startOfDayAtNine(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0, 0);
}

export function AddEventInline({ createEvent, defaultDate, onClose, onCreated }: AddEventInlineProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const [startTime, setStartTime] = useState(() => toDatetimeLocalValue(startOfDayAtNine(defaultDate)));
  const [endTime, setEndTime] = useState(() =>
    toDatetimeLocalValue(new Date(startOfDayAtNine(defaultDate).getTime() + 60 * 60 * 1000)),
  );

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
        const row = await createEvent(formData);
        onCreated?.(row);
        setTitle("");
        router.refresh();
        onClose();
      } catch (err) {
        console.error("Failed to create event:", err);
        setSaveError(getUserFacingErrorMessage(err, "Could not save the event."));
      }
    });
  };

  return (
    <ModalScaffold open onBackdropClose={onClose} titleId="add-event-calendar-title">
      <div
        className="pointer-events-auto mx-auto box-border w-full min-w-0 max-w-[min(28rem,100%)] max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-elevated)] sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
          <h2 id="add-event-calendar-title" className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
            New event
          </h2>
          <form className="flex min-w-0 flex-col gap-3" onSubmit={handleSubmit}>
            <Input
              autoFocus
              label="Event title"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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
    </ModalScaffold>
  );
}
