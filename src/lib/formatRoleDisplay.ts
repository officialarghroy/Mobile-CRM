/** Split snake_case role for two-line UI: first segment / remainder (underscores → spaces on line 2). */
export function splitRoleForDisplay(role: string): { line1: string; line2: string | null } {
  const t = role.trim();
  const i = t.indexOf("_");
  if (i <= 0 || i >= t.length - 1) {
    return { line1: t, line2: null };
  }
  const first = t.slice(0, i);
  const rest = t
    .slice(i + 1)
    .split("_")
    .join(" ")
    .trim();
  return { line1: first, line2: rest || null };
}

export function formatRoleFirstSegment(segment: string): string {
  if (!segment) return segment;
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}
