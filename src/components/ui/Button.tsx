import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const variantClasses =
    variant === "primary"
      ? "bg-[var(--accent)] text-white shadow-[0_5px_16px_rgba(54,110,250,0.24)] hover:brightness-105"
      : "border border-[#1018283a] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]";

  const sizeClasses =
    size === "lg" ? "h-11 min-h-11 px-6 text-sm font-medium" : "h-11 min-h-11 px-5 text-sm font-medium";

  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-medium transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim()}
      {...props}
    />
  );
}
