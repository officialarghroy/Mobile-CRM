"use client";

import { useCallback, useState } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { softDeleteLead } from "@/app/leads/[id]/actions";
import { Button } from "@/components/ui/Button";
import { LeadNameConfirmModal } from "@/components/leads/LeadNameConfirmModal";

type DeleteLeadSectionProps = {
  leadId: string;
  leadName: string;
};

export function DeleteLeadSection({ leadId, leadName }: DeleteLeadSectionProps) {
  const [open, setOpen] = useState(false);

  const submitAction = useCallback(
    (formData: FormData) => softDeleteLead(leadId, formData),
    [leadId],
  );

  return (
    <>
      <div className="mt-auto border-t border-[var(--border)] pt-5">
        <Button
          type="button"
          variant="primary"
          className="w-full border-0 bg-red-600 text-white shadow-[0_4px_14px_rgba(220,38,38,0.35)] hover:bg-red-700 hover:brightness-100 focus-visible:ring-red-500"
          onClick={() => setOpen(true)}
        >
          <RiDeleteBinLine className="size-4" aria-hidden />
          Delete
        </Button>
      </div>
      <LeadNameConfirmModal
        open={open}
        onOpenChange={setOpen}
        leadName={leadName}
        title="Move to Recently deleted?"
        description="This lead will leave your main list. You can restore it anytime from Recently deleted. Type the lead name below to confirm."
        submitLabel="Move to Recently deleted"
        submitAction={submitAction}
        onSuccessNavigateTo="/leads"
      />
    </>
  );
}
