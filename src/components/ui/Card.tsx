import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  const baseCardClasses =
    "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]";

  return (
    <section className={`${baseCardClasses} ${className}`.trim()}>
      {children}
    </section>
  );
}
