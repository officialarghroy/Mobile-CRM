export type LeadStatus =
  | "pending"
  | "urgent"
  | "not_paid"
  | "completed"
  | "order_parts"
  | "parts_ordered";

/** Matches lead rows from `/leads` (includes business + address for CRM detail). */
export type LeadCardData = {
  id: string;
  name: string;
  business: string;
  address: string;
  type: "lead" | "client";
  update: string;
  activityAt: string;
  timestamp: string;
  created_at: string;
  status?: LeadStatus;
  is_read?: boolean;
  priority_order?: number;
};
