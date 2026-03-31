import { revalidatePath } from "next/cache";
import { Container } from "@/components/ui/Container";
import { LeadUpdatesSection, type UpdateCardData } from "@/components/leads/LeadUpdatesSection";
import { getCurrentUser } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";

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
    } catch (error) {
      console.error("Failed to create lead update:", error);
      throw error;
    }
  };

  let leadName = formatLeadNameFromSlug(leadId) || "Lead Detail";
  let updates: UpdateCardData[] = [];

  try {
    const [{ data: leadData, error: leadError }, { data: updatesData, error: updatesError }] = await Promise.all([
      supabase.from("leads").select("name").eq("id", leadId).single(),
      supabase
        .from("lead_updates")
        .select("id, content, created_at, created_by")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
    ]);

    if (leadError) {
      console.error("Failed to fetch lead:", leadError);
    } else if (leadData?.name) {
      leadName = leadData.name;
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
    <main className="flex min-h-dvh w-full items-start py-6">
      <Container className="space-y-6 pb-24">
        <header className="pt-2">
          <h1 className="text-title">{leadName}</h1>
        </header>

        <LeadUpdatesSection initialUpdates={updates} createLeadUpdate={createLeadUpdate} currentUser={currentUser} />
      </Container>
    </main>
  );
}
