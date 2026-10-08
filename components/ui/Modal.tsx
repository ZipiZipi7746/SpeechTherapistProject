"use client";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import clsx from "clsx";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Render as a bottom sheet on small screens (spec: mobile filters = Bottom Sheet). */
  sheet?: boolean;
}

export function Modal({ open, onClose, title, children, footer, size = "md", sheet }: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={clsx("no-print fixed inset-0 z-[60] flex justify-center bg-ink/45 backdrop-blur-[2px] animate-fade-in", sheet ? "items-end md:items-center" : "items-center", "p-0 md:p-4")}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={clsx(
          "flex max-h-[92dvh] w-full flex-col bg-white shadow-pop",
          sheet ? "animate-sheet-in rounded-t-3xl md:animate-fade-in md:rounded-3xl" : "animate-fade-in mx-4 rounded-3xl md:mx-0",
          size === "sm" && "md:max-w-md", size === "md" && "md:max-w-xl", size === "lg" && "md:max-w-3xl",
        )}
      >
        <div className="flex items-center justify-between gap-4 px-6 pb-2 pt-5">
          <h2 id={titleId} className="text-xl font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="סגירה" className="btn-icon -me-2"><X className="size-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-3">{children}</div>
        {footer && <div className="pb-safe flex flex-wrap items-center gap-3 border-t border-surface-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
