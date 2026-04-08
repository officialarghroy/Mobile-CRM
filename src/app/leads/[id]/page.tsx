import Link from "next/link";
import { AppMain } from "@/components/layout/AppMain";
import { Container } from "@/components/ui/Container";
import { LeadTasksSection, type LeadTasksSectionEvent } from "@/components/leads/LeadTasksSection";
import { LeadUpdatesSection, type UpdateCardData } from "@/components/leads/LeadUpdatesSection";
import { DeleteLeadSection } from "@/components/leads/DeleteLeadSection";
import { RestoreLeadButton } from "@/components/leads/RestoreLeadButton";
import { LeadDetailContactForm } from "@/components/leads/LeadDetailContactForm";
import { LeadDetailScheduleEvent } from "@/components/leads/LeadDetailScheduleEvent";
import { isMissingDeletedAtColumnError, isMissingExtendedLeadColumnsError } from "@/lib/leadsSoftDeleteSupport";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatInPST } from "@/lib/timezone";
import { fetchTeamMembers } from "@/lib/teamAccess";
import { createLeadUpdate, updateLead } from "./actions";

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

function logLeadDetailSupabaseError(context: string, error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const e = error as SupabaseError;
    console.error(context, e.message, e.code ?? "", e.details ?? "");
    return;
  }
  if (error instanceof Error) {
    console.error(context, error.message);
    return;
  }
  console.error(context, error);
}

type LeadUpdate = {
  id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  image_urls: string[] | null;
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

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const resolvedParams = await params;
  const leadId = resolvedParams?.id ?? "";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerEmail = user?.email ?? "";
  const viewerUserId = user?.id ?? null;
  const { rows: teamMemberRows } = await fetchTeamMembers(supabase);

  let leadName = formatLeadNameFromSlug(leadId) || "Lead Detail";
  let leadBusiness = "";
  let leadAddress = "";
  let leadType: "lead" | "client" = "lead";
  let leadEmail = "";
  let leadPhone = "";
  let leadEquipmentBrand = "";
  let leadEquipmentModel = "";
  let leadBrandModel = "";
  let leadIssueDescription = "";
  let deletedAt: string | null = null;
  let updates: UpdateCardData[] = [];
  let leadEvents: LeadTasksSectionEvent[] = [];

  const leadExtendedSelect =
    "name, business, address, type, deleted_at, email, phone, equipment_brand, equipment_model, brand_model, issue_description";
  const leadExtendedNoSoftSelect =
    "name, business, address, type, email, phone, equipment_brand, equipment_model, brand_model, issue_description";
  const leadBasicSoftSelect = "name, business, address, type, deleted_at";
  const leadBasicSelect = "name, business, address, type";

  try {
    const [
      { data: leadData, error: leadError },
      { data: updatesData, error: updatesError },
      { data: leadEventsData, error: leadEventsError },
    ] = await Promise.all([
      (async () => {
        let r = await supabase.from("leads").select(leadExtendedSelect).eq("id", leadId).single();
        if (r.error && isMissingDeletedAtColumnError(r.error as SupabaseError)) {
          r = await supabase.from("leads").select(leadExtendedNoSoftSelect).eq("id", leadId).single();
        }
        if (r.error && isMissingExtendedLeadColumnsError(r.error as SupabaseError)) {
          r = await supabase.from("leads").select(leadBasicSoftSelect).eq("id", leadId).single();
          if (r.error && isMissingDeletedAtColumnError(r.error as SupabaseError)) {
            r = await supabase.from("leads").select(leadBasicSelect).eq("id", leadId).single();
          }
        }
        return r;
      })(),
      supabase
        .from("lead_updates")
        .select("id, content, created_at, created_by, image_urls")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
                        supabase
                        .from("events")
                        .select("id, title, start_time, owner_user_id, user_name, created_by_user_id, completed_at, calendar_scope")
                        .eq("lead_id", leadId),
    ]);

    if (leadError) {
      if (leadError.code !== "PGRST116") {
        logLeadDetailSupabaseError("Failed to fetch lead:", leadError);
      }
    } else if (leadData) {
      const row = leadData as {
        name: string;
        business: string | null;
        address: string | null;
        type: string | null;
        deleted_at?: string | null;
        email?: string | null;
        phone?: string | null;
        equipment_brand?: string | null;
        equipment_model?: string | null;
        brand_model?: string | null;
        issue_description?: string | null;
      };
      leadName = row.name || leadName;
      leadBusiness = row.business || "";
      leadAddress = row.address || "";
      leadType =
        typeof row.type === "string" && row.type.trim().toLowerCase() === "client" ? "client" : "lead";
      deletedAt = typeof row.deleted_at === "string" ? row.deleted_at : null;
      leadEmail = typeof row.email === "string" ? row.email : "";
      leadPhone = typeof row.phone === "string" ? row.phone : "";
      leadEquipmentBrand = typeof row.equipment_brand === "string" ? row.equipment_brand : "";
      leadEquipmentModel = typeof row.equipment_model === "string" ? row.equipment_model : "";
      leadBrandModel = typeof row.brand_model === "string" ? row.brand_model : "";
      leadIssueDescription = typeof row.issue_description === "string" ? row.issue_description : "";
    }

    if (leadEventsError) {
      logLeadDetailSupabaseError("Failed to fetch lead events:", leadEventsError);
    } else {
      leadEvents = (leadEventsData ?? []) as LeadTasksSectionEvent[];
    }

    if (updatesError) {
      throw updatesError;
    }

    updates = (updatesData as LeadUpdate[]).map((update) => ({
      id: update.id,
      content: update.content,
      createdAt: update.created_at,
      author: update.created_by || "Unknown",
      image_urls: Array.isArray(update.image_urls) ? update.image_urls : null,
    }));
  } catch (error) {
    logLeadDetailSupabaseError("Failed to fetch lead updates:", error);
  }

  const contactFormKey = [
    leadId,
    leadType,
    leadName,
    leadBusiness,
    leadAddress,
    leadEmail,
    leadPhone,
    leadEquipmentBrand,
    leadEquipmentModel,
    leadBrandModel,
    leadIssueDescription,
  ].join("\u001f");

  const contactValues = {
    name: leadName,
    business: leadBusiness,
    address: leadAddress,
    type: leadType,
    email: leadEmail,
    phone: leadPhone,
    equipmentBrand: leadEquipmentBrand,
    equipmentModel: leadEquipmentModel,
    brandModel: leadBrandModel,
    issueDescription: leadIssueDescription,
  };

  const isDeleted = Boolean(deletedAt);

  return (
    <AppMain>
      <Container className="flex min-h-0 flex-1 flex-col space-y-5 pb-[var(--app-page-scroll-pad)]">
        {isDeleted ? (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-semibold">Recently deleted</p>
            <p className="mt-1 text-amber-900/90">
              This lead is not on your main list. Restore it anytime, or remove it forever from{" "}
              <Link href="/leads/deleted" className="font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline">
                Recently deleted
              </Link>
              .
            </p>
            {deletedAt ? (
              <p className="crm-meta mt-2 text-amber-900/80">Deleted {formatInPST(deletedAt)}</p>
            ) : null}
          </div>
        ) : null}

        <p className="crm-section-label pt-1">Lead details</p>
        <LeadDetailContactForm
          formKey={contactFormKey}
          readOnly={isDeleted}
          values={contactValues}
          updateAction={updateLead.bind(null, leadId)}
        />

        <LeadTasksSection
          events={leadEvents}
          viewerUserId={viewerUserId}
          viewerEmail={viewerEmail}
          teamMembers={teamMemberRows}
        />

        <LeadUpdatesSection
          initialUpdates={updates}
          createLeadUpdate={createLeadUpdate.bind(null, leadId)}
          viewerEmail={viewerEmail}
          allowAddUpdate={!isDeleted}
          belowAddNote={
            !isDeleted ? (
              <LeadDetailScheduleEvent
                leadId={leadId}
                leadName={leadName}
                teamMembers={teamMemberRows}
                viewerUserId={viewerUserId}
                viewerEmail={viewerEmail}
              />
            ) : null
          }
        />

        {isDeleted ? (
          <div className="mt-auto space-y-3 border-t border-[var(--border)] pt-5">
            <RestoreLeadButton leadId={leadId} />
            <Link
              href="/leads/deleted"
              className="block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 text-center text-sm font-semibold text-[var(--accent-strong)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
            >
              Open Recently deleted
            </Link>
          </div>
        ) : (
          <DeleteLeadSection leadId={leadId} leadName={leadName} />
        )}
      </Container>
    </AppMain>
  );
}
