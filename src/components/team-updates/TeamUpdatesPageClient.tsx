"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RiSearchLine } from "react-icons/ri";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import type { CreatorLookup } from "@/lib/calendarCreatorLabel";
import { initialsFromDisplayName } from "@/lib/initialsFromDisplayName";
import { memberDisplayName, sortTeamMembersForList } from "@/lib/teamMemberFilters";
import type { TeamMemberRow } from "@/lib/teamAccess";
import { formatInPST, pstDateKeyFromInstant } from "@/lib/timezone";
import {
  completerDisplayName,
  filterTeamUpdates,
  tabCounts,
} from "@/lib/teamUpdatesFilters";
import { groupTeamUpdatesByDayAndLead } from "@/lib/teamUpdatesGrouping";
import type { LeadFilterOption, TeamUpdateRow, TeamUpdateTab, TeamUpdateTimeRange } from "@/lib/teamUpdatesTypes";
import { GENERAL_LEAD_KEY } from "@/lib/teamUpdatesGrouping";

type TeamUpdatesPageClientProps = {
  initialRows: TeamUpdateRow[];
  leadOptions: LeadFilterOption[];
  teamMembers: TeamMemberRow[];
  teamMembersError?: string | null;
  creatorLookup: CreatorLookup;
  viewerUserId: string;
};

const TABS: { id: TeamUpdateTab; label: string }[] = [
  { id: "completed", label: "Completed" },
  { id: "in_progress", label: "In progress" },
];

const TIME_RANGES: { id: TeamUpdateTimeRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

function tabFromSearchParams(searchParams: ReadonlyURLSearchParams): TeamUpdateTab {
  const t = searchParams.get("tab")?.trim().toLowerCase();
  return t === "in_progress" ? "in_progress" : "completed";
}

function rangeFromSearchParams(searchParams: ReadonlyURLSearchParams): TeamUpdateTimeRange {
  const r = searchParams.get("range")?.trim().toLowerCase();
  if (r === "today" || r === "30d") return r;
  return "7d";
}

function leadFromSearchParams(searchParams: ReadonlyURLSearchParams): string {
  const lead = searchParams.get("lead")?.trim() ?? "";
  return lead || "all";
}

function userFromSearchParams(searchParams: ReadonlyURLSearchParams): string {
  const u = searchParams.get("u")?.trim() ?? "";
  return u || "all";
}

const selectClass =
  "box-border h-11 min-h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[0.9375rem] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-inset focus:ring-[#2460fa1f]";

const emptyCardClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]";

function TeamUpdateListRow({
  row,
  viewerUserId,
  creatorLookup,
}: {
  row: TeamUpdateRow;
  viewerUserId: string;
  creatorLookup: CreatorLookup;
}) {
  const whenIso = row.completedAt ?? row.startTime;
  const whenLabel = whenIso ? formatInPST(whenIso) : "Time not set";
  const person = completerDisplayName(row, viewerUserId, creatorLookup);
  const initials = initialsFromDisplayName(person === "You" ? "You" : person);

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 last:border-b-0">
      <p className="text-[0.9375rem] font-medium leading-snug text-[var(--text-primary)] [overflow-wrap:anywhere]">
        {row.title}
      </p>
      <p className="crm-meta mt-1 text-[var(--text-secondary)]">{whenLabel}</p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[0.65rem] font-semibold text-[var(--text-primary)] ring-1 ring-[var(--border)]"
          aria-hidden
        >
          {initials}
        </span>
        <span className="text-xs font-medium text-[var(--text-secondary)]">{person}</span>
      </div>
    </div>
  );
}

export function TeamUpdatesPageClient({
  initialRows,
  leadOptions,
  teamMembers,
  teamMembersError,
  creatorLookup,
  viewerUserId,
}: TeamUpdatesPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTab = useMemo(() => tabFromSearchParams(searchParams), [searchParams]);
  const urlRange = useMemo(() => rangeFromSearchParams(searchParams), [searchParams]);
  const urlLead = useMemo(() => leadFromSearchParams(searchParams), [searchParams]);
  const urlUser = useMemo(() => userFromSearchParams(searchParams), [searchParams]);

  const searchParamsKey = searchParams.toString();
  const urlSearch = searchParams.get("q")?.trim() ?? "";
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    const el = searchInputRef.current;
    if (el && el.value !== urlSearch) {
      el.value = urlSearch;
    }
  }, [urlSearch, searchParamsKey]);

  const memberIdSet = useMemo(
    () => new Set(teamMembers.map((m) => m.user_id).filter(Boolean)),
    [teamMembers],
  );

  const knownLeadIds = useMemo(() => new Set(leadOptions.map((l) => l.id)), [leadOptions]);

  useEffect(() => {
    const lead = searchParams.get("lead")?.trim() ?? "";
    if (!lead || lead === "all" || lead === GENERAL_LEAD_KEY) return;
    if (knownLeadIds.has(lead)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lead");
    const q = params.toString();
    const path = pathname || "/team-updates";
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  }, [searchParams, knownLeadIds, pathname, router]);

  useEffect(() => {
    const u = searchParams.get("u")?.trim() ?? "";
    if (!u || u === "all" || memberIdSet.size === 0) return;
    if (memberIdSet.has(u)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("u");
    const q = params.toString();
    const path = pathname || "/team-updates";
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  }, [searchParams, memberIdSet, pathname, router]);

  const replaceQueryParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const q = params.toString();
      const path = pathname || "/team-updates";
      router.replace(q ? `${path}?${q}` : path, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = window.setTimeout(() => {
        const next = value.trim();
        const current = searchParams.get("q")?.trim() ?? "";
        if (next === current) return;
        replaceQueryParams((params) => {
          if (next) params.set("q", next);
          else params.delete("q");
        });
      }, 300);
    },
    [replaceQueryParams, searchParams],
  );

  const filterBase = useMemo(
    () => ({
      range: urlRange,
      search: searchParams.get("q")?.trim() ?? "",
      leadId: urlLead,
      userId: urlUser,
      teamMembers,
      viewerUserId,
    }),
    [urlRange, searchParams, urlLead, urlUser, teamMembers, viewerUserId],
  );

  const counts = useMemo(() => tabCounts(initialRows, filterBase), [initialRows, filterBase]);

  const filtered = useMemo(
    () => filterTeamUpdates(initialRows, { ...filterBase, tab: urlTab }),
    [initialRows, filterBase, urlTab],
  );

  const todayKey = useMemo(() => pstDateKeyFromInstant(new Date()), []);
  const dayGroups = useMemo(
    () => groupTeamUpdatesByDayAndLead(filtered, urlTab, todayKey),
    [filtered, urlTab, todayKey],
  );

  const sortedMembers = useMemo(
    () => sortTeamMembersForList(teamMembers, viewerUserId),
    [teamMembers, viewerUserId],
  );

  const activeSegment =
    "border border-transparent bg-[var(--accent-strong)] text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)]";
  const inactiveSegment =
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]";

  const emptyMessage =
    urlTab === "completed"
      ? "No completed team tasks match your filters."
      : "No in-progress team tasks match your filters.";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {teamMembersError ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="status"
        >
          Team member list could not be loaded. Person filters may be limited.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="relative block">
          <span className="sr-only">Search tasks</span>
          <RiSearchLine
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]"
            aria-hidden
          />
          <input
            ref={searchInputRef}
            type="search"
            defaultValue={urlSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className={`${selectClass} pl-9`}
            autoComplete="off"
          />
        </label>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Lead</span>
            <select
              className={selectClass}
              value={urlLead}
              onChange={(e) => {
                const v = e.target.value;
                replaceQueryParams((params) => {
                  if (v === "all") params.delete("lead");
                  else params.set("lead", v);
                });
              }}
            >
              <option value="all">All leads</option>
              <option value={GENERAL_LEAD_KEY}>General</option>
              {leadOptions.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {urlTab === "completed" ? "Completed by" : "Assigned to"}
            </span>
            <select
              className={selectClass}
              value={urlUser}
              onChange={(e) => {
                const v = e.target.value;
                replaceQueryParams((params) => {
                  if (v === "all") params.delete("u");
                  else params.set("u", v);
                });
              }}
            >
              <option value="all">{urlTab === "completed" ? "Anyone" : "Anyone"}</option>
              {sortedMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user_id === viewerUserId ? "You" : memberDisplayName(m)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Time</span>
          <select
            className={selectClass}
            value={urlRange}
            onChange={(e) => {
              const v = e.target.value as TeamUpdateTimeRange;
              replaceQueryParams((params) => {
                if (v === "7d") params.delete("range");
                else params.set("range", v);
              });
            }}
          >
            {TIME_RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="flex gap-1 overflow-x-auto rounded-xl bg-[var(--surface-muted)] p-1"
        role="tablist"
        aria-label="Task status"
      >
        {TABS.map((tab) => {
          const active = urlTab === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                replaceQueryParams((params) => {
                  if (tab.id === "completed") params.delete("tab");
                  else params.set("tab", tab.id);
                });
              }}
              className={`min-h-10 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 ${
                active ? activeSegment : inactiveSegment
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {!dayGroups.length ? (
        <div className={emptyCardClass}>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {dayGroups.map((day) => (
            <section key={day.dayKey} aria-label={day.dayLabel}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">{day.dayLabel}</h2>
                  <p className="crm-meta text-[var(--text-secondary)]">{day.summary}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {day.leadGroups.map((leadGroup) => (
                  <div key={`${day.dayKey}-${leadGroup.leadKey}`}>
                    <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                      {leadGroup.leadLabel}
                    </h3>
                    <SurfaceListShell className="overflow-hidden transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
                      {leadGroup.items.map((row) => (
                        <TeamUpdateListRow
                          key={row.id}
                          row={row}
                          viewerUserId={viewerUserId}
                          creatorLookup={creatorLookup}
                        />
                      ))}
                    </SurfaceListShell>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
