"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type LeadFilter = "all" | "lead" | "client";

/** Matches lead rows from `/leads` (includes business + address for CRM detail). */
type LeadCardData = {
  id: string;
  name: string;
  business: string;
  address: string;
  type: "lead" | "client";
  update: string;
  activityAt: string;
  timestamp: string;
};

type LeadsListSectionProps = {
  leads: LeadCardData[];
};

const TYPE_DISPLAY: Record<LeadCardData["type"], string> = {
  lead: "Lead",
  client: "Client",
};

export function LeadsListSection({ leads }: LeadsListSectionProps) {
  const [filter, setFilter] = useState<LeadFilter>("all");

  const filteredLeads = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((lead) => lead.type === filter);
  }, [filter, leads]);

  return (
    <section className="flex flex-col space-y-4" aria-label="Leads list">
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("lead")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === "lead"
                ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Leads
          </button>
          <button
            type="button"
            onClick={() => setFilter("client")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === "client"
                ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Clients
          </button>
        </div>
      </div>

      {!filteredLeads.length ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          <p>{leads.length ? "No entries match this filter" : "No leads yet - add your first lead"}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          {filteredLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              prefetch
              className={`block border-b border-[var(--border)] px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)] focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-inset ${
                lead.type === "client"
                  ? "border-l-[3px] border-l-[var(--accent-strong)]"
                  : "border-l-[3px] border-l-[#cbd5e1]"
              }`}
            >
              <div className="flex flex-col gap-2 pl-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-base font-medium text-[var(--text-primary)]">{lead.name}</p>
                  <span className={`shrink-0 ${lead.type === "client" ? "chip-client" : "chip-lead"}`}>
                    {TYPE_DISPLAY[lead.type]}
                  </span>
                </div>

                {(lead.business || lead.address) ? (
                  <div className="flex flex-col gap-1">
                    {lead.business ? (
                      <p className="text-sm text-[var(--text-secondary)]">{lead.business}</p>
                    ) : null}
                    {lead.address ? <p className="crm-meta">{lead.address}</p> : null}
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 line-clamp-2 text-sm text-[var(--text-secondary)]">{lead.update}</p>
                  <time
                    dateTime={lead.activityAt}
                    suppressHydrationWarning
                    className="crm-meta shrink-0 pt-0.5 text-right font-medium text-[var(--text-tertiary)]"
                  >
                    {lead.timestamp}
                  </time>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
