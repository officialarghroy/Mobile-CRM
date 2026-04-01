"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function createCalendarEvent(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: actionUser },
  } = await supabase.auth.getUser();
  const email = actionUser?.email;
  if (!email) return;

  const title = String(formData.get("title") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();

  if (!title) return;

  try {
    const { error } = await supabase.from("events").insert({
      title,
      start_time: startTime || null,
      end_time: endTime || null,
      user_name: email,
    });

    if (error) {
      throw error;
    }

    revalidatePath("/calendar");
  } catch (error) {
    console.error("Failed to create event:", error);
    throw error;
  }
}

export async function deleteCalendarEvent(eventId: string, formData: FormData) {
  void formData;
  if (!eventId) return;

  const supabase = await createSupabaseServerClient();

  try {
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      throw error;
    }

    revalidatePath("/calendar");
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw error;
  }
}
