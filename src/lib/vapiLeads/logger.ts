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
