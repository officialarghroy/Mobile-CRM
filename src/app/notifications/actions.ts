"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { toUserError } from "@/lib/supabaseActionErrors";

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in.");
  }

  const id = notificationId.trim();
  if (!id) {
    throw new Error("Missing notification.");
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw toUserError(error, "Could not update this notification.");
    }
    if (!data) {
      throw new Error("Notification not found or you may not have access.");
    }

    revalidatePath("/notifications", "page");
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw toUserError(err, "Could not update this notification.");
  }
}
