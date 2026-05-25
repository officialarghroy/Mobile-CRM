import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingDeletedAtColumnError } from "@/lib/leadsSoftDeleteSupport";
import { logVapiLeadsError } from "@/lib/vapiLeads/logger";
import { normalizePhoneDigits } from "@/lib/vapiLeads/sanitize";
import type { SanitizedVapiLead } from "@/lib/vapiLeads/types";

const VAPI_SOURCE = "vapi_ai";
const VAPI_STATUS = "new";
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

type LeadRow = {
  id: string;
  phone: string | null;
  status: string | null;
  created_at: string;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

function parsePriorityOrder(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

async function nextPriorityOrderForNewLead(
  supabase: ReturnType<typeof createSupabaseAdmin>,
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
    logVapiLeadsError("nextPriorityOrderForNewLead failed", error);
    return undefined;
  }

  return parsePriorityOrder(data?.priority_order) + 1;
}

function buildLeadRow(data: SanitizedVapiLead, priorityOrder?: number): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: data.name,
    type: "lead",
    phone: data.phone_number,
    address: data.address || null,
    equipment_brand: data.brand || null,
    equipment_model: data.equipment_type || null,
    issue_description: data.issue_details || null,
    source: VAPI_SOURCE,
    status: VAPI_STATUS,
    contact_reason: data.contact_reason,
    preferred_time: data.preferred_time || null,
    other_inquiries: data.other_inquiries || null,
  };
  if (priorityOrder !== undefined) {
    row.priority_order = priorityOrder;
  }
  return row;
}

async function findDuplicateLead(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  phoneDigits: string,
): Promise<LeadRow | null> {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();

  let query = supabase
    .from("leads")
    .select("id, phone, status, created_at")
    .gte("created_at", since)
    .not("phone", "is", null)
    .order("created_at", { ascending: false });

  const withSoftDelete = await query.is("deleted_at", null);
  let rows = withSoftDelete.data as LeadRow[] | null;
  let error = withSoftDelete.error;

  if (error && isMissingDeletedAtColumnError(error)) {
    const retry = await supabase
      .from("leads")
      .select("id, phone, status, created_at")
      .gte("created_at", since)
      .not("phone", "is", null)
      .order("created_at", { ascending: false });
    rows = retry.data as LeadRow[] | null;
    error = retry.error;
  }

  if (error) {
    throw error;
  }

  const match = (rows ?? []).find((row) => normalizePhoneDigits(String(row.phone ?? "")) === phoneDigits);
  return match ?? null;
}

export type UpsertVapiLeadResult =
  | { ok: true; action: "created" | "updated"; leadId: string }
  | { ok: false; message: string };

export async function upsertVapiLead(data: SanitizedVapiLead): Promise<UpsertVapiLeadResult> {
  const supabase = createSupabaseAdmin();
  const phoneDigits = normalizePhoneDigits(data.phone_number);

  try {
    const existing = await findDuplicateLead(supabase, phoneDigits);

    if (existing) {
      const updateRow = buildLeadRow(data);
      const currentStatus = String(existing.status ?? "").trim().toLowerCase();
      if (currentStatus && currentStatus !== VAPI_STATUS) {
        delete updateRow.status;
      }

      const { error } = await supabase.from("leads").update(updateRow).eq("id", existing.id);
      if (error) {
        logVapiLeadsError("Failed to update duplicate vapi lead", error, { leadId: existing.id });
        return { ok: false, message: "Database error" };
      }
      return { ok: true, action: "updated", leadId: existing.id };
    }

    const priority_order = await nextPriorityOrderForNewLead(supabase);
    const insertRow = buildLeadRow(data, priority_order);
    const { data: inserted, error } = await supabase
      .from("leads")
      .insert(insertRow)
      .select("id")
      .single();

    if (error) {
      logVapiLeadsError("Failed to insert vapi lead", error);
      return { ok: false, message: "Database error" };
    }

    return { ok: true, action: "created", leadId: String(inserted.id) };
  } catch (error) {
    logVapiLeadsError("upsertVapiLead unexpected error", error);
    return { ok: false, message: "Database error" };
  }
}
