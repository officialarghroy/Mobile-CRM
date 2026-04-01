"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AddEventInlineProps = {
  createEvent: (formData: FormData) => Promise<void>;
};

export function AddEventInline({ createEvent }: AddEventInlineProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!showSaved) return;
    const timer = window.setTimeout(() => setShowSaved(false), 1500);
    return () => window.clearTimeout(timer);
  }, [showSaved]);

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
        setStartTime("");
        setEndTime("");
        setIsOpen(false);
        setShowSaved(true);
        router.refresh();
      } catch (error) {
        console.error("Failed to create event:", error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h1 className="text-title min-w-0 shrink truncate">Calendar</h1>
        <Button className="h-10 min-h-10 min-w-[4.25rem] shrink-0 px-4 text-[0.875rem]" onClick={() => setIsOpen((prev) => !prev)}>
          Add
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-2 overflow-visible">
          <form className="space-y-3 overflow-visible" onSubmit={handleSubmit}>
            <Input autoFocus placeholder="Event title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Input
              type="datetime-local"
              label="Start time"
              placeholder="Start time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
            <Input
              type="datetime-local"
              label="End time"
              placeholder="End time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
            <Button type="submit" className="h-10 w-full text-[0.875rem]" disabled={isPending}>
              {isPending ? "Adding..." : "Save Event"}
            </Button>
          </form>
          {showSaved ? <p className="text-xs text-[var(--text-secondary)]">Saved</p> : null}
        </div>
      ) : null}
    </div>
  );
}
