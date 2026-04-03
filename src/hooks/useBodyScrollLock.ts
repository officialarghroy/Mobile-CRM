import { useEffect } from "react";

const SCROLL_LOCK_ATTR = "data-scroll-locked";
const SCROLLBAR_GUTTER_VAR = "--app-scrollbar-gutter";

function getVerticalScrollbarWidth(): number {
  if (typeof window === "undefined") return 0;
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

function lockDocumentScroll(): () => void {
  const html = document.documentElement;
  const body = document.body;
  const scrollbarWidth = getVerticalScrollbarWidth();

  const prevHtmlOverflow = html.style.overflow;
  const prevBodyOverflow = body.style.overflow;
  const prevBodyPaddingRight = body.style.paddingRight;
  const prevGutterVar = html.style.getPropertyValue(SCROLLBAR_GUTTER_VAR);

  html.setAttribute(SCROLL_LOCK_ATTR, "");
  html.style.setProperty(SCROLLBAR_GUTTER_VAR, `${scrollbarWidth}px`);
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }

  return () => {
    html.removeAttribute(SCROLL_LOCK_ATTR);
    if (prevGutterVar) {
      html.style.setProperty(SCROLLBAR_GUTTER_VAR, prevGutterVar);
    } else {
      html.style.removeProperty(SCROLLBAR_GUTTER_VAR);
    }
    html.style.overflow = prevHtmlOverflow;
    body.style.overflow = prevBodyOverflow;
    body.style.paddingRight = prevBodyPaddingRight;
  };
}

let lockDepth = 0;
let releaseDocumentScroll: (() => void) | null = null;

/**
 * Prevents document scrolling while overlays (modals, drawers) are open.
 * Reserves horizontal space equal to the scrollbar width so layout does not jump
 * when `overflow: hidden` removes the classic scrollbar. Nested locks are ref-counted.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    lockDepth += 1;
    if (lockDepth === 1) {
      releaseDocumentScroll = lockDocumentScroll();
    }

    return () => {
      lockDepth -= 1;
      if (lockDepth === 0 && releaseDocumentScroll) {
        releaseDocumentScroll();
        releaseDocumentScroll = null;
      }
    };
  }, [locked]);
}
