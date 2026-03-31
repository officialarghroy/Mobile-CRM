import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  const baseCardClasses = "rounded-2xl border border-[color:rgba(255,255,255,0.04)] bg-[color:rgba(255,255,255,0.02)] p-4";

  return (
    <section className={`${baseCardClasses} ${className}`.trim()}>
      {children}
    </section>
  );
}
