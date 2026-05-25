import type { SanitizedVapiLead, VapiLeadPayload } from "@/lib/vapiLeads/types";

const MAX = {
  contact_reason: 120,
  name: 200,
  phone_number: 40,
  address: 500,
  equipment_type: 200,
  brand: 200,
  issue_details: 4000,
  preferred_time: 200,
  other_inquiries: 4000,
} as const;

/** Strip control chars and trim; cap length for storage safety. */
function sanitizeText(value: unknown, maxLen: number): string {
  const raw = String(value ?? "");
  const cleaned = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
}

/** Digits-only key for duplicate detection (keeps display phone human-readable). */
export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function sanitizeVapiLeadPayload(payload: VapiLeadPayload): SanitizedVapiLead {
  return {
    contact_reason: sanitizeText(payload.contact_reason, MAX.contact_reason),
    name: sanitizeText(payload.name, MAX.name),
    phone_number: sanitizeText(payload.phone_number, MAX.phone_number),
    address: sanitizeText(payload.address, MAX.address),
    equipment_type: sanitizeText(payload.equipment_type, MAX.equipment_type),
    brand: sanitizeText(payload.brand, MAX.brand),
    issue_details: sanitizeText(payload.issue_details, MAX.issue_details),
    preferred_time: sanitizeText(payload.preferred_time, MAX.preferred_time),
    other_inquiries: sanitizeText(payload.other_inquiries, MAX.other_inquiries),
  };
}
