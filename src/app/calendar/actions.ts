"use server";

import { revalidatePath } from "next/cache";
import { parseDatetimeLocalToIsoUtc } from "@/lib/calendarDateTime";
import { normalizeCalendarEventRow, type CalendarEventRow } from "@/lib/calendarEventDisplay";
import {
  CALENDAR_EVENTS_MIGRATION_HINT,
  CALENDAR_PERSONAL_REQUIRES_MIGRATION,
  isLegacyCalendarEventsSchemaError,
} from "@/lib/calendarEventsSchemaError";
import { toUserError } from "@/lib/supabaseActionErrors";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/** Shown when DELETE succeeds in HTTP terms but no row was removed (RLS, wrong id, or already deleted). */
const EVENT_DELETE_ZERO_ROWS =
  "Could not remove this event. It may already be gone, or database rules blocked the delete. An admin can fix team access by running the SQL file supabase/MANUAL_RUN_calendar_events.sql in the Supabase SQL Editor.";

export async function createCalendarEvent(formData: FormData): Promise<CalendarEventRow> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: actionUser },
  } = await supabase.auth.getUser();
  const email = actionUser?.email;
  const userId = actionUser?.id;
  if (!email || !userId) {
    throw new Error("You must be signed in to create an event.");
  }

  const scopeRaw = String(formData.get("calendar_scope") ?? "").trim().toLowerCase();
  const calendar_scope = scopeRaw === "personal" ? "personal" : "team";

  const title = String(formData.get("title") ?? "").trim();
  const startRaw = String(formData.get("start_time") ?? "").trim();
  const endRaw = String(formData.get("end_time") ?? "").trim();
  const leadIdField = formData.get("lead_id");
  const leadId =
    typeof leadIdField === "string" && leadIdField.trim() ? leadIdField.trim() : null;
  const assignedUserIdField = formData.get("assigned_user_id");
  const assignedUserId =
    typeof assignedUserIdField === "string" && assignedUserIdField.trim()
      ? assignedUserIdField.trim()
      : null;
  let ownerUserId = assignedUserId || userId;
  if (calendar_scope === "personal") {
    ownerUserId = userId;
  }

  console.log("Creating event:", {
    creator: userId,
    assigned: ownerUserId,
    leadId,
  });

  if (!title) {
    throw new Error("Add an event title.");
  }

  let startIso: string | null = null;
  let endIso: string | null = null;

  if (startRaw) {
    startIso = parseDatetimeLocalToIsoUtc(startRaw);
    if (!startIso) {
      throw new Error("Start time is not valid. Pick the date and time again.");
    }
  }

  if (endRaw) {
    endIso = parseDatetimeLocalToIsoUtc(endRaw);
    if (!endIso) {
      throw new Error("End time is not valid. Pick the date and time again.");
    }
  }

  if (startIso && endIso) {
    const startMs = Date.parse(startIso);
    const endMs = Date.parse(endIso);
    if (endMs <= startMs) {
      endIso = new Date(startMs + 60 * 60 * 1000).toISOString();
    }
  }

  if (startIso && !endIso) {
    endIso = new Date(Date.parse(startIso) + 60 * 60 * 1000).toISOString();
  }

  if (!startIso && endIso) {
    throw new Error("Set a start time, or clear the end time.");
  }

  const basePayload = {
    title,
    start_time: startIso,
    end_time: endIso,
    user_name: email,
    created_by_user_id: userId,
  };

  try {
    // Return only `id` from PostgREST so a stale schema cache on newer columns does not break the insert.
    const insertPayload = {
      ...basePayload,
      calendar_scope,
      owner_user_id: ownerUserId,
      lead_id: leadId,
    };

    const { data, error } = await supabase
      .from("events")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      if (isLegacyCalendarEventsSchemaError(error)) {
        if (calendar_scope === "personal") {
          throw new Error(CALENDAR_PERSONAL_REQUIRES_MIGRATION);
        }
        throw new Error(CALENDAR_EVENTS_MIGRATION_HINT);
      }
      throw toUserError(error, "Could not save the event.");
    }

    const rowData = data as Record<string, unknown> | null;
    const newId = rowData && typeof rowData.id === "string" ? rowData.id : null;
    if (!newId) {
      throw new Error("Could not save the event.");
    }

    revalidatePath("/calendar", "page");
    revalidatePath("/tasks");
    revalidatePath("/notifications", "page");

    // Notify whoever owns the task (self-assign, teammate, or personal), so in-app alerts always match My Tasks.
    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: ownerUserId,
      message: `You\u2019ve been assigned: ${title}`,
      type: "task_assigned",
      entity_id: newId,
      entity_type: "event",
    });
    if (notifyError) {
      console.error("Failed to create task assignment notification:", notifyError);
    }

    return normalizeCalendarEventRow({
      id: newId,
      title,
      start_time: startIso,
      end_time: endIso,
      user_name: email,
      calendar_scope,
      owner_user_id: ownerUserId,
      created_by_user_id: userId,
      completed_at: null,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw toUserError(error, "Could not save the event.");
  }
}

export async function deleteCalendarEvent(eventId: string, formData: FormData) {
  void formData;
  if (!eventId?.trim()) {
    throw new Error("Missing event.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in to delete an event.");
  }

  const id = eventId.trim();

  try {
    const { data: beforeRow } = await supabase
      .from("events")
      .select("lead_id")
      .eq("id", id)
      .maybeSingle();
    const leadIdRaw = beforeRow && typeof beforeRow === "object" && "lead_id" in beforeRow
      ? (beforeRow as { lead_id: string | null }).lead_id
      : null;
    const leadId = typeof leadIdRaw === "string" && leadIdRaw.trim() ? leadIdRaw.trim() : null;

    const { error, count } = await supabase.from("events").delete({ count: "exact" }).eq("id", id);

    if (error) {
      throw toUserError(error, "Could not delete the event.");
    }

    if (count == null || count < 1) {
      console.error("deleteCalendarEvent: delete affected 0 rows", { eventId: id });
      throw new Error(EVENT_DELETE_ZERO_ROWS);
    }

    revalidatePath("/calendar", "page");
    revalidatePath("/tasks");
    if (leadId) {
      revalidatePath(`/leads/${leadId}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw toUserError(error, "Could not delete the event.");
  }
}
