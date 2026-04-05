function supabaseErrorParts(error: unknown): { code: string; message: string } {
  if (error instanceof Error) {
    return { code: "", message: error.message };
  }
  if (typeof error === "object" && error !== null) {
    const o = error as { code?: string; message?: string };
    return { code: String(o.code ?? ""), message: String(o.message ?? "") };
  }
  return { code: "", message: String(error ?? "") };
}

/** PostgREST / Supabase when `events` lacks team vs personal columns (migration not applied). */
export function isLegacyCalendarEventsSchemaError(error: unknown): boolean {
  const { code, message } = supabaseErrorParts(error);
  const lower = message.toLowerCase();

  // RLS or permission: not missing-column / schema cache
  if (
    code === "42501" ||
    lower.includes("row-level security") ||
    lower.includes("violates row-level security")
  ) {
    return false;
  }

  if (code === "PGRST204") {
    return lower.includes("calendar_scope") || lower.includes("owner_user_id");
  }

  if (code === "42703") {
    return (
      lower.includes("events") &&
      (lower.includes("calendar_scope") || lower.includes("owner_user_id"))
    );
  }

  if (!lower.includes("events")) return false;
  if (!(lower.includes("calendar_scope") || lower.includes("owner_user_id"))) return false;

  return (
    lower.includes("schema cache") ||
    lower.includes("does not exist") ||
    lower.includes("could not find the")
  );
}

export const CALENDAR_EVENTS_MIGRATION_HINT =
  "Run supabase/MANUAL_RUN_calendar_events.sql in the Supabase SQL Editor. If you already ran it, open Project Settings → API → Reload schema, then refresh this page.";

export const CALENDAR_PERSONAL_REQUIRES_MIGRATION =
  `Personal events need the calendar database columns (or a refreshed API schema). ${CALENDAR_EVENTS_MIGRATION_HINT}`;
