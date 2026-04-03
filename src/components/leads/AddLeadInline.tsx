"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CreateLeadModal, type CreateLeadAction } from "./CreateLeadModal";

type AddLeadInlineProps = {
  createLead: CreateLeadAction;
  /** Use in the sticky app header (no extra vertical spacing). */
  compact?: boolean;
};

export function AddLeadInline({ createLead, compact = false }: AddLeadInlineProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const row = (
    <div className="flex min-w-0 justify-end">
      <Button type="button" className="min-w-[4.25rem] shrink-0 px-5" onClick={() => setModalOpen(true)}>
        Add
      </Button>
    </div>
  );

  return (
    <>
      {compact ? row : <div className="space-y-5">{row}</div>}
      <CreateLeadModal open={modalOpen} onOpenChange={setModalOpen} createLead={createLead} />
    </>
  );
}
