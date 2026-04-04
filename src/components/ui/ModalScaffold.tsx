"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

const noopSubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

type ModalScaffoldProps = {
  open: boolean;
  onBackdropClose: () => void;
  /** Optional `id` of the dialog title for `aria-labelledby`. */
  titleId?: string;
  children: ReactNode;
};

export function ModalScaffold({ open, onBackdropClose, titleId, children }: ModalScaffoldProps) {
  const isClient = useIsClient();
  useBodyScrollLock(open && isClient);

  if (!open) return null;

  /** Above header and bottom nav (`z-30`), and outside their stacking contexts via `document.body`. */
  const tree = (
    <div
      className="fixed inset-0 z-[110] overflow-x-hidden overscroll-x-none"
      role="dialog"
      aria-modal="true"
      {...(titleId ? { "aria-labelledby": titleId } : {})}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onBackdropClose}
      />
      <div className="pointer-events-none fixed inset-0 flex min-h-0 min-w-0 flex-col items-center justify-center overflow-x-hidden overscroll-x-none pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-none flex w-full min-w-0 max-w-full justify-center">{children}</div>
      </div>
    </div>
  );

  if (!isClient) return null;

  return createPortal(tree, document.body);
}
