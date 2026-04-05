/** Map Supabase/PostgREST failures to short messages for modals and toasts. */
type SupabaseLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

const MISSING_DELETED_AT =
  "Your database is missing the leads.deleted_at column. Run the SQL in supabase/MANUAL_RUN_leads_schema.sql in the Supabase SQL Editor, then try again.";

const MISSING_EXTENDED =
  "Your database is missing new lead columns (email, phone, equipment, etc.). Run the SQL in supabase/MANUAL_RUN_leads_schema.sql in the Supabase SQL Editor, then try again.";

const GENERIC_MISSING_COLUMN =
  "A required column is missing on leads. Run supabase/MANUAL_RUN_leads_schema.sql in the Supabase SQL Editor, then try again.";

const MISSING_EVENTS_CALENDAR_SCOPE =
  "Your calendar database is missing team or personal columns. Run supabase/MANUAL_RUN_calendar_events.sql in the Supabase SQL Editor, then try again.";

function parse42703Message(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    (lower.includes("calendar_scope") || lower.includes("owner_user_id")) &&
    lower.includes("events")
  ) {
    return MISSING_EVENTS_CALENDAR_SCOPE;
  }
  if (lower.includes("deleted_at")) return MISSING_DELETED_AT;
  if (
    lower.includes("email") ||
    lower.includes("phone") ||
    lower.includes("equipment_brand") ||
    lower.includes("equipment_model") ||
    lower.includes("brand_model") ||
    lower.includes("issue_description")
  ) {
    return MISSING_EXTENDED;
  }
  return GENERIC_MISSING_COLUMN;
}

function fromSupabaseLike(e: SupabaseLike): string | null {
  const code = e.code ?? "";
  const msg = String(e.message ?? "");

  if (code === "42703" || msg.includes('"42703"') || msg.includes("42703")) {
    return parse42703Message(msg);
  }

  if (msg && !msg.trimStart().startsWith("{")) {
    return msg;
  }

  return null;
}

/** Safe for client (modal catch) and server. */
export function getUserFacingErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error == null) return fallback;
  if (typeof error === "string") return error || fallback;

  if (error instanceof Error) {
    const fromMsg = fromSupabaseLike({ message: error.message });
    if (fromMsg) return fromMsg;
    if (error.message && !error.message.trimStart().startsWith("{")) {
      return error.message;
    }
  }

  if (typeof error === "object") {
    const o = error as SupabaseLike;
    const fromO = fromSupabaseLike(o);
    if (fromO) return fromO;
  }

  return fallback;
}

/** Re-throw as a normal Error so server actions and clients never surface raw PostgREST objects. */
export function toUserError(error: unknown, fallback = "Something went wrong. Please try again."): Error {
  return new Error(getUserFacingErrorMessage(error, fallback));
}
