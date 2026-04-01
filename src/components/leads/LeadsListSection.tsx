"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type LeadFilter = "all" | "lead" | "client";

type LeadCardData = {
  id: string;
  name: string;
  business: string;
  address: string;
  type: "lead" | "client";
  update: string;
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
    <section className="space-y-3" aria-label="Leads list">
      <div className="flex flex-wrap items-center gap-0.5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-0.5 shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-[var(--radius-control)] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors ${
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
          className={`rounded-[var(--radius-control)] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors ${
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
          className={`rounded-[var(--radius-control)] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors ${
            filter === "client"
              ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          Clients
        </button>
      </div>

      {!filteredLeads.length ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-[0.8125rem] text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
          <p>{leads.length ? "No entries match this filter" : "No leads yet - add your first lead"}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          {filteredLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              prefetch
              className={`block border-b border-[var(--border)] px-3 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)] focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-inset ${
                lead.type === "client"
                  ? "border-l-[3px] border-l-[var(--accent-strong)]"
                  : "border-l-[3px] border-l-[#cbd5e1]"
              }`}
            >
              <div className="flex items-start justify-between gap-4 pl-1">
                <div className="min-w-0 flex-1">
                  <p className="text-card-title truncate">{lead.name}</p>
                  {lead.business ? (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{lead.business}</p>
                  ) : null}
                  {lead.address ? (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{lead.address}</p>
                  ) : null}
                  <p className="text-card-meta mt-1 line-clamp-2">{lead.update}</p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5 text-right">
                  <span className={lead.type === "client" ? "chip-client" : "chip-lead"}>
                    {TYPE_DISPLAY[lead.type]}
                  </span>
                  <p className="text-[0.75rem] font-medium text-[var(--text-tertiary)]">{lead.timestamp}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
