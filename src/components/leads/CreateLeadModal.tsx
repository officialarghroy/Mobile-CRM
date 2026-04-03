"use client";

import { useCallback, useEffect, useRef, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalScaffold } from "@/components/ui/ModalScaffold";

export type CreateLeadAction = (formData: FormData) => Promise<void>;

type CreateLeadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createLead: CreateLeadAction;
};

export function CreateLeadModal({ open, onOpenChange, createLead }: CreateLeadModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      try {
        await createLead(fd);
        close();
        router.refresh();
      } catch (error) {
        console.error("Create lead failed:", error);
      }
    });
  };

  return (
    <ModalScaffold open={open} onBackdropClose={close} titleId="create-lead-title">
      <div
        className="pointer-events-auto mx-auto w-full max-w-md max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2.5rem))] overflow-y-auto overscroll-contain rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-elevated)]"
        onClick={(ev) => ev.stopPropagation()}
      >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id="create-lead-title" className="text-xl font-semibold text-[var(--text-primary)]">
              Add lead
            </h2>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={close}
              className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
            >
              <RiCloseLine className="h-5 w-5 shrink-0" aria-hidden />
            </button>
          </div>

          <form ref={formRef} className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input name="name" label="Name" autoComplete="organization" required />
            <Input name="business" label="Business" autoComplete="organization" />
            <Input name="address" label="Address" autoComplete="street-address" />
            <div className="flex flex-col gap-2">
              <label htmlFor="create-lead-type" className="text-sm font-medium text-[var(--text-primary)]">
                Type
              </label>
              <select
                id="create-lead-type"
                name="type"
                defaultValue="lead"
                className="h-11 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f]"
              >
                <option value="lead">Lead</option>
                <option value="client">Client</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating…" : "Create lead"}
            </Button>
          </form>
      </div>
    </ModalScaffold>
  );
}
