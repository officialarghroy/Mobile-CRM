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
        className="w-full resize-none rounded-xl border border-[var(--border)] bg-transparent p-4 text-[0.95rem] text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[var(--text-secondary)]/90 focus:border-[var(--accent)]"
      />
      <button
        type="submit"
        className="h-11 w-full rounded-xl bg-[var(--accent)] px-4 text-[0.95rem] font-medium text-white transition-transform duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
        disabled={isPending}
      >
        {isPending ? "Adding..." : "Add Update"}
      </button>
    </form>
  );
}
