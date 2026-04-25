"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RiArrowDownSLine, RiDraggable } from "react-icons/ri";
import type { LeadCardData, LeadStatus } from "./leadCardTypes";

/** Select option value: choosing Paid persists `paid` on the server (UI treats it as completed when loaded). */
export const LEAD_MARK_PAID_SELECT_VALUE = "__mark_paid__";

const PIPELINE_SELECT_OPTIONS: { value: LeadStatus | typeof LEAD_MARK_PAID_SELECT_VALUE; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "urgent", label: "Urgent" },
  { value: "not_paid", label: "Not Paid" },
  { value: LEAD_MARK_PAID_SELECT_VALUE, label: "Paid" },
];

const COMPLETED_SELECT_OPTIONS: { value: LeadStatus | typeof LEAD_MARK_PAID_SELECT_VALUE; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "urgent", label: "Urgent" },
  { value: "not_paid", label: "Not Paid" },
  { value: LEAD_MARK_PAID_SELECT_VALUE, label: "Paid" },
];

export type LeadsSortableLeadRowProps = {
  lead: LeadCardData & { pstActivityLabel: string };
  unread: boolean;
  statusDotClass: string;
  statusTitle: string;
  typeLabel: string;
  markAsRead: (id: string) => void;
  onStatusSelect: (leadId: string, rawValue: string) => void;
  onAddTask: (leadId: string) => void;
};

export function LeadsSortableLeadRow({
  lead,
  unread,
  statusDotClass,
  statusTitle,
  typeLabel,
  markAsRead,
  onStatusSelect,
  onAddTask,
}: LeadsSortableLeadRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: lead.id,
      transition: {
        duration: 200,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0 : undefined,
  };

  const status = lead.status ?? "pending";
  const isCompleted = status === "completed";
  const selectValue = isCompleted ? "completed" : status;
  const selectOptions = isCompleted ? COMPLETED_SELECT_OPTIONS : PIPELINE_SELECT_OPTIONS;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 shadow-sm ${
        unread ? "ring-1 ring-blue-100" : ""
      } ${isDragging ? "z-[1]" : ""}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          aria-label="Drag to reorder"
          className="touch-none flex min-h-10 min-w-10 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)] active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
        >
          <RiDraggable className="h-5 w-5 shrink-0" aria-hidden />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex shrink-0 items-center gap-0.5" aria-hidden>
            {unread ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" title="Unread" />
            ) : null}
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`} title={statusTitle} />
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
                value={selectValue}
                onChange={(e) => {
                  onStatusSelect(lead.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="min-w-0 max-w-full w-auto cursor-pointer appearance-none rounded-full border border-[var(--border)] bg-[var(--surface-muted)] py-1 pl-2 pr-5 text-xs text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] [field-sizing:content]"
              >
                {selectOptions.map((o) => (
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
          <span className={`shrink-0 ${lead.type === "client" ? "chip-client" : "chip-lead"}`}>{typeLabel}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Add task to calendar"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddTask(lead.id);
            }}
            className="touch-manipulation whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-[var(--accent-strong)] opacity-90 transition-opacity hover:opacity-100"
          >
            + Task
          </button>
        </div>
      </div>
    </div>
  );
}
