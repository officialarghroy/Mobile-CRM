"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { RiArrowDownSLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SurfaceListShell } from "@/components/ui/SurfaceListShell";
import { LEAD_FORM_STEPS } from "@/components/leads/leadFormSteps";

const textareaFieldClass =
  "min-h-[5.5rem] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/75 outline-none transition-colors duration-150 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f] disabled:cursor-not-allowed disabled:opacity-60";

export type LeadDetailContactValues = {
  name: string;
  business: string;
  address: string;
  type: "lead" | "client";
  email: string;
  phone: string;
  equipmentBrand: string;
  equipmentModel: string;
  brandModel: string;
  issueDescription: string;
};

type LeadDetailContactFormProps = {
  formKey: string;
  readOnly: boolean;
  values: LeadDetailContactValues;
  updateAction: (formData: FormData) => Promise<void>;
};

function SaveLeadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:ml-auto sm:w-auto sm:min-w-[8rem]" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
      <p className={`text-sm ${value ? "text-[var(--text-primary)]" : "crm-meta"}`}>{value || "—"}</p>
    </div>
  );
}

export function LeadDetailContactForm({ formKey, ...innerProps }: LeadDetailContactFormProps) {
  return <LeadDetailContactFormInner key={formKey} {...innerProps} />;
}

function LeadDetailContactFormInner({
  readOnly,
  values,
  updateAction,
}: Omit<LeadDetailContactFormProps, "formKey">) {
  const [step, setStep] = useState(0);

  if (readOnly) {
    return (
      <SurfaceListShell
        className="p-0 transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]"
        innerClassName="flex flex-col"
      >
        <div
          role="tablist"
          aria-label="Lead details sections"
          className="rounded-none rounded-t-[calc(0.75rem-1px)] border-b border-[var(--border)] bg-[var(--surface-muted)]/90 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]"
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
                  aria-controls={`lead-detail-ro-panel-${s.id}`}
                  id={`lead-detail-ro-tab-${s.id}`}
                  tabIndex={selected ? 0 : -1}
                  title={s.heading}
                  aria-label={s.heading}
                  onClick={() => setStep(s.id)}
                  className={`relative flex min-h-10 items-center justify-center rounded-xl px-2 py-2.5 text-center transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-[0.98] ${
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

        <div className="space-y-4 p-4 sm:p-5">
          <section
            id="lead-detail-ro-panel-0"
            role="tabpanel"
            aria-labelledby="lead-detail-ro-tab-0"
            hidden={step !== 0}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <ReadOnlyField label="Name" value={values.name} />
            </div>
            <ReadOnlyField label="Business" value={values.business} />
            <ReadOnlyField label="Address" value={values.address} />
            <div className="sm:col-span-2">
              <ReadOnlyField label="Type of Lead" value={values.type === "client" ? "Client" : "Lead"} />
            </div>
          </section>

          <section
            id="lead-detail-ro-panel-1"
            role="tabpanel"
            aria-labelledby="lead-detail-ro-tab-1"
            hidden={step !== 1}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <ReadOnlyField label="Email Address" value={values.email} />
            <ReadOnlyField label="Phone Number" value={values.phone} />
          </section>

          <section
            id="lead-detail-ro-panel-2"
            role="tabpanel"
            aria-labelledby="lead-detail-ro-tab-2"
            hidden={step !== 2}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <ReadOnlyField label="Equipment Brand" value={values.equipmentBrand} />
            <ReadOnlyField label="Equipment Model" value={values.equipmentModel} />
            <div className="sm:col-span-2">
              <ReadOnlyField label="Brand Model (optional)" value={values.brandModel} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">Describe the Issue</p>
              <p className={`whitespace-pre-wrap text-sm ${values.issueDescription ? "text-[var(--text-primary)]" : "crm-meta"}`}>
                {values.issueDescription || "—"}
              </p>
            </div>
          </section>
        </div>
      </SurfaceListShell>
    );
  }

  return (
    <SurfaceListShell
      className="p-0 transition-shadow duration-150 hover:shadow-[var(--shadow-elevated)]"
      innerClassName="flex flex-col"
    >
      <form action={updateAction} className="flex flex-col">
        <div
          role="tablist"
          aria-label="Lead details sections"
          className="rounded-none rounded-t-[calc(0.75rem-1px)] border-b border-[var(--border)] bg-[var(--surface-muted)]/90 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]"
        >
          <div className="grid grid-cols-3 gap-1">
            {LEAD_FORM_STEPS.map((s) => {
              const selected = step === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  formNoValidate
                  aria-selected={selected}
                  aria-controls={`lead-detail-panel-${s.id}`}
                  id={`lead-detail-tab-${s.id}`}
                  tabIndex={selected ? 0 : -1}
                  title={s.heading}
                  aria-label={s.heading}
                  onClick={() => setStep(s.id)}
                  className={`relative flex min-h-10 items-center justify-center rounded-xl px-2 py-2.5 text-center transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-[0.98] ${
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

        <div className="space-y-4 p-4 sm:p-5">
          <section
            id="lead-detail-panel-0"
            role="tabpanel"
            aria-labelledby="lead-detail-tab-0"
            hidden={step !== 0}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input name="name" label="Name" defaultValue={values.name} autoComplete="organization" required />
              </div>
              <Input name="business" label="Business" defaultValue={values.business} autoComplete="organization" />
              <Input name="address" label="Address" defaultValue={values.address} autoComplete="street-address" />
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label htmlFor="lead-detail-type" className="text-sm font-medium text-[var(--text-primary)]">
                  Type of Lead
                </label>
                <div className="relative">
                  <select
                    id="lead-detail-type"
                    name="type"
                    defaultValue={values.type}
                    className="h-11 min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-0 pl-4 pr-11 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f]"
                  >
                    <option value="lead">Lead</option>
                    <option value="client">Client</option>
                  </select>
                  <RiArrowDownSLine
                    className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[var(--text-secondary)]"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            id="lead-detail-panel-1"
            role="tabpanel"
            aria-labelledby="lead-detail-tab-1"
            hidden={step !== 1}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                name="email"
                type="email"
                label="Email Address"
                defaultValue={values.email}
                autoComplete="email"
                inputMode="email"
              />
              <Input
                name="phone"
                type="tel"
                label="Phone Number"
                defaultValue={values.phone}
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
          </section>

          <section
            id="lead-detail-panel-2"
            role="tabpanel"
            aria-labelledby="lead-detail-tab-2"
            hidden={step !== 2}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input name="equipment_brand" label="Equipment Brand" defaultValue={values.equipmentBrand} autoComplete="off" />
              <Input name="equipment_model" label="Equipment Model" defaultValue={values.equipmentModel} autoComplete="off" />
              <div className="sm:col-span-2">
                <Input name="brand_model" label="Brand Model (optional)" defaultValue={values.brandModel} autoComplete="off" />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label htmlFor="lead-detail-issue" className="text-sm font-medium text-[var(--text-primary)]">
                  Describe the Issue
                </label>
                <textarea
                  id="lead-detail-issue"
                  name="issue_description"
                  rows={4}
                  defaultValue={values.issueDescription}
                  className={textareaFieldClass}
                  placeholder="What problem are they reporting?"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pb-5 sm:pt-4">
          {step > 0 ? (
            <Button type="button" variant="ghost" className="w-full sm:w-auto" formNoValidate onClick={() => setStep((p) => p - 1)}>
              Back
            </Button>
          ) : (
            <span className="hidden sm:block sm:min-w-[5rem]" aria-hidden />
          )}
          {step < 2 ? (
            <Button type="button" className="w-full sm:ml-auto sm:w-auto sm:min-w-[8rem]" formNoValidate onClick={() => setStep((p) => p + 1)}>
              Continue
            </Button>
          ) : (
            <SaveLeadButton />
          )}
        </div>
      </form>
    </SurfaceListShell>
  );
}
