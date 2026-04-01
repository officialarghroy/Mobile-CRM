import { revalidatePath } from "next/cache";
import { Container } from "@/components/ui/Container";
import { AddLeadInline } from "@/components/leads/AddLeadInline";
import { LeadsListSection } from "@/components/leads/LeadsListSection";
import { supabase } from "@/lib/supabase";

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
  timestamp: string;
};

type SupabaseError = {
  code?: string;
  message?: string;
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

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function LeadsPage() {
  const createLead = async (formData: FormData) => {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;

    try {
      const { error } = await supabase.from("leads").insert({ name, type: "lead" });
      if (error) {
        const supabaseError = error as SupabaseError;
        if (supabaseError.code === "PGRST205") return;
        throw error;
      }
      revalidatePath("/leads");
    } catch (error) {
      console.error("Failed to create lead:", error);
      throw error;
    }
  };

  let leads: LeadCardData[] = [];

  try {
    const { data, error } = await supabase
      .from("leads")
      .select("id, name, business, address, created_at, type")
      .order("created_at", { ascending: false });

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
        return {
          id: lead.id,
          name: lead.name,
          business: lead.business ?? "",
          address: lead.address ?? "",
          type: normalizedType,
          update: latestActivity?.content ?? "No activity yet",
          timestamp: formatTimestamp(latestActivity?.createdAt ?? lead.created_at),
        };
      });
    }
  } catch (error) {
    console.error("Failed to fetch leads:", error);
  }

  return (
    <main className="flex min-h-dvh w-full items-start py-5">
      <Container className="space-y-6 pb-6">
        <header className="pt-1">
          <AddLeadInline createLead={createLead} />
        </header>

        <LeadsListSection leads={leads} />
      </Container>
    </main>
  );
}
