export type VapiLeadPayload = {
  contact_reason: string;
  name: string;
  phone_number: string;
  address?: string;
  equipment_type?: string;
  brand?: string;
  issue_details?: string;
  preferred_time?: string;
  other_inquiries?: string;
};

export type SanitizedVapiLead = {
  contact_reason: string;
  name: string;
  phone_number: string;
  address: string;
  equipment_type: string;
  brand: string;
  issue_details: string;
  preferred_time: string;
  other_inquiries: string;
};

/** Bumped when changing webhook API behavior; visible in responses to verify deploys. */
export const VAPI_LEADS_API_BUILD = "2026-05-25-force-debug-v2";

export type VapiLeadApiMeta = {
  debug_test: "deployment working";
  api_build: string;
  node_env: string;
};

export type VapiLeadApiSuccess = VapiLeadApiMeta & {
  success: true;
  message: string;
  leadId?: string;
  action?: "created" | "updated";
};

export type VapiLeadApiErrorDebug = {
  message: string;
  code: string | null;
  category: string;
  failedColumns: string[];
  likelyCause: string;
  details: string | null;
  hint: string | null;
};

export type VapiLeadApiError = VapiLeadApiMeta & {
  success: false;
  message: string;
  debug: string;
  debugDetails: VapiLeadApiErrorDebug;
  operation?: "insert" | "update" | "select_duplicate";
};

export type VapiLeadApiResponse = VapiLeadApiSuccess | VapiLeadApiError;
