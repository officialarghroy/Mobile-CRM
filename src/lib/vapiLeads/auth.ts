import { timingSafeEqual } from "node:crypto";

function parseBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1]?.trim();
  return token || null;
}

function safeCompare(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * When `VAPI_LEADS_WEBHOOK_SECRET` is set, requests must send `Authorization: Bearer <secret>`.
 * When unset, auth is skipped (useful for local testing only).
 */
export function verifyVapiLeadsAuth(request: Request): { ok: true } | { ok: false; message: string } {
  const secret = process.env.VAPI_LEADS_WEBHOOK_SECRET?.trim();
  if (!secret) return { ok: true };

  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return { ok: false, message: "Unauthorized" };
  }
  if (!safeCompare(secret, token)) {
    return { ok: false, message: "Unauthorized" };
  }
  return { ok: true };
}
