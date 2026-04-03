"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalScaffold } from "@/components/ui/ModalScaffold";
import { PasswordField } from "@/components/ui/PasswordField";

export type CreateUserAction = (formData: FormData) => Promise<void>;

type CreateUserModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createUser: CreateUserAction;
};

const ROLE_OPTIONS = [
  { value: "developer", label: "Developer" },
  { value: "content_writer", label: "Content writer" },
  { value: "admin", label: "Admin" },
] as const;

export function CreateUserModal({ open, onOpenChange, createUser }: CreateUserModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const close = useCallback(() => {
    setSubmitError(null);
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
    setSubmitError(null);

    startTransition(async () => {
      try {
        await createUser(fd);
        close();
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not create user.";
        setSubmitError(message);
        console.error("Create user failed:", error);
      }
    });
  };

  return (
    <ModalScaffold open={open} onBackdropClose={close} titleId="create-user-title">
      <div
        className="pointer-events-auto mx-auto w-full max-w-md max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2.5rem))] overflow-y-auto overscroll-contain rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-elevated)]"
        onClick={(ev) => ev.stopPropagation()}
      >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id="create-user-title" className="text-xl font-semibold text-[var(--text-primary)]">
              Create user
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
            <Input name="displayName" type="text" label="Display name (optional)" autoComplete="name" />
            <Input name="email" type="email" label="Email" autoComplete="email" required />
            <div className="flex flex-col gap-2">
              <label htmlFor="create-user-role" className="text-sm font-medium text-[var(--text-primary)]">
                Role
              </label>
              <select
                id="create-user-role"
                name="role"
                required
                className="h-11 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f]"
                defaultValue="developer"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <PasswordField
              id="create-user-password"
              name="password"
              label="Password (min 8 characters)"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <PasswordField
              id="create-user-password-confirm"
              name="passwordConfirm"
              label="Confirm password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {submitError ? (
              <p className="crm-meta text-[var(--text-danger)]" role="alert">
                {submitError}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating…" : "Submit"}
            </Button>
          </form>
      </div>
    </ModalScaffold>
  );
}
