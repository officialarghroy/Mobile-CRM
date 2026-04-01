"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AddEventInlineProps = {
  createEvent: (formData: FormData) => Promise<void>;
  defaultDate: Date;
  onClose: () => void;
};

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startOfDayAtNine(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0, 0);
}

export function AddEventInline({ createEvent, defaultDate, onClose }: AddEventInlineProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const [startTime, setStartTime] = useState(() => toDatetimeLocalValue(startOfDayAtNine(defaultDate)));
  const [endTime, setEndTime] = useState(() =>
    toDatetimeLocalValue(new Date(startOfDayAtNine(defaultDate).getTime() + 60 * 60 * 1000)),
  );

  useEffect(() => {
    setStartTime(toDatetimeLocalValue(startOfDayAtNine(defaultDate)));
    setEndTime(toDatetimeLocalValue(new Date(startOfDayAtNine(defaultDate).getTime() + 60 * 60 * 1000)));
    setTitle("");
  }, [defaultDate]);

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
      try {
        const formData = new FormData();
        formData.set("title", trimmedTitle);
        formData.set("start_time", startTime);
        formData.set("end_time", endTime);
        await createEvent(formData);
        setTitle("");
        onClose();
        router.refresh();
      } catch (err) {
        console.error("Failed to create event:", err);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="add-event-calendar-title">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-5">
        <div
          className="pointer-events-auto w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-elevated)]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="add-event-calendar-title" className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
            New event
          </h2>
          <form className="flex flex-col gap-3 overflow-visible" onSubmit={handleSubmit}>
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
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              type="datetime-local"
              label="End time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Adding..." : "Save Event"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
