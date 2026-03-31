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
      ? "bg-[var(--accent)] text-white hover:brightness-110"
      : "border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]";

  const sizeClasses =
    size === "lg" ? "h-12 px-5 text-[0.95rem]" : "h-11 px-4 text-[0.9rem]";

  const baseClasses =
    "inline-flex items-center justify-center rounded-xl font-medium transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim()}
      {...props}
    />
  );
}
