import { normalizeEmailForDisplay, splitEmailForDisplay } from "@/lib/formatEmailDisplay";

type EmailTwoLinesProps = {
  email: string;
  className?: string;
  domainClassName?: string;
  align?: "start" | "end";
  /**
   * Table cells: span full column width with a stable left edge (avoids centered inline-block shrink-wrap).
   * Default keeps `inline-block` for contexts like the nav drawer where short emails may be centered.
   */
  fullWidth?: boolean;
};

export function EmailTwoLines({
  email,
  className = "",
  domainClassName = "",
  align = "start",
  fullWidth = false,
}: EmailTwoLinesProps) {
  const cleaned = normalizeEmailForDisplay(email);
  const split = splitEmailForDisplay(email);
  const textAlign = align === "end" ? "text-right" : "text-left";

  const Root: "div" | "span" = fullWidth ? "div" : "span";
  const Line: "div" | "span" = fullWidth ? "div" : "span";

  const bidiBox = fullWidth ? "[unicode-bidi:isolate]" : "";

  const box = fullWidth
    ? `w-full min-w-0 max-w-full ${textAlign} [direction:ltr] ${bidiBox}`
    : `inline-block max-w-full min-w-0 align-top ${textAlign}`;

  if (!split) {
    return (
      <Root className={`${box} ${className}`} aria-label={cleaned || email} title={cleaned || email}>
        {cleaned || email}
      </Root>
    );
  }

  const localLineClass = fullWidth
    ? `w-full min-w-0 max-w-full truncate text-left [direction:ltr] [unicode-bidi:isolate]`
    : "block w-full min-w-0 max-w-full break-words [overflow-wrap:anywhere]";

  const domainLineClass = fullWidth
    ? `w-full min-w-0 max-w-full whitespace-nowrap text-left [direction:ltr] [unicode-bidi:isolate] ${domainClassName}`
    : `block w-full min-w-0 max-w-full whitespace-nowrap text-left ${domainClassName}`;

  return (
    <Root className={`${box} ${className}`} aria-label={cleaned || email} title={cleaned || email}>
      <Line className={localLineClass}>{split.localPart}</Line>
      <Line className={domainLineClass.trim()}>{split.domainLine}</Line>
    </Root>
  );
}
