"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/provider";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const width = size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md";

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`m-0 mt-auto h-auto max-h-[100dvh] w-full ${width} overflow-y-auto overscroll-contain rounded-t-2xl border border-border bg-surface p-0 text-foreground shadow-card backdrop:bg-black/60 backdrop:backdrop-blur-[2px] open:animate-pop-in sm:m-auto sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-1.5rem)] sm:rounded-2xl`}
    >
      {open && (
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="-mr-2 -mt-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-subtle hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 -mb-4 grid grid-cols-2 gap-2 border-t border-border bg-surface px-4 py-4 sm:-mx-6 sm:-mb-6 sm:flex sm:justify-end sm:px-6">
      {children}
    </div>
  );
}
