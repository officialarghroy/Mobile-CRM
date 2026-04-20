export type LeadListSortRow = {
  created_at: string;
  priority_order?: number;
};

export function sortLeadsForDisplay<T extends LeadListSortRow>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const pa = a.priority_order ?? 0;
    const pb = b.priority_order ?? 0;
    if (pb !== pa) return pb - pa;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export type LeadSearchableRow = {
  name: string;
  business: string;
  address: string;
  update: string;
  type: "lead" | "client";
  status?: "pending" | "urgent" | "paid" | "not_paid";
};

const TYPE_DISPLAY: Record<LeadSearchableRow["type"], string> = {
  lead: "Lead",
  client: "Client",
};

const STATUS_OPTIONS: { value: NonNullable<LeadSearchableRow["status"]>; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "urgent", label: "Urgent" },
  { value: "paid", label: "Paid" },
  { value: "not_paid", label: "Not Paid" },
];

function leadMatchesSearchQuery(row: LeadSearchableRow, queryNorm: string): boolean {
  if (!queryNorm) return true;
  const status = row.status ?? "pending";
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "";
  const hay = [
    row.name,
    row.business,
    row.address,
    row.update,
    TYPE_DISPLAY[row.type],
    statusLabel,
  ]
    .join(" ")
    .toLowerCase();
  const tokens = queryNorm.split(/\s+/).filter(Boolean);
  return tokens.every((t) => hay.includes(t));
}

export function filterLeadsBySearch<T extends LeadSearchableRow>(items: T[], queryNorm: string): T[] {
  if (!queryNorm) return items;
  return items.filter((l) => leadMatchesSearchQuery(l, queryNorm));
}
