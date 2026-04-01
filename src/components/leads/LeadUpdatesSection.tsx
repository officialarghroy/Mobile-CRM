"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

export type UpdateCardData = {
  id: string;
  content: string;
  relativeTime: string;
  fullTimestamp: string;
  author: string;
};

type LeadUpdatesSectionProps = {
  initialUpdates: UpdateCardData[];
  createLeadUpdate: (formData: FormData) => Promise<void>;
  currentUser: string;
};

export function LeadUpdatesSection({ initialUpdates, createLeadUpdate, currentUser }: LeadUpdatesSectionProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [updates, setUpdates] = useState<UpdateCardData[]>(initialUpdates);
  const [showSaved, setShowSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setUpdates(initialUpdates);
  }, [initialUpdates]);

  useEffect(() => {
    if (!showSaved) return;
    const timer = window.setTimeout(() => setShowSaved(false), 1500);
    return () => window.clearTimeout(timer);
  }, [showSaved]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setDraft("");

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticUpdate: UpdateCardData = {
      id: optimisticId,
      content,
      relativeTime: "Just now",
      fullTimestamp: new Date().toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      author: currentUser,
    };

    setUpdates((prev) => [optimisticUpdate, ...prev]);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("content", content);
        await createLeadUpdate(formData);
        setShowSaved(true);
        router.refresh();
      } catch (error) {
        console.error("Failed to create lead update:", error);
        setDraft(content);
        setUpdates((prev) => prev.filter((update) => update.id !== optimisticId));
      }
    });
  };

  return (
    <>
      <p className="crm-section-label">Activity</p>
      <Card className="space-y-3 border-[#d4e2fc] bg-[var(--surface-accent)] shadow-[var(--shadow-card)]">
        <div className="space-y-0.5">
          <p className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">Log activity</p>
          <p className="text-[0.6875rem] leading-snug text-[var(--text-secondary)]">Add a note visible on this record.</p>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label htmlFor="lead-update" className="sr-only">
            Add update
          </label>
          <textarea
            id="lead-update"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="What happened? (e.g. visited store, spoke to client...)"
            rows={4}
            className="w-full resize-none rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-[0.875rem] text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[var(--text-secondary)]/82 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa2e]"
          />
          <button
            type="submit"
            className="h-10 w-full rounded-[var(--radius-card)] bg-[var(--accent)] px-4 text-[0.875rem] font-semibold text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)] transition-transform duration-150 hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
            disabled={isPending || !draft.trim()}
          >
            {isPending ? "Adding..." : "Save Update"}
          </button>
          {showSaved ? <p className="text-xs text-[var(--text-secondary)]">Saved</p> : null}
        </form>
      </Card>

      <div className="my-4 h-px bg-[var(--border)]" />

      <section className="space-y-4 pb-6" aria-label="Activity history">
        <div className="space-y-0.5">
          <h2 className="text-[1rem] font-semibold leading-tight tracking-tight text-[var(--text-primary)]">History</h2>
          <p className="text-[0.6875rem] text-[var(--text-secondary)]">Newest first</p>
        </div>
        {!updates.length ? (
          <div className="py-6 text-center text-[0.8125rem] text-[var(--text-secondary)]">
            <p>No updates yet. Log your first activity.</p>
          </div>
        ) : null}
        {updates.length > 0 ? <p className="crm-section-label mb-2">Latest activity</p> : null}
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          {updates.map((update, index) => (
            <div
              key={update.id}
              className={`border-b border-[var(--border)] border-l-[3px] border-l-[#cbd5e1] px-3 py-3.5 last:border-b-0 ${
                index === 0 ? "bg-[var(--surface-muted)]" : "bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3 pl-1">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[0.875rem] font-semibold leading-snug ${
                      index === 0 ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]/95"
                    }`}
                  >
                    {update.content}
                  </p>
                  <p className="mt-1 text-[0.6875rem] text-[var(--text-secondary)]">{update.author}</p>
                </div>
                <div className="shrink-0 pt-0.5 text-right">
                  <p className="text-[0.6875rem] text-[var(--text-secondary)]">{update.relativeTime}</p>
                  <p className="mt-1 text-[0.625rem] text-[var(--text-tertiary)]">{update.fullTimestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
