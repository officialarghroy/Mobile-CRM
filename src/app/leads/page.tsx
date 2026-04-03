import { Suspense } from "react";
import { LeadsListSection } from "@/components/leads/LeadsListSection";
import { LeadsListSkeleton } from "@/components/leads/LeadsListSkeleton";
import { Container } from "@/components/ui/Container";
import { isMissingDeletedAtColumnError } from "@/lib/leadsSoftDeleteSupport";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Lead = {
  id: string;
  name: string;
  business: string | null;
  address: string | null;
  created_at: string;
  type: string | null;
};

type LeadUpdateRow = {
  lead_id: string;
  content: string;
  created_at: string;
};

type LatestLeadActivity = {
  content: string;
  createdAt: string;
};

type LeadCardData = {
  id: string;
  name: string;
  business: string;
  address: string;
  type: "lead" | "client";
  update: string;
  activityAt: string;
  timestamp: string;
};

function formatTimestamp(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes}m ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours}h ago`;
  }

  if (diffMs < dayMs * 2) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

function logFetchLeadsError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const e = error as SupabaseError;
    console.error("Failed to fetch leads:", e.message, e.code ?? "", e.details ?? "");
    return;
  }
  if (error instanceof Error) {
    console.error("Failed to fetch leads:", error.message);
    return;
  }
  console.error("Failed to fetch leads:", error);
}

async function LeadsPageContent() {
  const supabase = await createSupabaseServerClient();

  let leads: LeadCardData[] = [];

  try {
    const leadsSelect = "id, name, business, address, created_at, type";

    let { data, error } = await supabase
      .from("leads")
      .select(leadsSelect)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      const supabaseError = error as SupabaseError;
      if (isMissingDeletedAtColumnError(supabaseError)) {
        const retry = await supabase
          .from("leads")
          .select(leadsSelect)
          .order("created_at", { ascending: false });
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      const supabaseError = error as SupabaseError;
      if (supabaseError.code !== "PGRST205") {
        throw error;
      }
    }

    if (data) {
      const leadRows = data as Lead[];
      const leadIds = leadRows.map((lead) => lead.id);

      const latestActivityByLeadId = new Map<string, LatestLeadActivity>();

      if (leadIds.length) {
        const { data: updatesData, error: updatesError } = await supabase
          .from("lead_updates")
          .select("lead_id, content, created_at")
          .in("lead_id", leadIds)
          .order("created_at", { ascending: false });

        if (updatesError) {
          console.error("Failed to fetch lead updates for list:", updatesError);
        } else {
          (updatesData as LeadUpdateRow[] | null)?.forEach((update) => {
            if (!latestActivityByLeadId.has(update.lead_id)) {
              latestActivityByLeadId.set(update.lead_id, {
                content: update.content,
                createdAt: update.created_at,
              });
            }
          });
        }
      }

      leads = leadRows.map((lead) => {
        const latestActivity = latestActivityByLeadId.get(lead.id);
        const normalizedType =
          typeof lead.type === "string" && lead.type.trim().toLowerCase() === "client"
            ? "client"
            : "lead";
        const activityAt = latestActivity?.createdAt ?? lead.created_at;
        return {
          id: lead.id,
          name: lead.name,
          business: lead.business ?? "",
          address: lead.address ?? "",
          type: normalizedType,
          update: latestActivity?.content ?? "No activity yet",
          activityAt,
          timestamp: formatTimestamp(activityAt),
        };
      });
    }
  } catch (error) {
    logFetchLeadsError(error);
  }

  return <LeadsListSection leads={leads} />;
}

export default function LeadsPage() {
  return (
    <main className="flex min-h-dvh w-full items-start py-5">
      <Container className="space-y-5 pb-24">
        <Suspense fallback={<LeadsListSkeleton />}>
          <LeadsPageContent />
        </Suspense>
      </Container>
    </main>
  );
}
