"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { RiDeleteBinLine } from "react-icons/ri";
import { permanentlyDeleteLead } from "@/app/leads/[id]/actions";
import { Button } from "@/components/ui/Button";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import { LeadNameConfirmModal } from "@/components/leads/LeadNameConfirmModal";
import { RestoreLeadButton } from "@/components/leads/RestoreLeadButton";

export type DeletedLeadRow = {
  id: string;
  name: string;
  business: string;
  address: string;
  type: "lead" | "client";
  deletedAtLabel: string;
};

const TYPE_DISPLAY: Record<DeletedLeadRow["type"], string> = {
  lead: "Lead",
  client: "Client",
};

type DeletedLeadsClientProps = {
  leads: DeletedLeadRow[];
};

export function DeletedLeadsClient({ leads }: DeletedLeadsClientProps) {
  const [permanentTarget, setPermanentTarget] = useState<Pick<DeletedLeadRow, "id" | "name"> | null>(
    null,
  );

  const submitPermanent = useCallback(
    (formData: FormData) => {
      if (!permanentTarget) return Promise.resolve();
      return permanentlyDeleteLead(permanentTarget.id, formData);
    },
    [permanentTarget],
  );

  if (!leads.length) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
        <p>Nothing in Recently deleted.</p>
        <Link
          href="/leads"
          className="mt-3 inline-block text-sm font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
        >
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <>
      <SurfaceListShell>
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="border-b border-[var(--border)] px-3 py-3 last:border-b-0"
          >
            <div className="flex flex-col gap-3 pl-1">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/leads/${lead.id}`}
                  className="min-w-0 flex-1 truncate text-base font-medium text-[var(--accent-strong)] underline-offset-2 hover:underline"
                >
                  {lead.name}
                </Link>
                <span className={`shrink-0 ${lead.type === "client" ? "chip-client" : "chip-lead"}`}>
                  {TYPE_DISPLAY[lead.type]}
                </span>
              </div>

              {(lead.business || lead.address) ? (
                <div className="flex flex-col gap-1">
                  {lead.business ? (
                    <p className="text-sm text-[var(--text-secondary)]">{lead.business}</p>
                  ) : null}
                  {lead.address ? <p className="crm-meta">{lead.address}</p> : null}
                </div>
              ) : null}

              <p className="crm-meta">Deleted {lead.deletedAtLabel}</p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <RestoreLeadButton leadId={lead.id} className="w-full sm:flex-1" />
                <Button
                  type="button"
                  variant="primary"
                  className="w-full gap-2 border-0 bg-red-600 text-white shadow-[0_4px_14px_rgba(220,38,38,0.35)] hover:bg-red-700 hover:brightness-100 focus-visible:ring-red-500 sm:flex-1"
                  onClick={() => setPermanentTarget({ id: lead.id, name: lead.name })}
                >
                  <RiDeleteBinLine className="size-4 shrink-0" aria-hidden />
                  Delete forever
                </Button>
              </div>
            </div>
          </div>
        ))}
      </SurfaceListShell>

      {permanentTarget ? (
        <LeadNameConfirmModal
          open
          onOpenChange={(open) => {
            if (!open) setPermanentTarget(null);
          }}
          leadName={permanentTarget.name}
          title="Delete forever?"
          description="This removes the lead and all activity. You cannot undo this. Type the lead name below to confirm."
          submitLabel="Delete forever"
          submitAction={submitPermanent}
        />
      ) : null}
    </>
  );
}
