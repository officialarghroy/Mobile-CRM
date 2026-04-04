import Link from "next/link";
import { AppMain } from "@/components/layout/AppMain";
import { DeletedLeadsClient, type DeletedLeadRow } from "@/components/leads/DeletedLeadsClient";
import { Container } from "@/components/ui/Container";
import { isMissingDeletedAtColumnError } from "@/lib/leadsSoftDeleteSupport";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type LeadRow = {
  id: string;
  name: string;
  business: string | null;
  address: string | null;
  type: string | null;
  deleted_at: string;
};

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

function logFetchDeletedLeadsError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const e = error as SupabaseError;
    console.error("Failed to fetch deleted leads:", e.message, e.code ?? "", e.details ?? "");
    return;
  }
  if (error instanceof Error) {
    console.error("Failed to fetch deleted leads:", error.message);
    return;
  }
  console.error("Failed to fetch deleted leads:", error);
}

function formatDeletedAtLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const dynamic = "force-dynamic";

export default async function DeletedLeadsPage() {
  const supabase = await createSupabaseServerClient();

  let leads: DeletedLeadRow[] = [];

  try {
    const { data, error } = await supabase
      .from("leads")
      .select("id, name, business, address, type, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      const supabaseError = error as SupabaseError;
      if (isMissingDeletedAtColumnError(supabaseError)) {
        leads = [];
      } else if (supabaseError.code !== "PGRST205") {
        throw error;
      }
    }

    if (data) {
      leads = (data as LeadRow[]).map((lead) => {
        const normalizedType =
          typeof lead.type === "string" && lead.type.trim().toLowerCase() === "client" ? "client" : "lead";
        return {
          id: lead.id,
          name: lead.name,
          business: lead.business ?? "",
          address: lead.address ?? "",
          type: normalizedType,
          deletedAtLabel: formatDeletedAtLabel(lead.deleted_at),
        };
      });
    }
  } catch (err) {
    logFetchDeletedLeadsError(err);
  }

  return (
    <AppMain className="items-start">
      <Container className="space-y-5 pb-[var(--app-page-scroll-pad)]">
        <Link
          href="/leads"
          className="inline-flex text-sm font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
        >
          ← Back to Leads
        </Link>
        <DeletedLeadsClient leads={leads} />
      </Container>
    </AppMain>
  );
}
