/** Strip invisible and bidi override characters that can shift visible alignment in UI. */
export function normalizeEmailForDisplay(email: string): string {
  return email
    .trim()
    .replace(/\uFEFF/g, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "");
}

/** Split an email for two-line display: local part on line 1, "@domain" on line 2. */
export function splitEmailForDisplay(email: string): { localPart: string; domainLine: string } | null {
  const trimmed = normalizeEmailForDisplay(email);
  const at = trimmed.indexOf("@");
  if (at <= 0 || at >= trimmed.length - 1) {
    return null;
  }
  return {
    localPart: trimmed.slice(0, at).trimEnd(),
    domainLine: trimmed.slice(at),
  };
}
