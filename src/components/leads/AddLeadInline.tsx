"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type AddLeadInlineProps = {
  createLead: (formData: FormData) => Promise<void>;
};

export function AddLeadInline({ createLead }: AddLeadInlineProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!showSaved) return;
    const timer = window.setTimeout(() => setShowSaved(false), 1500);
    return () => window.clearTimeout(timer);
  }, [showSaved]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("name", trimmedName);
        await createLead(formData);
        setName("");
        setIsOpen(false);
        setShowSaved(true);
        router.refresh();
      } catch (error) {
        console.error("Failed to create lead:", error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h1 className="text-title min-w-0 shrink truncate">Leads</h1>
        <Button className="h-10 min-h-10 min-w-[4.25rem] shrink-0 px-4 text-[0.875rem]" onClick={() => setIsOpen((prev) => !prev)}>
          Add
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-2">
          <form className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center" onSubmit={handleSubmit}>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter lead name"
              className="h-11 min-h-11 w-full min-w-0 flex-1 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/80 focus:border-[var(--accent-strong)] focus:outline-none focus:ring-2 focus:ring-[#2460fa1f]"
            />
            <Button type="submit" className="h-10 w-full shrink-0 px-4 sm:w-auto" disabled={isPending}>
              Save
            </Button>
          </form>
          {showSaved ? <p className="text-xs text-[var(--text-secondary)]">Saved</p> : null}
        </div>
      ) : null}
    </div>
  );
}
