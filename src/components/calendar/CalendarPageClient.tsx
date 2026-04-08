"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AddEventInline } from "@/components/calendar/AddEventInline";
import { CalendarGrid, type CalendarGridEvent } from "@/components/calendar/CalendarGrid";
import { DeleteCalendarEventButton } from "@/components/calendar/DeleteCalendarEventButton";
import { Button } from "@/components/ui/Button";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import type { CreatorLookup } from "@/lib/calendarCreatorLabel";
import { formatEventCreatorLabel } from "@/lib/calendarCreatorLabel";
import {
  calendarScopeLabel,
  formatCalendarTimeRange,
  isCalendarEventMine,
  type CalendarEventRow,
  type CalendarScope,
} from "@/lib/calendarEventDisplay";
import type { TeamMemberRow } from "@/lib/teamAccess";

/** What to show in the Events list (filter pills + URL). Own name = personal events; others = that person’s team events. */
type ListShowFilter = { type: "team" } | { type: "member"; userId: string };

type ListEvent = {
  id: string;
  title: string;
  time: string;
  addedBy: string;
  mine: boolean;
  calendar_scope: CalendarScope;
};

type CreateEventAction = (formData: FormData) => Promise<CalendarEventRow>;

type CalendarPageClientProps = {
  gridEvents: CalendarGridEvent[];
  viewerEmail: string;
  viewerUserId: string | null;
  creatorLookup: CreatorLookup;
  teamMembers: TeamMemberRow[];
  createEvent: CreateEventAction;
};

function viewFromSearchParams(searchParams: ReadonlyURLSearchParams): "list" | "calendar" {
  return searchParams.get("view") === "calendar" ? "calendar" : "list";
}

function listShowFromSearchParams(
  searchParams: ReadonlyURLSearchParams,
  knownMemberIds: ReadonlySet<string>,
  viewerUserId: string | null,
): ListShowFilter {
  const cal = searchParams.get("cal")?.trim().toLowerCase();
  if ((cal === "personal" || cal === "mine") && viewerUserId) {
    return { type: "member", userId: viewerUserId };
  }
  const u = searchParams.get("u")?.trim() ?? "";
  if (u) {
    if (knownMemberIds.size > 0 && !knownMemberIds.has(u)) return { type: "team" };
    return { type: "member", userId: u };
  }
  return { type: "team" };
}

function rowToListEvent(
  row: CalendarGridEvent,
  viewerEmail: string,
  viewerUserId: string | null,
  lookup: CreatorLookup,
): ListEvent {
  const mine = isCalendarEventMine(row, viewerEmail, viewerUserId);
  return {
    id: row.id,
    title: row.title,
    time: formatCalendarTimeRange(row.start_time, row.end_time),
    addedBy: formatEventCreatorLabel(row, viewerEmail, viewerUserId, lookup),
    mine,
    calendar_scope: row.calendar_scope,
  };
}

function filterEventsForListShow(
  events: CalendarGridEvent[],
  show: ListShowFilter,
  teamMembers: TeamMemberRow[],
  viewerUserId: string | null,
): CalendarGridEvent[] {
  const teamOnly = events.filter((e) => e.calendar_scope === "team");
  if (show.type === "team") return teamOnly;
  if (viewerUserId && show.userId === viewerUserId) {
    return events.filter((e) => e.calendar_scope === "personal");
  }
  const m = teamMembers.find((tm) => tm.user_id === show.userId);
  if (!m) return teamOnly;
  return teamOnly.filter((e) => eventBelongsToMember(e, m));
}

function eventBelongsToMember(row: CalendarGridEvent, m: TeamMemberRow): boolean {
  if (!m.user_id) return false;
  if (row.owner_user_id && row.owner_user_id === m.user_id) return true;
  const memberEmail = m.email?.trim().toLowerCase();
  const rowEmail = row.user_name?.trim().toLowerCase();
  return Boolean(memberEmail && rowEmail && memberEmail === rowEmail);
}

function sortTeamMembersForList(members: TeamMemberRow[], viewerUserId: string | null): TeamMemberRow[] {
  const copy = [...members];
  copy.sort((a, b) => {
    const aViewer = Boolean(viewerUserId && a.user_id === viewerUserId);
    const bViewer = Boolean(viewerUserId && b.user_id === viewerUserId);
    if (aViewer !== bViewer) return aViewer ? -1 : 1;
    const an = (a.display_name || a.email || "").localeCompare(b.display_name || b.email || "", undefined, {
      sensitivity: "base",
    });
    return an;
  });
  return copy;
}

function memberSectionHeading(m: TeamMemberRow): string {
  const d = m.display_name?.trim();
  if (d && d !== "—") return d;
  const em = m.email?.trim();
  return em || "Team member";
}

function mergeAndSortEvents(server: CalendarGridEvent[], staged: CalendarEventRow[]): CalendarGridEvent[] {
  const byId = new Map(server.map((e) => [e.id, e]));
  const out = [...server];
  for (const s of staged) {
    if (!byId.has(s.id)) out.push(s);
  }
  return out.sort((a, b) => {
    const ta = a.start_time ? Date.parse(a.start_time) : Number.MAX_SAFE_INTEGER;
    const tb = b.start_time ? Date.parse(b.start_time) : Number.MAX_SAFE_INTEGER;
    if (ta !== tb) return ta - tb;
    return a.title.localeCompare(b.title);
  });
}

/** Left stripe: personal vs your team vs others (no Team/Personal text chips). */
function listRowLeftBorderClass(event: ListEvent): string {
  if (event.calendar_scope === "personal") return "border-l-[#7c3aed]";
  if (event.mine) return "border-l-red-500";
  return "border-l-[#94a3b8]";
}

function CalendarEventListRow({ event }: { event: ListEvent }) {
  return (
    <div
      className={`flex items-stretch gap-0 border-b border-[var(--border)] border-l-[3px] bg-[var(--surface)] last:border-b-0 ${listRowLeftBorderClass(event)}`}
    >
      <div className="min-w-0 flex-1 px-4 py-4 pl-5">
        <p className="text-card-title [overflow-wrap:anywhere]">{event.title}</p>
        <p
          className="crm-meta mt-1 font-medium text-red-600 dark:text-red-400"
          title={`${calendarScopeLabel(event.calendar_scope)} · Added by ${event.addedBy}`}
        >
          Added by {event.addedBy}
        </p>
        <p className="text-card-meta mt-1">{event.time}</p>
      </div>
      <DeleteCalendarEventButton
        eventId={event.id}
        eventTitle={event.title}
        calendarScope={event.calendar_scope}
      />
    </div>
  );
}

const emptyListCardClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]";

export function CalendarPageClient({
  gridEvents,
  viewerEmail,
  viewerUserId,
  creatorLookup,
  teamMembers,
  createEvent,
}: CalendarPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberIdSet = useMemo(
    () => new Set(teamMembers.map((m) => m.user_id).filter(Boolean)),
    [teamMembers],
  );

  const [view, setView] = useState<"list" | "calendar">(() => viewFromSearchParams(searchParams));
  const [listShow, setListShow] = useState<ListShowFilter>(() =>
    listShowFromSearchParams(searchParams, memberIdSet, viewerUserId),
  );
  const [newEventOpenedAt, setNewEventOpenedAt] = useState<number | null>(null);
  const [stagedEvents, setStagedEvents] = useState<CalendarEventRow[]>([]);

  useEffect(() => {
    setView(viewFromSearchParams(searchParams));
    setListShow(listShowFromSearchParams(searchParams, memberIdSet, viewerUserId));
  }, [searchParams, memberIdSet, viewerUserId]);

  /** Old ?cal=personal links: rewrite to ?u=<you> so the address bar matches the name pill. */
  useEffect(() => {
    const cal = searchParams.get("cal")?.trim().toLowerCase();
    if ((cal !== "personal" && cal !== "mine") || !viewerUserId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cal");
    params.set("u", viewerUserId);
    const q = params.toString();
    const path = pathname || "/calendar";
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  }, [searchParams, viewerUserId, pathname, router]);

  /** Drop stale ?u= when that user leaves the team so the filter row matches the URL. */
  useEffect(() => {
    const u = searchParams.get("u")?.trim() ?? "";
    if (!u || memberIdSet.size === 0) return;
    if (memberIdSet.has(u)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("u");
    const q = params.toString();
    const path = pathname || "/calendar";
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  }, [searchParams, memberIdSet, pathname, router]);

  useEffect(() => {
    const serverIds = new Set(gridEvents.map((e) => e.id));
    setStagedEvents((prev) => prev.filter((e) => !serverIds.has(e.id)));
  }, [gridEvents]);

  const mergedEvents = useMemo(
    () => mergeAndSortEvents(gridEvents, stagedEvents),
    [gridEvents, stagedEvents],
  );

  const listEventsFiltered = useMemo(
    () => filterEventsForListShow(mergedEvents, listShow, teamMembers, viewerUserId),
    [mergedEvents, listShow, teamMembers, viewerUserId],
  );

  const displayListEvents = useMemo(
    () => listEventsFiltered.map((e) => rowToListEvent(e, viewerEmail, viewerUserId, creatorLookup)),
    [listEventsFiltered, viewerEmail, viewerUserId, creatorLookup],
  );

  const sortedTeamMembers = useMemo(
    () => sortTeamMembersForList(teamMembers, viewerUserId),
    [teamMembers, viewerUserId],
  );

  const replaceQueryParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      mutate(params);
      const q = params.toString();
      const path = pathname || window.location.pathname;
      window.history.replaceState(window.history.state, "", q ? `${path}?${q}` : path);
    },
    [pathname],
  );

  const setCalendarView = useCallback(
    (next: "list" | "calendar") => {
      setView(next);
      replaceQueryParams((params) => {
        if (next === "calendar") {
          params.set("view", "calendar");
        } else {
          params.delete("view");
        }
      });
    },
    [replaceQueryParams],
  );

  const setListShowAndUrl = useCallback(
    (next: ListShowFilter) => {
      setListShow(next);
      replaceQueryParams((params) => {
        params.delete("cal");
        params.delete("u");
        if (next.type === "member") {
          params.set("u", next.userId);
        }
      });
    },
    [replaceQueryParams],
  );

  const handleEventCreated = useCallback(
    (row: CalendarEventRow) => {
      setStagedEvents((prev) => (prev.some((e) => e.id === row.id) ? prev : [...prev, row]));
      if (view !== "list" || !viewerUserId) return;
      if (row.calendar_scope === "personal") {
        setListShowAndUrl({ type: "member", userId: viewerUserId });
        return;
      }
      const onOwnPersonalList =
        listShow.type === "member" && listShow.userId === viewerUserId;
      if (row.calendar_scope === "team" && onOwnPersonalList) {
        setListShowAndUrl({ type: "team" });
      }
    },
    [listShow, setListShowAndUrl, view, viewerUserId],
  );

  const activeSegment =
    "border border-transparent bg-[var(--accent-strong)] text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)]";
  const inactiveSegment =
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]";

  const listFilterHint = useMemo(() => {
    if (listShow.type === "team") return "Team events";
    return "Events";
  }, [listShow]);

  const canAddEventsOnListView = useMemo(() => {
    if (listShow.type === "team") return true;
    return Boolean(viewerUserId && listShow.userId === viewerUserId);
  }, [listShow, viewerUserId]);

  useEffect(() => {
    if (newEventOpenedAt != null && !canAddEventsOnListView) {
      setNewEventOpenedAt(null);
    }
  }, [canAddEventsOnListView, newEventOpenedAt]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {newEventOpenedAt != null ? (
        <AddEventInline
          key={newEventOpenedAt}
          createEvent={createEvent}
          defaultDate={new Date(newEventOpenedAt)}
          defaultCalendarScope={
            view === "list" &&
            listShow.type === "member" &&
            viewerUserId &&
            listShow.userId === viewerUserId
              ? "personal"
              : "team"
          }
          onCreated={handleEventCreated}
          onClose={() => setNewEventOpenedAt(null)}
          teamMembers={teamMembers}
          viewerUserId={viewerUserId}
          viewerEmail={viewerEmail}
        />
      ) : null}

      <div className="isolate flex shrink-0 flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setCalendarView("list")}
          className={`inline-flex h-11 min-h-11 items-center rounded-full px-5 text-sm font-medium transition-colors ${
            view === "list" ? activeSegment : inactiveSegment
          }`}
        >
          Events
        </button>
        <button
          type="button"
          onClick={() => setCalendarView("calendar")}
          className={`inline-flex h-11 min-h-11 items-center rounded-full px-5 text-sm font-medium transition-colors ${
            view === "calendar" ? activeSegment : inactiveSegment
          }`}
        >
          Calendar
        </button>
      </div>

      <section
        className={`flex shrink-0 flex-col space-y-5 ${view !== "list" ? "hidden" : ""}`}
        aria-hidden={view !== "list"}
        aria-label={listFilterHint}
      >
        <div className="flex shrink-0 flex-col gap-2">
          <p className="crm-section-label">Filter</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setListShowAndUrl({ type: "team" })}
              className={`inline-flex h-10 min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                listShow.type === "team" ? activeSegment : inactiveSegment
              }`}
            >
              Team
            </button>
            {sortedTeamMembers.map((m) => {
              const active = listShow.type === "member" && listShow.userId === m.user_id;
              const label = memberSectionHeading(m);
              return (
                <button
                  key={m.user_id}
                  type="button"
                  title={label}
                  onClick={() => setListShowAndUrl({ type: "member", userId: m.user_id })}
                  className={`inline-flex h-10 max-w-[min(100%,14rem)] min-h-10 min-w-0 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                    active ? activeSegment : inactiveSegment
                  }`}
                >
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="crm-section-label">{listFilterHint}</p>
          <div className="flex min-w-0 shrink-0 flex-col items-stretch gap-1 sm:items-end">
            {canAddEventsOnListView ? (
              <Button type="button" className="px-4" onClick={() => setNewEventOpenedAt(Date.now())}>
                Add Event
              </Button>
            ) : (
              <p className="max-w-md text-right text-xs text-[var(--text-secondary)]">
                Only this teammate can add events from this list view. Switch to Team, your own name, or use Calendar.
              </p>
            )}
          </div>
        </div>

        {!displayListEvents.length ? (
          <div className={emptyListCardClass}>No events</div>
        ) : (
          <SurfaceListShell className="transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]">
            {displayListEvents.map((event) => (
              <CalendarEventListRow key={event.id} event={event} />
            ))}
          </SurfaceListShell>
        )}
      </section>

      <div
        className={`min-h-0 min-w-0 flex-1 flex flex-col ${view !== "calendar" ? "hidden" : ""}`}
        aria-hidden={view !== "calendar"}
      >
        <CalendarGrid
          className="min-h-0 min-w-0 flex-1"
          events={mergedEvents}
          viewerEmail={viewerEmail}
          viewerUserId={viewerUserId}
          creatorLookup={creatorLookup}
          onAddEvent={() => setNewEventOpenedAt(Date.now())}
        />
      </div>
    </div>
  );
}
