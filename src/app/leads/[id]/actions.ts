"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function createLeadUpdate(leadId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: actionUser },
  } = await supabase.auth.getUser();
  const email = actionUser?.email;
  const content = String(formData.get("content") ?? "").trim();
  if (!content || !leadId || !email) return;

  try {
    const { error } = await supabase.from("lead_updates").insert({
      lead_id: leadId,
      content,
      created_by: email,
    });

    if (error) {
      throw error;
    }

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
  } catch (error) {
    console.error("Failed to create lead update:", error);
    throw error;
  }
}

export async function updateLead(leadId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!leadId) return;

  const name = String(formData.get("name") ?? "").trim();
  const business = String(formData.get("business") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const rawType = String(formData.get("type") || "").trim().toLowerCase();

  try {
    const { error } = await supabase
      .from("leads")
      .update({
        name,
        business,
        address,
        type: rawType === "client" ? "client" : "lead",
      })
      .eq("id", leadId)
      .select("id, type");

    if (error) {
      throw error;
    }

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
  } catch (error) {
    console.error("Failed to update lead:", error);
    throw error;
  }
}

export async function deleteLead(leadId: string, formData: FormData) {
  void formData;
  if (!leadId) return;

  const supabase = await createSupabaseServerClient();

  try {
    const { error: updatesError } = await supabase.from("lead_updates").delete().eq("lead_id", leadId);
    if (updatesError) throw updatesError;

    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) throw error;

    revalidatePath("/leads");
    redirect("/leads");
  } catch (error) {
    console.error("Failed to delete lead:", error);
    throw error;
  }
}
