import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { LeadUpdatesSection, type UpdateCardData } from "@/components/leads/LeadUpdatesSection";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/currentUser";
import { createSupabaseServerClient } from "@/lib/supabase";

type LeadUpdate = {
  id: string;
  content: string;
  created_at: string;
  created_by: string | null;
};

function formatLeadNameFromSlug(slug: string): string {
  if (!slug) return "";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type LeadDetailPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

function formatFullTimestamp(createdAt: string): string {
  return new Date(createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTimestamp(createdAt: string): string {
  const now = Date.now();
  const then = new Date(createdAt).getTime();
  const diffInSeconds = Math.max(0, Math.floor((now - then) / 1000));

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 5) return `${diffInWeeks}w ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const resolvedParams = await params;
  const leadId = resolvedParams?.id ?? "";
  const currentUser = await getCurrentUser();

  const createLeadUpdate = async (formData: FormData) => {
    "use server";

    const supabase = await createSupabaseServerClient();
    const content = String(formData.get("content") ?? "").trim();
    if (!content || !leadId) return;

    try {
      const { error } = await supabase.from("lead_updates").insert({
        lead_id: leadId,
        content,
        created_by: currentUser,
      });

      if (error) {
        throw error;
      }

      revalidatePath(`/leads/${leadId}`);
      revalidatePath("/leads");
    } catch (error) {
      console.error("Failed to create lead update:", error);
      throw error;
    }
  };

  const updateLead = async (formData: FormData) => {
    "use server";

    const supabase = await createSupabaseServerClient();

    if (!leadId) return;

    const name = String(formData.get("name") ?? "").trim();
    const business = String(formData.get("business") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const rawType = String(formData.get("type") || "").trim().toLowerCase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(leadId);

    console.log("Updating lead:", {
      id: leadId,
      isUuid,
      type: formData.get("type"),
    });

    try {
      const { data, error } = await supabase
        .from("leads")
        .update({
          name,
          business,
          address,
          type: rawType === "client" ? "client" : "lead",
        })
        .select("id, type")
        .eq("id", leadId);

      console.log("Update result:", data, error);

      if (error) {
        console.error("Update failed:", error);
        throw error;
      }

      revalidatePath(`/leads/${leadId}`);
      revalidatePath("/leads");
    } catch (error) {
      console.error("Failed to update lead:", error);
      throw error;
    }
  };

  const deleteLead = async (_formData: FormData) => {
    "use server";

    if (!leadId) return;

    const supabase = await createSupabaseServerClient();

    try {
      const { error: updatesError } = await supabase.from("lead_updates").delete().eq("lead_id", leadId);
      if (updatesError) throw updatesError;

      const { error } = await supabase.from("leads").delete().eq("id", leadId);
      if (error) throw error;

      revalidatePath("/leads");
      redirect("/leads");
    } catch (error) {
      console.error("Failed to delete lead:", error);
      throw error;
    }
  };

  let leadName = formatLeadNameFromSlug(leadId) || "Lead Detail";
  let leadBusiness = "";
  let leadAddress = "";
  let leadType: "lead" | "client" = "lead";
  let updates: UpdateCardData[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: leadData, error: leadError }, { data: updatesData, error: updatesError }] = await Promise.all([
      supabase.from("leads").select("name, business, address, type").eq("id", leadId).single(),
      supabase
        .from("lead_updates")
        .select("id, content, created_at, created_by")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
    ]);

    if (leadError) {
      console.error("Failed to fetch lead:", leadError);
    } else if (leadData) {
      leadName = leadData.name || leadName;
      leadBusiness = leadData.business || "";
      leadAddress = leadData.address || "";
      leadType =
        typeof leadData.type === "string" && leadData.type.trim().toLowerCase() === "client"
          ? "client"
          : "lead";
    }

    if (updatesError) {
      throw updatesError;
    }

    updates = (updatesData as LeadUpdate[]).map((update) => ({
      id: update.id,
      content: update.content,
      relativeTime: formatRelativeTimestamp(update.created_at),
      fullTimestamp: formatFullTimestamp(update.created_at),
      author: update.created_by || "Unknown",
    }));
  } catch (error) {
    console.error("Failed to fetch lead updates:", error);
  }

  return (
    <main className="flex min-h-dvh w-full items-start py-5">
      <Container className="space-y-6 pb-24">
        <header className="pt-1">
          <h1 className="text-title max-w-full truncate">{leadName}</h1>
        </header>

        <p className="crm-section-label">Contact</p>
        <Card className="space-y-4">
          <form action={updateLead} className="space-y-4">
            <Input name="name" label="Name" defaultValue={leadName || ""} />
            <Input name="business" label="Business" defaultValue={leadBusiness || ""} />
            <Input name="address" label="Address" defaultValue={leadAddress || ""} />

            <div className="space-y-2">
              <label htmlFor="lead-type" className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                Type
              </label>
              <select
                id="lead-type"
                name="type"
                defaultValue={leadType}
                className="h-11 min-h-11 w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[0.875rem] text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f]"
              >
                <option value="lead">Lead</option>
                <option value="client">Client</option>
              </select>
            </div>

            <Button type="submit" className="h-10 w-full">
              Save
            </Button>
          </form>
        </Card>

        <form action={deleteLead} className="pt-1">
          <Button type="submit" variant="ghost" className="h-10 w-full text-[var(--text-secondary)]">
            Delete Lead
          </Button>
        </form>

        <LeadUpdatesSection initialUpdates={updates} createLeadUpdate={createLeadUpdate} currentUser={currentUser} />
      </Container>
    </main>
  );
}
