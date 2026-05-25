import type { AnalyzedVapiDbError } from "@/lib/vapiLeads/dbError";
import { analyzeSupabaseDbError, serializeSupabaseError } from "@/lib/vapiLeads/dbError";

const PREFIX = "[vapi-leads]";

export function logVapiLeadsInfo(message: string, meta?: Record<string, unknown>) {
  if (meta && Object.keys(meta).length > 0) {
    console.log(PREFIX, message, meta);
    return;
  }
  console.log(PREFIX, message);
}

export function logVapiLeadsError(message: string, error?: unknown, meta?: Record<string, unknown>) {
  const payload: Record<string, unknown> = { ...meta };
  if (error instanceof Error) {
    payload.errorMessage = error.message;
    payload.stack = error.stack;
  } else if (error !== undefined) {
    payload.error = error;
  }
  if (Object.keys(payload).length > 0) {
    console.error(PREFIX, message, payload);
    return;
  }
  console.error(PREFIX, message);
}

export function logVapiLeadsDbOperation(
  operation: "insert" | "update" | "select_duplicate",
  meta: {
    payload?: Record<string, unknown>;
    leadId?: string;
    error?: unknown;
    analyzed?: AnalyzedVapiDbError;
  },
) {
  const base: Record<string, unknown> = {
    operation,
    leadId: meta.leadId,
  };

  if (meta.payload) {
    base.payload = meta.payload;
    base.payloadKeys = Object.keys(meta.payload);
  }

  if (meta.error) {
    const analyzed = meta.analyzed ?? analyzeSupabaseDbError(meta.error);
    base.supabaseError = serializeSupabaseError(meta.error);
    base.errorCategory = analyzed.category;
    base.errorCode = analyzed.code;
    base.errorMessage = analyzed.message;
    base.errorDetails = analyzed.details;
    base.errorHint = analyzed.hint;
    base.failedColumns = analyzed.failedColumns;
    base.likelyCause = analyzed.likelyCause;
    console.error(PREFIX, `Database ${operation} failed`, base);
    return;
  }

  console.log(PREFIX, `Database ${operation}`, base);
}
