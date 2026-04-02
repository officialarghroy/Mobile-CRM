"use client";

import { useState, type InputHTMLAttributes } from "react";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({ label, id, className = "", disabled, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="relative z-0 flex w-full flex-col gap-2 overflow-visible">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={`relative z-10 h-11 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-0 pl-4 pr-12 text-[0.9375rem] text-[var(--text-primary)] outline-none transition-colors duration-150 focus:z-20 focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[#2460fa1f] ${className}`.trim()}
          {...rest}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] disabled:opacity-40"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <RiEyeOffLine className="h-5 w-5" aria-hidden /> : <RiEyeLine className="h-5 w-5" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
