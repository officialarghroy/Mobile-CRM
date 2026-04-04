import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const baseInputClasses =
    "relative z-10 box-border h-11 min-h-11 min-w-0 max-w-full w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/75 outline-none transition-colors duration-150 focus:z-20 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-inset focus:ring-[#2460fa1f] sm:px-4";

  return (
    <div className="relative z-0 flex min-w-0 max-w-full w-full flex-col gap-2 focus-within:z-20">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={`${baseInputClasses} ${className}`.trim()}
        {...props}
      />

      {error ? <p className="crm-meta text-[var(--text-danger)]">{error}</p> : null}
      {!error && hint ? <p className="crm-meta">{hint}</p> : null}
    </div>
  );
}
