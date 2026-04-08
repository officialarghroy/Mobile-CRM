"use client";

import { useCallback, useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalScaffold } from "@/components/ui/ModalScaffold";
import { getUserFacingErrorMessage } from "@/lib/supabaseActionErrors";

type LeadNameConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  title: string;
  description: string;
  submitLabel: string;
  submitAction: (formData: FormData) => Promise<void>;
  /** When set, navigates here after a successful submit (and refreshes). */
  onSuccessNavigateTo?: string;
};

type LeadNameConfirmModalFormProps = Omit<LeadNameConfirmModalProps, "open" | "onOpenChange"> & {
  onClose: () => void;
};

function LeadNameConfirmModalForm({
  leadName,
  title,
  description,
  submitLabel,
  submitAction,
  onSuccessNavigateTo,
  onClose,
}: LeadNameConfirmModalFormProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const expected = leadName.trim();
  const matches = confirmText.trim() === expected && expected.length > 0;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!matches) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("confirmationName", confirmText.trim());
    setSubmitError(null);

    startTransition(async () => {
      try {
        await submitAction(fd);
        onClose();
        if (onSuccessNavigateTo) {
          router.push(onSuccessNavigateTo);
        }
        router.refresh();
      } catch (error) {
        setSubmitError(getUserFacingErrorMessage(error));
        console.error("Lead confirm action failed:", error);
      }
    });
  };

  return (
    <div
      className="pointer-events-auto mx-auto w-full max-w-md max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2.5rem))] overflow-y-auto overscroll-contain rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-elevated)]"
      onClick={(ev) => ev.stopPropagation()}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id="lead-name-confirm-title" className="text-xl font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2"
        >
          <RiCloseLine className="h-5 w-5 shrink-0" aria-hidden />
        </button>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>

      <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
        Lead name to match
        <span className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 font-normal text-[var(--text-primary)]">
          {leadName}
        </span>
      </p>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <Input
          name="confirmationName"
          type="text"
          label="Type the name exactly"
          autoComplete="off"
          value={confirmText}
          onChange={(ev) => setConfirmText(ev.target.value)}
          aria-invalid={submitError ? true : undefined}
        />

        {submitError ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {submitError}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          className="w-full border-0 bg-red-600 text-white shadow-[0_4px_14px_rgba(220,38,38,0.35)] hover:bg-red-700 hover:brightness-100 focus-visible:ring-red-500 disabled:opacity-60"
          disabled={isPending || !matches}
        >
          {isPending ? "Working..." : submitLabel}
        </Button>
      </form>
    </div>
  );
}

export function LeadNameConfirmModal({
  open,
  onOpenChange,
  leadName,
  title,
  description,
  submitLabel,
  submitAction,
  onSuccessNavigateTo,
}: LeadNameConfirmModalProps) {
  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const formKey = `${leadName}\0${title}\0${submitLabel}`;

  return (
    <ModalScaffold open={open} onBackdropClose={close} titleId="lead-name-confirm-title">
      {open ? (
        <LeadNameConfirmModalForm
          key={formKey}
          leadName={leadName}
          title={title}
          description={description}
          submitLabel={submitLabel}
          submitAction={submitAction}
          onSuccessNavigateTo={onSuccessNavigateTo}
          onClose={close}
        />
      ) : null}
    </ModalScaffold>
  );
}
