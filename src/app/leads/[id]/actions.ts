"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { toUserError } from "@/lib/supabaseActionErrors";

export async function createLeadUpdate(leadId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: actionUser },
  } = await supabase.auth.getUser();
  const email = actionUser?.email;
  const content = String(formData.get("content") ?? "").trim();
  if (!content || !leadId || !email) return;

  try {
    const { data: activeLead, error: leadCheckError } = await supabase
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .is("deleted_at", null)
      .maybeSingle();

    if (leadCheckError) throw toUserError(leadCheckError);
    if (!activeLead) return;

    const { error } = await supabase.from("lead_updates").insert({
      lead_id: leadId,
      content,
      created_by: email,
    });

    if (error) {
      throw toUserError(error);
    }

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
  } catch (error) {
    console.error("Failed to create lead update:", error);
    throw toUserError(error, "Could not add this update.");
  }
}

export async function updateLead(leadId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!leadId) return;

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

  try {
    const { data: updatedRows, error } = await supabase
      .from("leads")
      .update({
        name,
        business,
        address,
        type: rawType === "client" ? "client" : "lead",
        email: email || null,
        phone: phone || null,
        equipment_brand: equipmentBrand || null,
        equipment_model: equipmentModel || null,
        brand_model: brandModel || null,
        issue_description: issueDescription || null,
      })
      .eq("id", leadId)
      .is("deleted_at", null)
      .select("id, type");

    if (error) {
      throw toUserError(error);
    }

    if (!updatedRows?.length) {
      throw new Error("This lead is in Recently deleted and cannot be edited.");
    }

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
  } catch (error) {
    console.error("Failed to update lead:", error);
    throw toUserError(error, "Could not save this lead.");
  }
}

function normalizeConfirmationName(value: unknown): string {
  return String(value ?? "").trim();
}

export async function softDeleteLead(leadId: string, formData: FormData) {
  if (!leadId) return;

  const confirmation = normalizeConfirmationName(formData.get("confirmationName"));
  const supabase = await createSupabaseServerClient();

  try {
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("name, deleted_at")
      .eq("id", leadId)
      .maybeSingle();

    if (fetchError) throw toUserError(fetchError);
    if (!lead) {
      throw new Error("Lead not found.");
    }
    if (lead.deleted_at) {
      throw new Error("This lead is already in Recently deleted.");
    }

    const expected = normalizeConfirmationName(lead.name);
    if (!expected || confirmation !== expected) {
      throw new Error("Type the lead name exactly to confirm.");
    }

    const { data: updatedRows, error } = await supabase
      .from("leads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", leadId)
      .is("deleted_at", null)
      .select("id");

    if (error) throw toUserError(error);
    if (!updatedRows?.length) {
      throw new Error("Could not move this lead to Recently deleted.");
    }

    revalidatePath("/leads");
    revalidatePath("/leads/deleted");
    revalidatePath(`/leads/${leadId}`);
  } catch (error) {
    console.error("Failed to soft-delete lead:", error);
    throw toUserError(error, "Could not move this lead to Recently deleted.");
  }
}

export async function restoreLead(leadId: string) {
  if (!leadId) return;

  const supabase = await createSupabaseServerClient();

  try {
    const { data: restoredRows, error } = await supabase
      .from("leads")
      .update({ deleted_at: null })
      .eq("id", leadId)
      .not("deleted_at", "is", null)
      .select("id");

    if (error) throw toUserError(error);
    if (!restoredRows?.length) {
      throw new Error("Could not restore this lead.");
    }

    revalidatePath("/leads");
    revalidatePath("/leads/deleted");
    revalidatePath(`/leads/${leadId}`);
  } catch (error) {
    console.error("Failed to restore lead:", error);
    throw toUserError(error, "Could not restore this lead.");
  }
}

export async function permanentlyDeleteLead(leadId: string, formData: FormData) {
  if (!leadId) return;

  const confirmation = normalizeConfirmationName(formData.get("confirmationName"));
  const supabase = await createSupabaseServerClient();

  try {
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("name, deleted_at")
      .eq("id", leadId)
      .maybeSingle();

    if (fetchError) throw toUserError(fetchError);
    if (!lead?.deleted_at) {
      throw new Error("Only leads in Recently deleted can be permanently removed.");
    }

    const expected = normalizeConfirmationName(lead.name);
    if (!expected || confirmation !== expected) {
      throw new Error("Type the lead name exactly to confirm.");
    }

    const { error: updatesError } = await supabase.from("lead_updates").delete().eq("lead_id", leadId);
    if (updatesError) throw toUserError(updatesError);

    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) throw toUserError(error);

    revalidatePath("/leads");
    revalidatePath("/leads/deleted");
  } catch (error) {
    console.error("Failed to permanently delete lead:", error);
    throw toUserError(error, "Could not permanently delete this lead.");
  }
}
