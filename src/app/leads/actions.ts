"use server";

import { revalidatePath } from "next/cache";
import { isMissingDeletedAtColumnError } from "@/lib/leadsSoftDeleteSupport";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { toUserError } from "@/lib/supabaseActionErrors";

type SupabaseError = {
  code?: string;
  message?: string;
};

const LEAD_STATUSES = new Set(["pending", "urgent", "paid", "not_paid"]);

function parsePriorityOrder(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Next priority so a new lead sorts above all existing rows (list is sorted by priority desc, then created_at). */
async function nextPriorityOrderForNewLead(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<number | undefined> {
  let query = supabase
    .from("leads")
    .select("priority_order")
    .is("deleted_at", null)
    .order("priority_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let { data, error } = await query;

  if (error && isMissingDeletedAtColumnError(error)) {
    const retry = await supabase
      .from("leads")
      .select("priority_order")
      .order("priority_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    const msg = String((error as SupabaseError).message ?? "").toLowerCase();
    const missingPriority =
      (error as SupabaseError).code === "42703" ||
      (msg.includes("does not exist") && msg.includes("priority_order"));
    if (missingPriority) return undefined;
    console.error("nextPriorityOrderForNewLead:", (error as SupabaseError).message);
    return undefined;
  }

  const max = parsePriorityOrder(data?.priority_order);
  return max + 1;
}

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
    const priority_order = await nextPriorityOrderForNewLead(supabase);

    const row: Record<string, unknown> = {
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
    };
    if (priority_order !== undefined) {
      row.priority_order = priority_order;
    }

    const { error } = await supabase.from("leads").insert(row);
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
