"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Max width class — defaults to max-w-md */
  size?: "sm" | "md" | "lg";
}

const sizeCls = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg" };

export function Dialog({ open, onClose, title, description, children, size = "md" }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    /* Mobile: slide up from bottom. Desktop: centred with padding. */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — full-width on mobile, capped on desktop */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={[
          "relative w-full bg-surface shadow-lg border border-border",
          "p-6 flex flex-col gap-5",
          "rounded-t-2xl sm:rounded-2xl",
          "max-h-[90dvh] overflow-y-auto",
          sizeCls[size],
        ].join(" ")}
      >
        {/* Drag handle pill — mobile only */}
        <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-border" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mt-2 sm:mt-0">
          <div>
            <h2 id="dialog-title" className="text-base font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border/40 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
      {children}
    </div>
  );
}
