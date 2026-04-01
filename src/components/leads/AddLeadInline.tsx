"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CreateLeadModal, type CreateLeadAction } from "./CreateLeadModal";

type AddLeadInlineProps = {
  createLead: CreateLeadAction;
};

export function AddLeadInline({ createLead }: AddLeadInlineProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex min-w-0 justify-end">
        <Button type="button" className="min-w-[4.25rem] shrink-0 px-5" onClick={() => setModalOpen(true)}>
          Add
        </Button>
      </div>
      <CreateLeadModal open={modalOpen} onOpenChange={setModalOpen} createLead={createLead} />
    </div>
  );
}
