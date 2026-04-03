"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalScaffold } from "@/components/ui/ModalScaffold";
import { LEAD_FORM_STEPS } from "@/components/leads/leadFormSteps";

export type CreateLeadAction = (formData: FormData) => Promise<void>;

type CreateLeadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createLead: CreateLeadAction;
};

export function CreateLeadModal({ open, onOpenChange, createLead }: CreateLeadModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      setStep(0);
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
        className="pointer-events-auto mx-auto w-full max-w-lg max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2.5rem))] overflow-y-auto overscroll-contain rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-elevated)]"
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

          <form ref={formRef} className="flex flex-col" onSubmit={handleSubmit}>
            <div
              role="tablist"
              aria-label="Add lead steps"
              className="mb-6 rounded-2xl bg-[var(--surface-muted)]/90 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-[var(--border)]/70"
            >
              <div className="grid grid-cols-3 gap-1">
                {LEAD_FORM_STEPS.map((s) => {
                  const selected = step === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`create-lead-panel-${s.id}`}
                      id={`create-lead-tab-${s.id}`}
                      tabIndex={selected ? 0 : -1}
                      title={s.heading}
                      aria-label={s.heading}
                      onClick={() => setStep(s.id)}
                      disabled={isPending}
                      className={`relative flex min-h-10 items-center justify-center rounded-xl px-2 py-2.5 text-center transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] ${
                        selected
                          ? "bg-[var(--surface)] font-semibold text-[var(--accent-strong)] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_8px_rgba(54,110,250,0.12)]"
                          : "font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]/60 hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <span className="text-[0.8125rem] leading-none tracking-tight">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <section
              id="create-lead-panel-0"
              role="tabpanel"
              aria-labelledby="create-lead-tab-0"
              hidden={step !== 0}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input name="name" label="Name" autoComplete="organization" required disabled={isPending} />
                </div>
                <Input name="business" label="Business" autoComplete="organization" disabled={isPending} />
                <Input name="address" label="Address" autoComplete="street-address" disabled={isPending} />
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label htmlFor="create-lead-type" className="text-sm font-medium text-[var(--text-primary)]">
                    Type of Lead
                  </label>
                  <select
                    id="create-lead-type"
                    name="type"
                    defaultValue="lead"
                    disabled={isPending}
                    className="h-11 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="lead">Lead</option>
                    <option value="client">Client</option>
                  </select>
                </div>
              </div>
            </section>

            <section
              id="create-lead-panel-1"
              role="tabpanel"
              aria-labelledby="create-lead-tab-1"
              hidden={step !== 1}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  name="email"
                  type="email"
                  label="Email Address"
                  autoComplete="email"
                  inputMode="email"
                  disabled={isPending}
                />
                <Input
                  name="phone"
                  type="tel"
                  label="Phone Number"
                  autoComplete="tel"
                  inputMode="tel"
                  disabled={isPending}
                />
              </div>
            </section>

            <section
              id="create-lead-panel-2"
              role="tabpanel"
              aria-labelledby="create-lead-tab-2"
              hidden={step !== 2}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input name="equipment_brand" label="Equipment Brand" autoComplete="off" disabled={isPending} />
                <Input name="equipment_model" label="Equipment Model" autoComplete="off" disabled={isPending} />
                <div className="sm:col-span-2">
                  <Input
                    name="brand_model"
                    label="Brand Model (optional)"
                    autoComplete="off"
                    disabled={isPending}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label htmlFor="create-lead-issue" className="text-sm font-medium text-[var(--text-primary)]">
                    Describe the Issue
                  </label>
                  <textarea
                    id="create-lead-issue"
                    name="issue_description"
                    rows={4}
                    disabled={isPending}
                    className="min-h-[5.5rem] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/75 outline-none transition-colors duration-150 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f] disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="What problem are they reporting?"
                  />
                </div>
              </div>
            </section>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  disabled={isPending}
                  onClick={() => setStep((prev) => prev - 1)}
                >
                  Back
                </Button>
              ) : (
                <span className="hidden sm:block sm:min-w-[5rem]" aria-hidden />
              )}
              {step < 2 ? (
                <Button
                  type="button"
                  className="w-full sm:ml-auto sm:w-auto sm:min-w-[8rem]"
                  disabled={isPending}
                  onClick={() => setStep((prev) => prev + 1)}
                >
                  Continue
                </Button>
              ) : (
                <Button type="submit" className="w-full sm:ml-auto sm:w-auto sm:min-w-[8rem]" disabled={isPending}>
                  {isPending ? "Creating…" : "Create lead"}
                </Button>
              )}
            </div>
          </form>
      </div>
    </ModalScaffold>
  );
}
