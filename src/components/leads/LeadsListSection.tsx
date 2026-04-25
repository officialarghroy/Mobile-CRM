"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  markLeadAsRead,
  updateLeadPriority,
  updateLeadStatus,
} from "@/app/leads/actions";
import { AddEventFromLeadModal } from "@/components/leads/AddEventFromLeadModal";
import { LeadsDragOverlayCard } from "@/components/leads/LeadsDragOverlayCard";
import { LEAD_MARK_PAID_SELECT_VALUE, LeadsSortableLeadRow } from "@/components/leads/LeadsSortableLeadRow";
import { LeadsSearchModal } from "@/components/leads/LeadsSearchModal";
import { sortLeadsForDisplay } from "@/lib/leadsListClientQuery";
import { formatLeadsListActivityLabel } from "@/lib/timezone";
import type { TeamMemberRow } from "@/lib/teamAccess";
import { RiSearchLine } from "react-icons/ri";
import type { LeadCardData, LeadStatus } from "./leadCardTypes";

export type { LeadCardData, LeadStatus } from "./leadCardTypes";

type LeadFilter = "all" | "lead" | "client" | "completed";

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

function isCompletedLead(lead: LeadCardData): boolean {
  return (lead.status ?? "pending") === "completed";
}

function filterItemsForTab(items: LeadCardData[], filter: LeadFilter): LeadCardData[] {
  if (filter === "all") return items;
  if (filter === "completed") return items.filter(isCompletedLead);
  if (filter === "lead") return items.filter((l) => l.type === "lead" && !isCompletedLead(l));
  if (filter === "client") return items.filter((l) => l.type === "client" && !isCompletedLead(l));
  return items;
}

const STATUS_TITLE: Record<LeadStatus, string> = {
  pending: "Pending",
  urgent: "Urgent",
  not_paid: "Not Paid",
  completed: "Completed",
};

/** Minimal status indicator next to name (visual only). */
function getStatusDotClass(status: LeadStatus | undefined): string {
  switch (status ?? "pending") {
    case "pending":
      return "bg-yellow-500";
    case "urgent":
      return "bg-red-500";
    case "completed":
      return "bg-emerald-600";
    case "not_paid":
      return "bg-purple-500";
    default:
      return "bg-[var(--text-tertiary)]";
  }
}

function isLeadStatus(s: string): s is LeadStatus {
  return s === "pending" || s === "urgent" || s === "not_paid" || s === "completed";
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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  /** Paid is stored as `paid` in Postgres (legacy CHECKs often allow paid but not completed). UI shows completed via normalizeLeadStatus. */
  const markLeadPaid = useCallback((leadId: string) => {
    setItems((prev) => {
      const snapshot = prev;
      const next: LeadCardData[] = prev.map((row) =>
        row.id === leadId ? { ...row, status: "completed" as LeadStatus } : row,
      );
      queueMicrotask(() => {
        void updateLeadStatus(leadId, "paid")
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

  const onStatusSelect = useCallback(
    (leadId: string, rawValue: string) => {
      if (rawValue === LEAD_MARK_PAID_SELECT_VALUE) {
        markLeadPaid(leadId);
        setFilter("completed");
        return;
      }
      if (isLeadStatus(rawValue)) {
        changeLeadStatus(leadId, rawValue);
      }
    },
    [changeLeadStatus, markLeadPaid],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      try {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setItems((prev) => {
          const filtered = filterItemsForTab(prev, filter);
          const sorted = sortLeadsForDisplay(filtered);
          const ids = sorted.map((l) => l.id);
          const oldIndex = ids.indexOf(String(active.id));
          const newIndex = ids.indexOf(String(over.id));
          if (oldIndex < 0 || newIndex < 0) return prev;

          const newOrderIds = arrayMove(ids, oldIndex, newIndex);
          const maxP = prev.reduce((m, r) => Math.max(m, r.priority_order ?? 0), 0);
          const n = newOrderIds.length;
          const priorityUpdates = newOrderIds.map((id, i) => ({ id, priority: maxP + n - i }));

          const priorityById = new Map(priorityUpdates.map((u) => [u.id, u.priority]));
          const next = prev.map((row) => {
            const p = priorityById.get(row.id);
            return p !== undefined ? { ...row, priority_order: p } : row;
          });

          const snapshot = prev;
          queueMicrotask(() => {
            void Promise.all(priorityUpdates.map(({ id, priority }) => updateLeadPriority(id, priority)))
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
      } finally {
        setActiveDragId(null);
      }
    },
    [filter],
  );

  const filteredLeads = useMemo(() => filterItemsForTab(items, filter), [filter, items]);

  const sortedForView = useMemo(() => sortLeadsForDisplay(filteredLeads), [filteredLeads]);

  const rowsWithPstLabel = useMemo(
    () =>
      sortedForView.map((lead) => ({
        ...lead,
        pstActivityLabel: formatLeadsListActivityLabel(lead.activityAt),
      })),
    [sortedForView],
  );

  const sortableIds = useMemo(() => rowsWithPstLabel.map((l) => l.id), [rowsWithPstLabel]);

  const activeOverlayLead = useMemo(() => {
    if (!activeDragId) return null;
    return rowsWithPstLabel.find((l) => l.id === activeDragId) ?? null;
  }, [activeDragId, rowsWithPstLabel]);

  const effectiveIsRead = useCallback(
    (lead: LeadCardData) => readIds.has(lead.id) || Boolean(lead.is_read),
    [readIds],
  );

  const emptyMessage = (() => {
    if (!leads.length) return "No leads yet - add your first lead";
    if (filter === "completed") return "No completed leads";
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
              onClick={() => setFilter("completed")}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === "completed"
                  ? "bg-[var(--surface-accent)] text-[var(--accent-strong)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              Completed
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          modifiers={[restrictToVerticalAxis]}
          autoScroll={{ acceleration: 14, threshold: { x: 0.2, y: 0.22 } }}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {rowsWithPstLabel.map((lead) => {
                const status = lead.status ?? "pending";
                const unread = !effectiveIsRead(lead);

                return (
                  <LeadsSortableLeadRow
                    key={lead.id}
                    lead={lead}
                    unread={unread}
                    statusDotClass={getStatusDotClass(status)}
                    statusTitle={STATUS_TITLE[status] ?? "Status"}
                    typeLabel={TYPE_DISPLAY[lead.type]}
                    markAsRead={markAsRead}
                    onStatusSelect={onStatusSelect}
                    onAddTask={setActiveLeadId}
                  />
                );
              })}
            </div>
          </SortableContext>
          <DragOverlay
            zIndex={100}
            dropAnimation={{ duration: 220, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }}
            modifiers={[restrictToVerticalAxis]}
          >
            {activeOverlayLead ? (
              <LeadsDragOverlayCard
                lead={activeOverlayLead}
                statusDotClass={getStatusDotClass(activeOverlayLead.status ?? "pending")}
                statusTitle={STATUS_TITLE[activeOverlayLead.status ?? "pending"] ?? "Status"}
                typeLabel={TYPE_DISPLAY[activeOverlayLead.type]}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
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
