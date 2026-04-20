"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RiArrowDownSLine, RiSearchLine } from "react-icons/ri";
import {
  markLeadAsRead,
  updateLeadPriority,
  updateLeadStatus,
} from "@/app/leads/actions";
import { AddEventFromLeadModal } from "@/components/leads/AddEventFromLeadModal";
import { LeadsSearchModal } from "@/components/leads/LeadsSearchModal";
import { sortLeadsForDisplay } from "@/lib/leadsListClientQuery";
import { formatLeadsListActivityLabel } from "@/lib/timezone";
import type { TeamMemberRow } from "@/lib/teamAccess";
import type { LeadCardData, LeadStatus } from "./leadCardTypes";

export type { LeadCardData, LeadStatus } from "./leadCardTypes";

type LeadFilter = "all" | "lead" | "client" | "paid";

type LeadsListSectionProps = {
  leads: LeadCardData[];
  teamMembers: TeamMemberRow[];
  viewerUserId: string | null;
  viewerEmail: string;
};

const TYPE_DISPLAY: Record<LeadCardData["type"], string> = {
  lead: "Lead",
  client: "Client",
};

const READ_IDS_STORAGE_KEY = "crm-leads-marked-read";

function readIdsFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(READ_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota / private mode */
  }
}

function filterItemsForTab(items: LeadCardData[], filter: LeadFilter): LeadCardData[] {
  if (filter === "all") return items;
  if (filter === "paid") return items.filter((l) => l.status === "paid");
  return items.filter((l) => l.type === filter);
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "urgent", label: "Urgent" },
  { value: "paid", label: "Paid" },
  { value: "not_paid", label: "Not Paid" },
];

/** Minimal status indicator next to name (visual only). */
function getStatusDotClass(status: LeadStatus | undefined): string {
  switch (status) {
    case "pending":
      return "bg-yellow-500";
    case "urgent":
      return "bg-red-500";
    case "paid":
      return "bg-green-500";
    case "not_paid":
      return "bg-purple-500";
    default:
      return "bg-[var(--text-tertiary)]";
  }
}

function computeMoveUp(
  items: LeadCardData[],
  filter: LeadFilter,
  leadId: string,
): { next: LeadCardData[]; priorityUpdates: { id: string; priority: number }[] } | null {
  const filtered = filterItemsForTab(items, filter);
  const sorted = sortLeadsForDisplay(filtered);
  const idx = sorted.findIndex((l) => l.id === leadId);
  if (idx <= 0) return null;
  const above = sorted[idx - 1]!;
  const current = sorted[idx]!;
  const pa = above.priority_order ?? 0;
  const pb = current.priority_order ?? 0;
  let nextAbove = pb;
  let nextCurrent = pa;
  if (pa === pb) {
    nextCurrent = pa + 1;
    nextAbove = Math.max(0, pa - 1);
  }
  const next = items.map((row) => {
    if (row.id === above.id) return { ...row, priority_order: nextAbove };
    if (row.id === current.id) return { ...row, priority_order: nextCurrent };
    return row;
  });
  return {
    next,
    priorityUpdates: [
      { id: above.id, priority: nextAbove },
      { id: current.id, priority: nextCurrent },
    ],
  };
}

function computeMoveDown(
  items: LeadCardData[],
  filter: LeadFilter,
  leadId: string,
): { next: LeadCardData[]; priorityUpdates: { id: string; priority: number }[] } | null {
  const filtered = filterItemsForTab(items, filter);
  const sorted = sortLeadsForDisplay(filtered);
  const idx = sorted.findIndex((l) => l.id === leadId);
  if (idx < 0 || idx >= sorted.length - 1) return null;
  const current = sorted[idx]!;
  const below = sorted[idx + 1]!;
  const pa = current.priority_order ?? 0;
  const pb = below.priority_order ?? 0;
  let nextCurrent = pb;
  let nextBelow = pa;
  if (pa === pb) {
    nextBelow = pb + 1;
    nextCurrent = Math.max(0, pb - 1);
  }
  const next = items.map((row) => {
    if (row.id === current.id) return { ...row, priority_order: nextCurrent };
    if (row.id === below.id) return { ...row, priority_order: nextBelow };
    return row;
  });
  return {
    next,
    priorityUpdates: [
      { id: current.id, priority: nextCurrent },
      { id: below.id, priority: nextBelow },
    ],
  };
}

export function LeadsListSection({
  leads,
  teamMembers,
  viewerUserId,
  viewerEmail,
}: LeadsListSectionProps) {
  const [filter, setFilter] = useState<LeadFilter>("all");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [items, setItems] = useState<LeadCardData[]>(() => sortLeadsForDisplay(leads));
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  useEffect(() => {
    setItems(sortLeadsForDisplay(leads));
  }, [leads]);

  useEffect(() => {
    setReadIds(readIdsFromStorage());
  }, []);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistReadIds(next);
      return next;
    });
    void markLeadAsRead(id).catch(() => {
      /* optimistic UI kept; failure is non-fatal */
    });
  }, []);

  const moveUp = useCallback(
    (leadId: string) => {
      setItems((prev) => {
        const computed = computeMoveUp(prev, filter, leadId);
        if (!computed) return prev;
        const snapshot = prev;
        const { next, priorityUpdates } = computed;
        queueMicrotask(() => {
          void Promise.all(
            priorityUpdates.map(({ id, priority }) => updateLeadPriority(id, priority)),
          )
            .then((results) => {
              if (results.some((r) => !r.success)) {
                setItems(snapshot);
              }
            })
            .catch(() => {
              setItems(snapshot);
            });
        });
        return next;
      });
    },
    [filter],
  );

  const moveDown = useCallback(
    (leadId: string) => {
      setItems((prev) => {
        const computed = computeMoveDown(prev, filter, leadId);
        if (!computed) return prev;
        const snapshot = prev;
        const { next, priorityUpdates } = computed;
        queueMicrotask(() => {
          void Promise.all(
            priorityUpdates.map(({ id, priority }) => updateLeadPriority(id, priority)),
          )
            .then((results) => {
              if (results.some((r) => !r.success)) {
                setItems(snapshot);
              }
            })
            .catch(() => {
              setItems(snapshot);
            });
        });
        return next;
      });
    },
    [filter],
  );

  const changeLeadStatus = useCallback((leadId: string, newStatus: LeadStatus) => {
    setItems((prev) => {
      const snapshot = prev;
      const next = prev.map((row) => (row.id === leadId ? { ...row, status: newStatus } : row));
      queueMicrotask(() => {
        void updateLeadStatus(leadId, newStatus)
          .then((r) => {
            if (!r.success) setItems(snapshot);
          })
          .catch(() => {
            setItems(snapshot);
          });
      });
      return next;
    });
  }, []);

  const filteredLeads = useMemo(() => filterItemsForTab(items, filter), [filter, items]);

  const sortedForView = useMemo(() => sortLeadsForDisplay(filteredLeads), [filteredLeads]);

  const tabOrderForReorder = useMemo(() => sortLeadsForDisplay(filteredLeads), [filteredLeads]);

  const tabIndexById = useMemo(() => {
    const m = new Map<string, number>();
    tabOrderForReorder.forEach((l, i) => {
      m.set(l.id, i);
    });
    return m;
  }, [tabOrderForReorder]);

  const rowsWithPstLabel = useMemo(
    () =>
      sortedForView.map((lead) => ({
        ...lead,
        pstActivityLabel: formatLeadsListActivityLabel(lead.activityAt),
      })),
    [sortedForView],
  );

  const effectiveIsRead = useCallback(
    (lead: LeadCardData) => readIds.has(lead.id) || Boolean(lead.is_read),
    [readIds],
  );

  const emptyMessage = (() => {
    if (!leads.length) return "No leads yet - add your first lead";
    if (filter === "paid") return "No paid leads";
    return "No entries match this filter";
  })();

  return (
    <section className="flex flex-col space-y-4" aria-label="Leads list">
      <div className="flex w-full min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-0 max-w-full flex-nowrap gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === "client"
                ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => setFilter("paid")}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === "paid"
                ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            Paid
          </button>
          </div>
        </div>

        <div className="ml-auto shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          <button
            type="button"
            aria-label="Search leads"
            aria-haspopup="dialog"
            aria-expanded={searchModalOpen}
            onClick={() => setSearchModalOpen(true)}
            className="flex touch-manipulation items-center justify-center rounded-lg px-2.5 py-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
          >
            <RiSearchLine className="h-5 w-5 shrink-0" aria-hidden />
          </button>
        </div>
      </div>

      <LeadsSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        leads={items}
        onBeforeNavigate={markAsRead}
      />

      {!rowsWithPstLabel.length ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rowsWithPstLabel.map((lead) => {
            const status = lead.status ?? "pending";
            const unread = !effectiveIsRead(lead);
            const tabIdx = tabIndexById.get(lead.id);
            const canMoveUp = tabIdx !== undefined && tabIdx > 0;
            const canMoveDown =
              tabIdx !== undefined && tabIdx < tabOrderForReorder.length - 1;

            return (
              <div
                key={lead.id}
                className={`flex flex-col gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 shadow-sm ${
                  unread ? "ring-1 ring-blue-100" : ""
                }`}
              >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="flex shrink-0 items-center gap-0.5" aria-hidden>
                        {unread ? (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-[#2563eb]"
                            title="Unread"
                          />
                        ) : null}
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${getStatusDotClass(status)}`}
                          title={STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Status"}
                        />
                      </span>
                      <Link
                        href={`/leads/${lead.id}`}
                        prefetch
                        onClick={() => markAsRead(lead.id)}
                        className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--text-primary)] no-underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                      >
                        {lead.name}
                      </Link>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      {unread ? (
                        <>
                          <span className="text-xs font-medium text-[var(--accent-strong)]">Unread</span>
                          <span className="select-none text-xs text-[var(--text-tertiary)]" aria-hidden>
                            ·
                          </span>
                        </>
                      ) : null}
                      <time
                        dateTime={lead.activityAt}
                        suppressHydrationWarning
                        className="text-xs text-[var(--text-secondary)]"
                      >
                        {lead.pstActivityLabel}
                      </time>
                    </div>
                  </div>

                  <Link
                    href={`/leads/${lead.id}`}
                    prefetch
                    onClick={() => markAsRead(lead.id)}
                    className="flex min-w-0 flex-col gap-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
                  >
                    {lead.business ? (
                      <p className="text-sm text-[var(--text-secondary)] [overflow-wrap:anywhere]">{lead.business}</p>
                    ) : null}
                    {lead.address ? (
                      <p className="text-xs text-[var(--text-secondary)] [overflow-wrap:anywhere]">{lead.address}</p>
                    ) : null}
                    <p className="text-sm leading-snug text-[var(--text-secondary)] line-clamp-2 [overflow-wrap:anywhere]">
                      {lead.update}
                    </p>
                  </Link>

                  <div className="flex items-center justify-between gap-2 border-t border-[var(--border)]/50 pt-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div
                        className="min-w-0 shrink"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <label htmlFor={`lead-status-${lead.id}`} className="sr-only">
                          Status
                        </label>
                        <div className="relative inline-flex max-w-full min-w-0 items-center">
                          <select
                            id={`lead-status-${lead.id}`}
                            value={status}
                            onChange={(e) => {
                              const v = e.target.value as LeadStatus;
                              if (STATUS_OPTIONS.some((o) => o.value === v)) {
                                changeLeadStatus(lead.id, v);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="min-w-0 max-w-full w-auto cursor-pointer appearance-none rounded-full border border-[var(--border)] bg-[var(--surface-muted)] py-1 pl-2 pr-5 text-xs text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] [field-sizing:content]"
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <RiArrowDownSLine
                            className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]"
                            aria-hidden
                          />
                        </div>
                      </div>
                      <span className={`shrink-0 ${lead.type === "client" ? "chip-client" : "chip-lead"}`}>
                        {TYPE_DISPLAY[lead.type]}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="Add task to calendar"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveLeadId(lead.id);
                        }}
                        className="touch-manipulation whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-[var(--accent-strong)] opacity-90 transition-opacity hover:opacity-100"
                      >
                        + Task
                      </button>
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={!canMoveUp}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          moveUp(lead.id);
                        }}
                        className="touch-manipulation rounded-md px-2 py-1 text-xs text-[var(--text-secondary)] opacity-50 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={!canMoveDown}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          moveDown(lead.id);
                        }}
                        className="touch-manipulation rounded-md px-2 py-1 text-xs text-[var(--text-secondary)] opacity-50 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
              </div>
            );
          })}
        </div>
      )}

      {activeLeadId ? (
        <AddEventFromLeadModal
          open
          onOpenChange={(open) => {
            if (!open) setActiveLeadId(null);
          }}
          leadId={activeLeadId}
          leadName={items.find((l) => l.id === activeLeadId)?.name ?? ""}
          teamMembers={teamMembers}
          viewerUserId={viewerUserId}
          viewerEmail={viewerEmail}
        />
      ) : null}
    </section>
  );
}
