import type { ReactNode } from "react";

type AppMainProps = {
  children: ReactNode;
  className?: string;
};

/** Standard authenticated page wrapper: flexes with root layout, vertical rhythm, no duplicate min-h-dvh. */
export function AppMain({ children, className = "" }: AppMainProps) {
  return (
    <main className={`flex w-full min-h-0 flex-1 flex-col py-5 ${className}`.trim()}>{children}</main>
  );
}
