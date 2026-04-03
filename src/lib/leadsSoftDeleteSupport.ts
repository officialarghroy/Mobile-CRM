/** True when PostgREST reports that `leads.deleted_at` is missing (migration not applied). */
export function isMissingDeletedAtColumnError(error: { code?: string; message?: string }): boolean {
  const msg = String(error.message ?? "").toLowerCase();
  if (!msg.includes("deleted_at")) return false;
  if (error.code === "42703") return true;
  return (
    msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("could not find")
  );
}

/** True when contact/equipment columns on `leads` are missing (migration not applied). */
export function isMissingExtendedLeadColumnsError(error: { code?: string; message?: string }): boolean {
  const msg = String(error.message ?? "").toLowerCase();
  const hints =
    msg.includes("email") ||
    msg.includes("phone") ||
    msg.includes("equipment_brand") ||
    msg.includes("equipment_model") ||
    msg.includes("brand_model") ||
    msg.includes("issue_description");
  if (!hints) return false;
  if (error.code === "42703") return true;
  return msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("could not find");
}
