/**
 * Converts a value from `<input type="datetime-local">` (local wall time, no timezone suffix)
 * into an ISO 8601 UTC string suitable for Postgres `timestamptz` via the Supabase client.
 *
 * Relying on the raw string (e.g. `2026-04-03T14:30`) is fragile across drivers and time zones.
 */
export function parseDatetimeLocalToIsoUtc(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  const withSeconds = raw.length === 16 ? `${raw}:00` : raw;
  const m = withSeconds.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const s = m[6] != null ? Number(m[6]) : 0;

  if ([y, mo, d, h, mi, s].some((n) => Number.isNaN(n))) return null;
  if (mo < 0 || mo > 11 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return null;

  const local = new Date(y, mo, d, h, mi, s, 0);
  if (Number.isNaN(local.getTime())) return null;

  if (
    local.getFullYear() !== y ||
    local.getMonth() !== mo ||
    local.getDate() !== d ||
    local.getHours() !== h ||
    local.getMinutes() !== mi
  ) {
    return null;
  }

  return local.toISOString();
}
