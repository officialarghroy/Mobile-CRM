import type { ReactNode } from "react";

type SurfaceListShellProps = {
  children: ReactNode;
  /** Extra classes on the outer shell (flex, shrink-0, transitions, hover shadow, etc.). */
  className?: string;
  /** Classes on the inner overflow clip (e.g. flex layout, min-h-0). */
  innerClassName?: string;
};

/**
 * WebKit (Safari / iOS / installed PWA) often clips or draws `border` incorrectly when
 * `overflow: hidden` and `border-radius` apply to the same box. Outer holds border + shadow;
 * inner clips content with a radius inset by 1px so the stroke stays visible.
 */
export function SurfaceListShell({ children, className = "", innerClassName = "" }: SurfaceListShellProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] ${className}`.trim()}
    >
      <div className={`overflow-hidden rounded-[calc(0.75rem-1px)] ${innerClassName}`.trim()}>{children}</div>
    </div>
  );
}
