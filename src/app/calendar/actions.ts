"use server";

import { revalidatePath } from "next/cache";
import { parseDatetimeLocalToIsoUtc } from "@/lib/calendarDateTime";
import { toUserError } from "@/lib/supabaseActionErrors";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/** Shown when DELETE succeeds in HTTP terms but no row was removed (RLS, wrong id, or already deleted). */
const EVENT_DELETE_ZERO_ROWS =
  "Could not remove this event. It may already be gone, or database rules blocked the delete. An admin can fix team access by running the SQL file supabase/MANUAL_RUN_calendar_events.sql in the Supabase SQL Editor.";

export async function createCalendarEvent(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: actionUser },
  } = await supabase.auth.getUser();
  const email = actionUser?.email;
  if (!email) {
    throw new Error("You must be signed in to create an event.");
  }

  const title = String(formData.get("title") ?? "").trim();
  const startRaw = String(formData.get("start_time") ?? "").trim();
  const endRaw = String(formData.get("end_time") ?? "").trim();

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

  try {
    const { error } = await supabase.from("events").insert({
      title,
      start_time: startIso,
      end_time: endIso,
      user_name: email,
    });

    if (error) {
      throw toUserError(error, "Could not save the event.");
    }

    revalidatePath("/calendar");
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

  try {
    const { error, count } = await supabase.from("events").delete({ count: "exact" }).eq("id", eventId.trim());

    if (error) {
      throw toUserError(error, "Could not delete the event.");
    }

    if (count == null || count < 1) {
      console.error("deleteCalendarEvent: delete affected 0 rows", { eventId: eventId.trim() });
      throw new Error(EVENT_DELETE_ZERO_ROWS);
    }

    revalidatePath("/calendar");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw toUserError(error, "Could not delete the event.");
  }
}
