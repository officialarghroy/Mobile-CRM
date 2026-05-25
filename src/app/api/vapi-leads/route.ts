import { NextResponse } from "next/server";
import { verifyVapiLeadsAuth } from "@/lib/vapiLeads/auth";
import { logVapiLeadsError, logVapiLeadsInfo } from "@/lib/vapiLeads/logger";
import { upsertVapiLead } from "@/lib/vapiLeads/service";
import type { VapiLeadApiResponse } from "@/lib/vapiLeads/types";
import { isRecord, validateAndSanitize } from "@/lib/vapiLeads/validate";

export const runtime = "nodejs";

function jsonResponse(body: VapiLeadApiResponse, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  const auth = verifyVapiLeadsAuth(request);
  if (!auth.ok) {
    logVapiLeadsError("Unauthorized webhook request");
    return jsonResponse({ success: false, message: auth.message }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    logVapiLeadsError("Invalid JSON body", error);
    return jsonResponse({ success: false, message: "Invalid JSON" }, 400);
  }

  logVapiLeadsInfo("Incoming webhook", {
    hasContactReason: Boolean(isRecord(body) && body.contact_reason),
    hasName: Boolean(isRecord(body) && body.name),
    hasPhone: Boolean(isRecord(body) && body.phone_number),
  });

  const validation = validateAndSanitize(body);
  if (!validation.ok) {
    logVapiLeadsError("Validation failed", undefined, { missing: validation.missing });
    return jsonResponse({ success: false, message: "Validation failed" }, 400);
  }

  const result = await upsertVapiLead(validation.data);
  const durationMs = Date.now() - startedAt;

  if (!result.ok) {
    logVapiLeadsError("Database operation failed", undefined, {
      durationMs,
      operation: result.operation,
      debug: result.debug,
      debugDetails: result.debugDetails,
    });
    return jsonResponse(
      {
        success: false,
        message: result.message,
        ...(result.debug ? { debug: result.debug } : {}),
        ...(result.debugDetails ? { debugDetails: result.debugDetails } : {}),
      },
      500,
    );
  }

  const message =
    result.action === "updated" ? "Lead updated successfully" : "Lead created successfully";

  logVapiLeadsInfo("Webhook processed", {
    action: result.action,
    leadId: result.leadId,
    durationMs,
  });

  return jsonResponse(
    {
      success: true,
      message,
      leadId: result.leadId,
      action: result.action,
    },
    result.action === "updated" ? 200 : 201,
  );
}

export async function GET() {
  return jsonResponse({ success: false, message: "Method not allowed" }, 405);
}
