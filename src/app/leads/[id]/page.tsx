import { RiArrowDownSLine, RiDeleteBinLine } from "react-icons/ri";
import { Container } from "@/components/ui/Container";
import { LeadUpdatesSection, type UpdateCardData } from "@/components/leads/LeadUpdatesSection";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createLeadUpdate, deleteLead, updateLead } from "./actions";

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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerEmail = user?.email ?? "";

  let leadName = formatLeadNameFromSlug(leadId) || "Lead Detail";
  let leadBusiness = "";
  let leadAddress = "";
  let leadType: "lead" | "client" = "lead";
  let updates: UpdateCardData[] = [];

  try {
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

  const contactFormKey = [leadId, leadType, leadName, leadBusiness, leadAddress].join("\u001f");

  return (
    <main className="flex w-full flex-1 flex-col py-5">
      <Container className="flex flex-1 flex-col space-y-5 pb-24">
        <p className="crm-section-label pt-1">Contact</p>
        <Card className="flex flex-col gap-3">
          <form
            key={contactFormKey}
            action={updateLead.bind(null, leadId)}
            className="flex flex-col gap-3"
          >
            <Input name="name" label="Name" defaultValue={leadName || ""} />
            <Input name="business" label="Business" defaultValue={leadBusiness || ""} />
            <Input name="address" label="Address" defaultValue={leadAddress || ""} />

            <div className="flex flex-col gap-2">
              <label htmlFor="lead-type" className="text-sm font-medium text-[var(--text-primary)]">
                Type
              </label>
              <div className="relative">
                <select
                  id="lead-type"
                  name="type"
                  defaultValue={leadType}
                  className="h-11 min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-0 pl-4 pr-11 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f]"
                >
                  <option value="lead">Lead</option>
                  <option value="client">Client</option>
                </select>
                <RiArrowDownSLine
                  className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[var(--text-secondary)]"
                  aria-hidden
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>
        </Card>

        <LeadUpdatesSection
          initialUpdates={updates}
          createLeadUpdate={createLeadUpdate.bind(null, leadId)}
          viewerEmail={viewerEmail}
        />

        <form
          action={deleteLead.bind(null, leadId)}
          className="mt-auto border-t border-[var(--border)] pt-5"
        >
          <Button
            type="submit"
            variant="primary"
            className="w-full gap-2 border-0 bg-red-600 text-white shadow-[0_4px_14px_rgba(220,38,38,0.35)] hover:bg-red-700 hover:brightness-100 focus-visible:ring-red-500"
          >
            <RiDeleteBinLine className="size-4 shrink-0" aria-hidden />
            Delete
          </Button>
        </form>
      </Container>
    </main>
  );
}
