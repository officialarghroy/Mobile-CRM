import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const baseInputClasses =
    "relative z-10 h-12 w-full rounded-xl border border-[color:rgba(255,255,255,0.06)] bg-[color:rgba(255,255,255,0.03)] px-4 text-[0.95rem] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/80 [color-scheme:dark] outline-none transition-colors duration-150 focus:z-20 focus:border-[color:rgba(79,70,229,0.55)] focus:bg-[color:rgba(255,255,255,0.04)]";

  return (
    <div className="relative z-0 w-full space-y-2 overflow-visible focus-within:z-20">
      {label ? (
        <label htmlFor={inputId} className="text-body text-[0.9rem] font-medium">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={`${baseInputClasses} ${className}`.trim()}
        {...props}
      />

      {error ? <p className="text-meta text-red-400">{error}</p> : null}
      {!error && hint ? <p className="text-meta">{hint}</p> : null}
    </div>
  );
}
