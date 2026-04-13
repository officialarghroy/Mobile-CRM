"use client";

import { useState } from "react";
import { AddEventFromLeadModal } from "@/components/leads/AddEventFromLeadModal";
import { Button } from "@/components/ui/Button";
import type { TeamMemberRow } from "@/lib/teamAccess";

type LeadDetailScheduleEventProps = {
  leadId: string;
  leadName: string;
  teamMembers: TeamMemberRow[];
  viewerUserId: string | null;
  viewerEmail: string;
};

/** Client shell: open state + Schedule button + calendar modal (lead detail page stays a server component). */
export function LeadDetailScheduleEvent({
  leadId,
  leadName,
  teamMembers,
  viewerUserId,
  viewerEmail,
}: LeadDetailScheduleEventProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" className="w-full touch-manipulation" onClick={() => setOpen(true)}>
        Add Task / Schedule
      </Button>
      <AddEventFromLeadModal
        open={open}
        onOpenChange={setOpen}
        leadId={leadId}
        leadName={leadName}
        teamMembers={teamMembers}
        viewerUserId={viewerUserId}
        viewerEmail={viewerEmail}
      />
    </>
  );
}
