"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";

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
  viewerEmail: string;
  /** When false, activity history still shows but adding updates is hidden (e.g. Recently deleted). */
  allowAddUpdate?: boolean;
};

export function LeadUpdatesSection({
  initialUpdates,
  createLeadUpdate,
  viewerEmail,
  allowAddUpdate = true,
}: LeadUpdatesSectionProps) {
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
      author: viewerEmail,
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
    <div className="flex flex-col space-y-5">
      <p className="crm-section-label">Activity</p>

      {allowAddUpdate ? (
        <Card className="flex flex-col gap-3 border-[#d4e2fc] bg-[var(--surface-accent)]">
          <p className="crm-meta leading-snug">Add a note visible on this record.</p>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label htmlFor="lead-update" className="sr-only">
              Add update
            </label>
            <textarea
              id="lead-update"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What happened? (e.g. visited store, spoke to client...)"
              rows={4}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[var(--text-secondary)]/82 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa2e]"
            />
            <Button type="submit" className="w-full" disabled={isPending || !draft.trim()}>
              {isPending ? "Adding..." : "Save Update"}
            </Button>
            {showSaved ? <p className="crm-meta">Saved</p> : null}
          </form>
        </Card>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">Activity is read-only while this lead is in Recently deleted.</p>
      )}

      <section className="flex flex-col space-y-5 pb-2" aria-label="Activity history">
        {!updates.length ? (
          <div className="py-6 text-center text-sm text-[var(--text-secondary)]">
            <p>No updates yet. Log your first activity.</p>
          </div>
        ) : null}
        <SurfaceListShell className="transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          {updates.map((update, index) => (
            <div
              key={update.id}
              className={`border-b border-[var(--border)] border-l-[3px] border-l-[#cbd5e1] px-4 py-4 last:border-b-0 ${
                index === 0 ? "bg-[var(--surface-muted)]" : "bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3 pl-1">
                <div className="min-w-0 flex-1">
                  <p
                    className={`break-words text-sm font-semibold leading-snug [overflow-wrap:anywhere] ${
                      index === 0 ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]/95"
                    }`}
                  >
                    {update.content}
                  </p>
                  <p className="crm-meta mt-1">{update.author}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5 text-right">
                  <p className="crm-meta">{update.relativeTime}</p>
                  <p className="crm-meta text-[var(--text-tertiary)]">{update.fullTimestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </SurfaceListShell>
      </section>
    </div>
  );
}
