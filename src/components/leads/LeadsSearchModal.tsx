"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine, RiSearchLine } from "react-icons/ri";
import { ModalScaffold } from "@/components/ui/ModalScaffold";
import { formatLeadsListActivityLabel } from "@/lib/timezone";
import { filterLeadsBySearch, sortLeadsForDisplay } from "@/lib/leadsListClientQuery";
import type { LeadCardData } from "@/components/leads/leadCardTypes";

type LeadsSearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: LeadCardData[];
  onBeforeNavigate: (leadId: string) => void;
};

export function LeadsSearchModal({
  open,
  onOpenChange,
  leads,
  onBeforeNavigate,
}: LeadsSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const queryNorm = useMemo(() => query.trim().toLowerCase(), [query]);

  const results = useMemo(() => {
    const filtered = filterLeadsBySearch(leads, queryNorm);
    return sortLeadsForDisplay(filtered).map((lead) => ({
      ...lead,
      pstActivityLabel: formatLeadsListActivityLabel(lead.activityAt),
    }));
  }, [leads, queryNorm]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const openLead = useCallback(
    (leadId: string) => {
      onBeforeNavigate(leadId);
      onOpenChange(false);
      router.push(`/leads/${leadId}`);
    },
    [onBeforeNavigate, onOpenChange, router],
  );

  const titleId = "leads-search-modal-title";

  return (
    <ModalScaffold open={open} onBackdropClose={close} titleId={titleId}>
      <div
        className="pointer-events-auto mx-auto box-border flex w-full min-w-0 max-w-[min(26rem,100%)] flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] min-h-0 flex-col overflow-hidden rounded-[calc(0.75rem-1px)]">
          <div className="shrink-0 border-b border-[var(--border)] p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-lg font-semibold text-[var(--text-primary)] sm:text-xl">
                Search leads
              </h2>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={close}
                className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
              >
                <RiCloseLine className="h-5 w-5 shrink-0" aria-hidden />
              </button>
            </div>
            <div className="relative">
              <RiSearchLine
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]"
                aria-hidden
              />
              <label htmlFor="leads-modal-search-input" className="sr-only">
                Search by name, business, or notes
              </label>
              <input
                ref={inputRef}
                id="leads-modal-search-input"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, business, address, notes…"
                className="box-border h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] py-2 pl-10 pr-10 text-[0.9375rem] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)]/75 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-inset focus:ring-[#2460fa1f]"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 touch-manipulation items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                >
                  <RiCloseLine className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3 pt-1 sm:px-3 sm:pb-4">
            {!queryNorm ? (
              <p className="px-2 py-6 text-center text-sm text-[var(--text-secondary)]">
                Type to find a lead, then tap to open.
              </p>
            ) : results.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-[var(--text-secondary)]">
                No leads match &ldquo;{query.trim()}&rdquo;.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5 p-1" role="listbox" aria-label="Matching leads">
                {results.map((lead) => (
                  <li key={lead.id}>
                    <button
                      type="button"
                      role="option"
                      onClick={() => openLead(lead.id)}
                      className="flex w-full min-w-0 flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-3 text-left transition-colors hover:border-[var(--accent-strong)]/40 hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                    >
                      <div className="flex min-w-0 items-baseline justify-between gap-2">
                        <span className="min-w-0 truncate text-base font-semibold text-[var(--text-primary)]">
                          {lead.name}
                        </span>
                        <span
                          className={`shrink-0 text-xs font-medium ${lead.type === "client" ? "chip-client" : "chip-lead"}`}
                        >
                          {lead.type === "client" ? "Client" : "Lead"}
                        </span>
                      </div>
                      {lead.business ? (
                        <span className="line-clamp-1 text-sm text-[var(--text-secondary)] [overflow-wrap:anywhere]">
                          {lead.business}
                        </span>
                      ) : null}
                      <span className="line-clamp-2 text-xs text-[var(--text-secondary)] [overflow-wrap:anywhere]">
                        {lead.update}
                      </span>
                      <time
                        dateTime={lead.activityAt}
                        suppressHydrationWarning
                        className="text-xs text-[var(--text-tertiary)]"
                      >
                        {lead.pstActivityLabel}
                      </time>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ModalScaffold>
  );
}
