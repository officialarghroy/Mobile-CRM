"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreLead } from "@/app/leads/[id]/actions";
import { Button } from "@/components/ui/Button";

type RestoreLeadButtonProps = {
  leadId: string;
  className?: string;
};

export function RestoreLeadButton({ leadId, className }: RestoreLeadButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        className={className ?? "w-full"}
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await restoreLead(leadId);
              router.refresh();
            } catch (err) {
              const message = err instanceof Error ? err.message : "Could not restore.";
              setError(message);
              console.error("Restore lead failed:", err);
            }
          });
        }}
      >
        {isPending ? "Restoring..." : "Restore lead"}
      </Button>
      {error ? (
        <p className="text-center text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
