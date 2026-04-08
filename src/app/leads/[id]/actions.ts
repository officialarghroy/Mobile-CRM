"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { toUserError } from "@/lib/supabaseActionErrors";

/**
 * Supabase Storage only accepts a strict S3-style key set (no spaces, limited punctuation, ASCII).
 * Real device filenames (e.g. macOS screenshots) break uploads without this.
 */
function sanitizeCrmStorageFileName(originalName: string): string {
  const raw = (originalName || "").trim();
  const lastDot = raw.lastIndexOf(".");
  const base = lastDot > 0 ? raw.slice(0, lastDot) : raw;
  const extPart = lastDot > 0 ? raw.slice(lastDot + 1) : "";

  const ext =
    extPart.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 10) || "bin";

  const asciiBase = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

  const namePart = asciiBase || "image";
  return `${namePart}.${ext}`;
}

export async function createLeadUpdate(leadId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: actionUser },
  } = await supabase.auth.getUser();
  const email = actionUser?.email;
  const contentRaw = String(formData.get("content") ?? "");
  const content = contentRaw.trim();
  if (!leadId || !email) return;

  try {
    const { data: activeLead, error: leadCheckError } = await supabase
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .is("deleted_at", null)
      .maybeSingle();

    if (leadCheckError) throw toUserError(leadCheckError);
    if (!activeLead) return;

    const files = formData.getAll("images");
    const imageFiles = files
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
      .slice(0, 5);

    if (!content && imageFiles.length === 0) return;

    const imageUrls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const safeName = sanitizeCrmStorageFileName(file.name);
      const unique = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 10)}`;
      const path = `leads/${leadId}/updates/${unique}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("crm-images").upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (uploadError) throw toUserError(uploadError);
      const {
        data: { publicUrl },
      } = supabase.storage.from("crm-images").getPublicUrl(path);
      imageUrls.push(publicUrl);
    }

    const { error } = await supabase.from("lead_updates").insert({
      lead_id: leadId,
      content,
      created_by: email,
      image_urls: imageUrls.length ? imageUrls : null,
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
