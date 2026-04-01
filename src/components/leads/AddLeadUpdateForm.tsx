"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AddLeadUpdateFormProps = {
  createLeadUpdate: (formData: FormData) => Promise<void>;
};

export function AddLeadUpdateForm({ createLeadUpdate }: AddLeadUpdateFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft("");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", content);
      await createLeadUpdate(formData);
      router.refresh();
    });
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label htmlFor="lead-update" className="sr-only">
        Add update
      </label>
      <textarea
        id="lead-update"
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Add an update..."
        rows={4}
        className="w-full resize-none rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-[0.875rem] text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[var(--text-secondary)]/82 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f]"
      />
      <button
        type="submit"
        className="h-10 w-full rounded-[var(--radius-card)] bg-[var(--accent)] px-4 text-[0.875rem] font-semibold text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)] transition-transform duration-150 hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
        disabled={isPending}
      >
        {isPending ? "Adding..." : "Add Update"}
      </button>
    </form>
  );
}
