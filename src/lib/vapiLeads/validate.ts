import type { SanitizedVapiLead, VapiLeadPayload } from "@/lib/vapiLeads/types";
import { sanitizeVapiLeadPayload } from "@/lib/vapiLeads/sanitize";

const REQUIRED_KEYS = ["name", "phone_number", "contact_reason"] as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseVapiLeadPayload(body: unknown): VapiLeadPayload | null {
  if (!isRecord(body)) return null;
  return {
    contact_reason: String(body.contact_reason ?? ""),
    name: String(body.name ?? ""),
    phone_number: String(body.phone_number ?? ""),
    address: body.address !== undefined ? String(body.address) : undefined,
    equipment_type: body.equipment_type !== undefined ? String(body.equipment_type) : undefined,
    brand: body.brand !== undefined ? String(body.brand) : undefined,
    issue_details: body.issue_details !== undefined ? String(body.issue_details) : undefined,
    preferred_time: body.preferred_time !== undefined ? String(body.preferred_time) : undefined,
    other_inquiries: body.other_inquiries !== undefined ? String(body.other_inquiries) : undefined,
  };
}

export function getMissingRequiredFields(sanitized: SanitizedVapiLead): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED_KEYS) {
    if (!sanitized[key]) missing.push(key);
  }
  return missing;
}

export function validateAndSanitize(body: unknown):
  | { ok: true; data: SanitizedVapiLead }
  | { ok: false; missing: string[] } {
  const parsed = parseVapiLeadPayload(body);
  if (!parsed) {
    return { ok: false, missing: [...REQUIRED_KEYS] };
  }
  const data = sanitizeVapiLeadPayload(parsed);
  const missing = getMissingRequiredFields(data);
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true, data };
}
