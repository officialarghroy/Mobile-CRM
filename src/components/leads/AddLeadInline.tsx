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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Leads</h1>
        <Button className="h-9 px-3 text-sm" onClick={() => setIsOpen((prev) => !prev)}>
          Add
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-1.5">
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter lead name"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-transparent px-4 text-[0.95rem] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/90 focus:border-[var(--accent)] focus:outline-none"
            />
            <Button type="submit" className="h-11 px-4" disabled={isPending}>
              Save
            </Button>
          </form>
          {showSaved ? <p className="text-xs text-[var(--text-secondary)]">Saved</p> : null}
        </div>
      ) : null}
    </div>
  );
}
