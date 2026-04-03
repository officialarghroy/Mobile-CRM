"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { toUserError } from "@/lib/supabaseActionErrors";

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
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const equipmentBrand = String(formData.get("equipment_brand") ?? "").trim();
  const equipmentModel = String(formData.get("equipment_model") ?? "").trim();
  const brandModel = String(formData.get("brand_model") ?? "").trim();
  const issueDescription = String(formData.get("issue_description") ?? "").trim();
  if (!name) return;

  const type = rawType === "client" ? "client" : "lead";

  try {
    const { error } = await supabase.from("leads").insert({
      name,
      type,
      business: business || null,
      address: address || null,
      email: email || null,
      phone: phone || null,
      equipment_brand: equipmentBrand || null,
      equipment_model: equipmentModel || null,
      brand_model: brandModel || null,
      issue_description: issueDescription || null,
    });
    if (error) {
      const supabaseError = error as SupabaseError;
      if (supabaseError.code === "PGRST205") return;
      throw toUserError(error);
    }
    revalidatePath("/leads");
  } catch (error) {
    console.error("Failed to create lead:", error);
    throw toUserError(error, "Could not create this lead.");
  }
}
