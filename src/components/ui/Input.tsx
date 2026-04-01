import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const baseInputClasses =
    "relative z-10 h-11 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/75 outline-none transition-colors duration-150 focus:z-20 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f]";

  return (
    <div className="relative z-0 flex w-full flex-col gap-2 overflow-visible focus-within:z-20">
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
