import { NextResponse } from "next/server";
import { verifyVapiLeadsAuth } from "@/lib/vapiLeads/auth";
import { logVapiLeadsError, logVapiLeadsInfo } from "@/lib/vapiLeads/logger";
import { upsertVapiLead } from "@/lib/vapiLeads/service";
import {
  VAPI_LEADS_API_BUILD,
  type VapiLeadApiError,
  type VapiLeadApiMeta,
  type VapiLeadApiResponse,
} from "@/lib/vapiLeads/types";
import { isRecord, validateAndSanitize } from "@/lib/vapiLeads/validate";

export const runtime = "nodejs";

function apiMeta(): VapiLeadApiMeta {
  return {
    debug_test: "deployment working",
    api_build: VAPI_LEADS_API_BUILD,
    node_env: process.env.NODE_ENV ?? "unknown",
  };
}

function jsonResponse(body: VapiLeadApiResponse, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Vapi-Leads-Build": VAPI_LEADS_API_BUILD,
    },
  });
}

function databaseErrorResponse(
  result: Extract<Awaited<ReturnType<typeof upsertVapiLead>>, { ok: false }>,
): VapiLeadApiError {
  return {
    ...apiMeta(),
    success: false,
    message: result.message,
    debug: result.debug,
    debugDetails: result.debugDetails,
    operation: result.operation,
  };
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  const auth = verifyVapiLeadsAuth(request);
  if (!auth.ok) {
    logVapiLeadsError("Unauthorized webhook request");
    return jsonResponse(
      {
        ...apiMeta(),
        success: false,
        message: auth.message,
        debug: "Unauthorized",
        debugDetails: {
          message: "Unauthorized",
          code: null,
          category: "permission",
          failedColumns: [],
          likelyCause: "Missing or invalid Authorization Bearer token.",
          details: null,
          hint: null,
        },
      },
      401,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    logVapiLeadsError("Invalid JSON body", error);
    return jsonResponse(
      {
        ...apiMeta(),
        success: false,
        message: "Invalid JSON",
        debug: error instanceof Error ? error.message : "Invalid JSON",
        debugDetails: {
          message: "Invalid JSON",
          code: null,
          category: "unknown",
          failedColumns: [],
          likelyCause: "Request body must be valid JSON.",
          details: null,
          hint: null,
        },
      },
      400,
    );
  }

  logVapiLeadsInfo("Incoming webhook", {
    api_build: VAPI_LEADS_API_BUILD,
    node_env: process.env.NODE_ENV,
    hasContactReason: Boolean(isRecord(body) && body.contact_reason),
    hasName: Boolean(isRecord(body) && body.name),
    hasPhone: Boolean(isRecord(body) && body.phone_number),
  });

  const validation = validateAndSanitize(body);
  if (!validation.ok) {
    logVapiLeadsError("Validation failed", undefined, { missing: validation.missing });
    return jsonResponse(
      {
        ...apiMeta(),
        success: false,
        message: "Validation failed",
        debug: `Missing required fields: ${validation.missing.join(", ")}`,
        debugDetails: {
          message: "Validation failed",
          code: null,
          category: "unknown",
          failedColumns: validation.missing,
          likelyCause: "Provide name, phone_number, and contact_reason.",
          details: null,
          hint: null,
        },
      },
      400,
    );
  }

  const result = await upsertVapiLead(validation.data);
  const durationMs = Date.now() - startedAt;

  if (!result.ok) {
    logVapiLeadsError("Database operation failed", undefined, {
      durationMs,
      operation: result.operation,
      debug: result.debug,
      debugDetails: result.debugDetails,
      api_build: VAPI_LEADS_API_BUILD,
    });
    return jsonResponse(databaseErrorResponse(result), 500);
  }

  const message =
    result.action === "updated" ? "Lead updated successfully" : "Lead created successfully";

  logVapiLeadsInfo("Webhook processed", {
    action: result.action,
    leadId: result.leadId,
    durationMs,
    api_build: VAPI_LEADS_API_BUILD,
  });

  return jsonResponse(
    {
      ...apiMeta(),
      success: true,
      message,
      leadId: result.leadId,
      action: result.action,
    },
    result.action === "updated" ? 200 : 201,
  );
}

/** Health check: confirms deploy version without creating a lead. */
export async function GET() {
  return jsonResponse(
    {
      ...apiMeta(),
      success: true,
      message: "Vapi leads API is reachable",
    },
    200,
  );
}
