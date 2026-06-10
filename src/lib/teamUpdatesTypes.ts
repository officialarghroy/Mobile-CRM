export type TeamUpdateTab = "completed" | "in_progress";

export type TeamUpdateTimeRange = "today" | "7d" | "30d";

export type TeamUpdateRow = {
  id: string;
  title: string;
  status: TeamUpdateTab;
  completedAt: string | null;
  completedByUserId: string | null;
  ownerUserId: string | null;
  /** Legacy assignee email from `events.user_name`. */
  assigneeEmail: string | null;
  leadId: string | null;
  leadName: string | null;
  startTime: string | null;
};

export type LeadFilterOption = {
  id: string;
  name: string;
};
