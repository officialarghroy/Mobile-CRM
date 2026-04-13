"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { toUserError } from "@/lib/supabaseActionErrors";

type SupabaseError = {
  code?: string;
  message?: string;
};

const LEAD_STATUSES = new Set(["pending", "urgent", "paid", "not_paid"]);

export type LeadPersistResult = { success: true } | { success: false };

export async function markLeadAsRead(leadId: string): Promise<LeadPersistResult> {
  const id = String(leadId ?? "").trim();
  if (!id) return { success: false };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("leads")
      .update({ is_read: true })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      console.error("markLeadAsRead:", error.message);
      return { success: false };
    }

    revalidatePath("/leads");
    return { success: true };
  } catch (e) {
    console.error("markLeadAsRead:", e);
    return { success: false };
  }
}

export async function updateLeadStatus(leadId: string, status: string): Promise<LeadPersistResult> {
  const id = String(leadId ?? "").trim();
  const s = String(status ?? "").trim().toLowerCase();
  if (!id || !LEAD_STATUSES.has(s)) return { success: false };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("leads")
      .update({ status: s })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      console.error("updateLeadStatus:", error.message);
      return { success: false };
    }

    revalidatePath("/leads");
    return { success: true };
  } catch (e) {
    console.error("updateLeadStatus:", e);
    return { success: false };
  }
}

export async function updateLeadPriority(leadId: string, priority: number): Promise<LeadPersistResult> {
  const id = String(leadId ?? "").trim();
  if (!id || !Number.isFinite(priority)) return { success: false };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("leads")
      .update({ priority_order: priority })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      console.error("updateLeadPriority:", error.message);
      return { success: false };
    }

    revalidatePath("/leads");
    return { success: true };
  } catch (e) {
    console.error("updateLeadPriority:", e);
    return { success: false };
  }
}

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
