"use client";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type MonthChipScrollerProps = {
  year: number;
  activeMonthIndex: number;
  onSelectMonth: (monthIndex: number) => void;
};

export function MonthChipScroller({ year, activeMonthIndex, onSelectMonth }: MonthChipScrollerProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pt-0.5">
      {MONTH_SHORT.map((label, i) => {
        const active = i === activeMonthIndex;
        return (
          <button
            key={`${year}-${label}`}
            type="button"
            onClick={() => onSelectMonth(i)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--accent-strong)] text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)]"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
