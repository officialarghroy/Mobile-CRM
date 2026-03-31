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
      <Card className="space-y-3 p-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label htmlFor="lead-update" className="sr-only">
            Add update
          </label>
          <textarea
            id="lead-update"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="What happened? (e.g. visited store, spoke to client...)"
            rows={4}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-transparent p-4 text-[0.95rem] text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[var(--text-secondary)]/90 focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-[var(--accent)] px-4 text-[0.95rem] font-medium text-white transition-transform duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            disabled={isPending || !draft.trim()}
          >
            {isPending ? "Adding..." : "Save Update"}
          </button>
          {showSaved ? <p className="text-xs text-[var(--text-secondary)]">Saved</p> : null}
        </form>
      </Card>

      <div className="my-4 h-px bg-[var(--border)]" />

      <section className="space-y-4 pb-6" aria-label="Updates timeline">
        <div className="space-y-1">
          <h2 className="text-[1.12rem] font-semibold leading-tight text-[var(--text-primary)]">Updates Timeline</h2>
          <p className="text-xs text-[var(--text-secondary)]/88">Latest updates</p>
        </div>
        {!updates.length ? (
          <div className="py-6 text-center text-sm text-[var(--text-secondary)]">
            <p>No updates yet — log your first activity</p>
          </div>
        ) : null}
        <div className="space-y-4">
          {updates.map((update, index) => (
            <div key={update.id} className="space-y-1.5">
              {index === 0 ? <p className="text-xs font-medium text-[var(--text-secondary)]/88">Latest activity</p> : null}
              <Card
                className={`p-4 ${
                  index === 0 ? "border-[color:rgba(255,255,255,0.08)] bg-[color:rgba(255,255,255,0.03)]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[1.02rem] font-semibold leading-tight ${
                        index === 0 ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]/95"
                      }`}
                    >
                      {update.content}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]/62">{update.author}</p>
                  </div>
                  <div className="shrink-0 pt-0.5 text-right">
                    <p className="text-xs text-[var(--text-secondary)]/62">{update.relativeTime}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]/52">{update.fullTimestamp}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
