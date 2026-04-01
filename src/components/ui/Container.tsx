import type { ElementType, ReactNode } from "react";

type ContainerProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
  children: ReactNode;
};

export function Container<T extends ElementType = "div">({
  as,
  className = "",
  children,
}: ContainerProps<T>) {
  const Comp = as ?? "div";

  return <Comp className={`mx-auto w-full max-w-[480px] px-5 ${className}`.trim()}>{children}</Comp>;
}
