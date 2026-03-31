import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { AddLeadInline } from "@/components/leads/AddLeadInline";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  name: string;
  created_at: string;
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
      const { error } = await supabase.from("leads").insert({ name });
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
      .select("id, name, created_at")
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
          throw updatesError;
        }

        (updatesData as LeadUpdateRow[] | null)?.forEach((update) => {
          if (!latestActivityByLeadId.has(update.lead_id)) {
            latestActivityByLeadId.set(update.lead_id, {
              content: update.content,
              createdAt: update.created_at,
            });
          }
        });
      }

      leads = leadRows.map((lead) => {
        const latestActivity = latestActivityByLeadId.get(lead.id);
        return {
          id: lead.id,
          name: lead.name,
          update: latestActivity?.content ?? "No activity yet",
          timestamp: formatTimestamp(latestActivity?.createdAt ?? lead.created_at),
        };
      });
    }
  } catch (error) {
    console.error("Failed to fetch leads:", error);
  }

  return (
    <main className="flex min-h-dvh w-full items-start py-6">
      <Container className="space-y-6">
        <header className="pt-2">
          <AddLeadInline createLead={createLead} />
        </header>

        <section className="space-y-4" aria-label="Leads list">
          {!leads.length ? (
            <div className="py-6 text-center text-sm text-[var(--text-secondary)]">
              <p>No leads yet - add your first lead</p>
            </div>
          ) : null}
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              prefetch
              className="block w-full cursor-pointer text-left transition-transform duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            >
              <Card className="p-4 transition-colors duration-150 hover:border-[color:rgba(255,255,255,0.08)] active:border-[color:rgba(255,255,255,0.1)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1.06rem] font-semibold leading-tight text-[var(--text-primary)]">{lead.name}</p>
                    <p className="mt-1 text-sm leading-[1.45] text-[var(--text-secondary)]/92">{lead.update}</p>
                  </div>

                  <p className="shrink-0 pt-0.5 text-right text-xs text-[var(--text-secondary)]/62">{lead.timestamp}</p>
                </div>
              </Card>
            </Link>
          ))}
        </section>
      </Container>
    </main>
  );
}
