"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseError = {
  code?: string;
  message?: string;
};

export async function createLead(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const name = String(formData.get("name") ?? "").trim();
  const business = String(formData.get("business") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const rawType = String(formData.get("type") || "").trim().toLowerCase();
  if (!name) return;

  const type = rawType === "client" ? "client" : "lead";

  try {
    const { error } = await supabase.from("leads").insert({
      name,
      type,
      business: business || null,
      address: address || null,
    });
    if (error) {
      const supabaseError = error as SupabaseError;
      if (supabaseError.code === "PGRST205") return;
      throw error;
    }
    revalidatePath("/leads");
  } catch (error) {
    console.error("Failed to create lead:", error);
    throw error;
  }
}
