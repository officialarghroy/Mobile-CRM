export type PostgrestErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

export type VapiDbErrorCategory =
  | "missing_env"
  | "missing_column"
  | "schema_cache"
  | "check_constraint"
  | "enum_invalid"
  | "not_null"
  | "rls"
  | "permission"
  | "foreign_key"
  | "unique"
  | "connection"
  | "unknown";

export type AnalyzedVapiDbError = {
  category: VapiDbErrorCategory;
  code: string | null;
  message: string;
  details: string | null;
  hint: string | null;
  failedColumns: string[];
  raw: PostgrestErrorLike;
  summary: string;
  likelyCause: string;
};

const COLUMN_PATTERNS = [
  /column ["']?(\w+)["']? (?:of relation|does not exist)/i,
  /Could not find the ['"](\w+)['"] column of ['"]leads['"]/i,
  /['"](\w+)['"] column of ['"]leads['"]/i,
  /missing column[s]?:?\s*([a-z0-9_,\s]+)/i,
];

const VAPI_COLUMN_HINTS = new Set([
  "source",
  "contact_reason",
  "preferred_time",
  "other_inquiries",
  "phone",
  "email",
  "equipment_brand",
  "equipment_model",
  "issue_description",
  "deleted_at",
  "priority_order",
  "status",
]);

export function isVapiLeadsDebugEnabled(): boolean {
  if (process.env.VAPI_LEADS_DEBUG === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function serializeSupabaseError(error: unknown): PostgrestErrorLike {
  if (error == null) return { message: "Unknown error (null)" };
  if (typeof error === "string") return { message: error };
  if (error instanceof Error) {
    const extra = error as Error & PostgrestErrorLike;
    return {
      code: extra.code,
      message: extra.message ?? error.message,
      details: extra.details ?? null,
      hint: extra.hint ?? null,
    };
  }
  if (typeof error === "object") {
    const o = error as PostgrestErrorLike;
    return {
      code: o.code ?? undefined,
      message: o.message ?? JSON.stringify(error),
      details: o.details ?? null,
      hint: o.hint ?? null,
    };
  }
  return { message: String(error) };
}

function extractFailedColumns(message: string, details: string | null): string[] {
  const found = new Set<string>();
  const haystack = `${message} ${details ?? ""}`;

  for (const pattern of COLUMN_PATTERNS) {
    const match = haystack.match(pattern);
    if (!match?.[1]) continue;
    const chunk = match[1];
    for (const part of chunk.split(/[,\s]+/)) {
      const col = part.replace(/['"]/g, "").trim().toLowerCase();
      if (col && /^[a-z_][a-z0-9_]*$/.test(col)) found.add(col);
    }
  }

  for (const col of VAPI_COLUMN_HINTS) {
    if (haystack.toLowerCase().includes(col)) found.add(col);
  }

  return [...found];
}

function classifyError(code: string, message: string): VapiDbErrorCategory {
  const lower = message.toLowerCase();

  if (
    lower.includes("supabase_service_role_key") ||
    lower.includes("next_public_supabase_url") ||
    lower.includes("for admin operations")
  ) {
    return "missing_env";
  }

  if (code === "42501" || lower.includes("row-level security") || lower.includes("rls")) {
    return "rls";
  }
  if (
    code === "PGRST301" ||
    lower.includes("permission denied") ||
    lower.includes("not authorized") ||
    lower.includes("jwt")
  ) {
    return "permission";
  }
  if (
    code === "42703" ||
    code === "PGRST204" ||
    lower.includes("schema cache") ||
    lower.includes("could not find") ||
    lower.includes("does not exist")
  ) {
    return lower.includes("schema cache") ? "schema_cache" : "missing_column";
  }
  if (code === "23514" || lower.includes("check constraint")) {
    return "check_constraint";
  }
  if (lower.includes("invalid input value for enum") || (lower.includes("enum") && lower.includes("status"))) {
    return "enum_invalid";
  }
  if (code === "23502" || lower.includes("not-null") || lower.includes("not null")) {
    return "not_null";
  }
  if (code === "23503" || lower.includes("foreign key")) {
    return "foreign_key";
  }
  if (code === "23505" || lower.includes("unique") || lower.includes("duplicate key")) {
    return "unique";
  }
  if (lower.includes("fetch failed") || lower.includes("econnrefused") || lower.includes("network")) {
    return "connection";
  }

  return "unknown";
}

function buildLikelyCause(
  category: VapiDbErrorCategory,
  failedColumns: string[],
  message: string,
): string {
  const vapiCols = failedColumns.filter((c) =>
    ["source", "contact_reason", "preferred_time", "other_inquiries"].includes(c),
  );

  switch (category) {
    case "missing_env":
      return "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (local) and Netlify/host env vars (production). Find it in Supabase Dashboard → Project Settings → API → service_role secret.";
    case "missing_column":
    case "schema_cache":
      if (vapiCols.length > 0) {
        return `Table/schema mismatch: run supabase/migrations/20260525120000_vapi_leads_webhook_fields.sql in Supabase SQL Editor (missing: ${vapiCols.join(", ")}).`;
      }
      return `Table/schema mismatch: a column in the insert payload does not exist on public.leads. Run supabase/MANUAL_RUN_leads_schema.sql and the vapi migration. Failed hints: ${failedColumns.join(", ") || "see message"}.`;
    case "check_constraint":
      if (message.toLowerCase().includes("status")) {
        return 'Status value "new" is not allowed yet. Run supabase/migrations/20260525120000_vapi_leads_webhook_fields.sql to add "new" to leads_status_values_chk.';
      }
      return "A CHECK constraint on public.leads rejected one or more field values.";
    case "enum_invalid":
      return 'The leads.status column may be a PostgreSQL enum that does not include "new". Apply the vapi migration or map status to "pending".';
    case "rls":
      return "RLS blocked the operation. Webhook should use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). Verify the env var is set and matches your Supabase project.";
    case "permission":
      return "Permission denied. Confirm SUPABASE_SERVICE_ROLE_KEY is set server-side and PostgREST allows insert/update on public.leads.";
    case "not_null":
      return `A required NOT NULL column on public.leads was not provided. Check failed columns: ${failedColumns.join(", ") || "see message"}.`;
    default:
      return "See debug.message and server logs for the full PostgREST/Postgres error.";
  }
}

export function analyzeSupabaseDbError(error: unknown): AnalyzedVapiDbError {
  const raw = serializeSupabaseError(error);
  const code = raw.code ? String(raw.code) : "";
  const message = String(raw.message ?? "Unknown database error");
  const details = raw.details ?? null;
  const hint = raw.hint ?? null;
  const category = classifyError(code, message);
  const failedColumns = extractFailedColumns(message, details);
  const likelyCause = buildLikelyCause(category, failedColumns, message);

  return {
    category,
    code: code || null,
    message,
    details,
    hint,
    failedColumns,
    raw,
    summary: `[${category}] ${message}`,
    likelyCause,
  };
}

export function buildDebugPayload(analyzed: AnalyzedVapiDbError) {
  return {
    message: analyzed.message,
    code: analyzed.code,
    category: analyzed.category,
    failedColumns: analyzed.failedColumns,
    likelyCause: analyzed.likelyCause,
    details: analyzed.details,
    hint: analyzed.hint,
  };
}
