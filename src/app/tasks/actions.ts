"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { toUserError } from "@/lib/supabaseActionErrors";

export async function setTaskCompleted(eventId: string, completed: boolean): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in.");
  }

  const id = eventId.trim();
  if (!id) {
    throw new Error("Missing task.");
  }

  const payload = completed
    ? { completed_at: new Date().toISOString(), completed_by_user_id: user.id }
    : { completed_at: null as string | null, completed_by_user_id: null as string | null };

  try {
    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", id)
      .select("id, lead_id")
      .maybeSingle();

    if (error) {
      throw toUserError(error, "Could not update this task.");
    }
    if (!data || typeof data !== "object" || !("id" in data)) {
      throw new Error("Could not update this task. It may be gone or you may not have access.");
    }

    const leadId =
      "lead_id" in data && typeof (data as { lead_id?: string | null }).lead_id === "string"
        ? (data as { lead_id: string }).lead_id.trim()
        : null;

    revalidatePath("/tasks");
    revalidatePath("/calendar", "page");
    if (leadId) {
      revalidatePath(`/leads/${leadId}`);
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw toUserError(err, "Could not update this task.");
  }
}
