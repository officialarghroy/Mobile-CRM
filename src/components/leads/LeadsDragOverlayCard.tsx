"use client";

import type { LeadCardData, LeadStatus } from "./leadCardTypes";

type LeadsDragOverlayCardProps = {
  lead: LeadCardData & { pstActivityLabel: string };
  statusDotClass: string;
  statusTitle: string;
  typeLabel: string;
};

/** Static preview shown in DragOverlay (not a sortable item). */
export function LeadsDragOverlayCard({ lead, statusDotClass, statusTitle, typeLabel }: LeadsDragOverlayCardProps) {
  return (
    <div
      className="pointer-events-none flex max-w-[min(26rem,100%)] cursor-grabbing flex-col gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 shadow-[var(--shadow-elevated)] ring-2 ring-[var(--accent-strong)]/20"
      style={{ touchAction: "none" }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`} title={statusTitle} aria-hidden />
          <span className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--text-primary)]">{lead.name}</span>
        </div>
        <time
          dateTime={lead.activityAt}
          suppressHydrationWarning
          className="shrink-0 text-xs text-[var(--text-secondary)]"
        >
          {lead.pstActivityLabel}
        </time>
      </div>
      {lead.business ? (
        <p className="text-sm text-[var(--text-secondary)] [overflow-wrap:anywhere]">{lead.business}</p>
      ) : null}
      {lead.address ? (
        <p className="text-xs text-[var(--text-secondary)] [overflow-wrap:anywhere]">{lead.address}</p>
      ) : null}
      <p className="text-sm leading-snug text-[var(--text-secondary)] line-clamp-2 [overflow-wrap:anywhere]">
        {lead.update}
      </p>
      <div className="flex items-center gap-2 border-t border-[var(--border)]/50 pt-2">
        <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text-primary)]">
          {STATUS_SNIPPET[lead.status ?? "pending"]}
        </span>
        <span className={`shrink-0 ${lead.type === "client" ? "chip-client" : "chip-lead"}`}>{typeLabel}</span>
      </div>
    </div>
  );
}

const STATUS_SNIPPET: Record<LeadStatus, string> = {
  pending: "Pending",
  urgent: "Urgent",
  order_parts: "Order parts",
  parts_ordered: "Parts ordered",
  not_paid: "Not paid",
  completed: "Completed",
};
