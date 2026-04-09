"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RiCheckLine } from "react-icons/ri";
import { setTaskCompleted } from "@/app/tasks/actions";
import { getUserFacingErrorMessage } from "@/lib/supabaseActionErrors";

type TaskCompleteControlProps = {
  eventId: string;
  completed: boolean;
  disabled?: boolean;
};

/**
 * Small ring when pending; solid green circle with white check when done.
 */
export function TaskCompleteControl({ eventId, completed, disabled = false }: TaskCompleteControlProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState(completed);
  const busy = pending || disabled;

  useEffect(() => {
    setChecked(completed);
  }, [completed]);

  const toggle = () => {
    if (busy) return;
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      try {
        await setTaskCompleted(eventId, next);
        router.refresh();
      } catch (err) {
        console.error("setTaskCompleted:", err);
        setChecked(!next);
        alert(getUserFacingErrorMessage(err, "Could not update this task."));
      }
    });
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      aria-pressed={checked}
      aria-label={checked ? "Mark as not done" : "Mark as done"}
      className={[
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        "touch-manipulation outline-none transition-opacity",
        "focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
        busy ? "cursor-wait opacity-50" : "hover:opacity-90 active:opacity-80",
      ].join(" ")}
    >
      <span
        className={[
          "flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] bg-transparent transition-colors",
          checked
            ? "border-transparent bg-[var(--success)] shadow-[0_1px_2px_rgba(5,150,105,0.35)]"
            : "border-[var(--text-tertiary)]/55",
        ].join(" ")}
        aria-hidden
      >
        {checked ? (
          <RiCheckLine className="size-3 text-white drop-shadow-[0_0.5px_0_rgba(0,0,0,0.12)]" strokeWidth={3.5} />
        ) : null}
      </span>
      <span className="sr-only">{checked ? "Completed" : "Not done"}</span>
    </button>
  );
}
