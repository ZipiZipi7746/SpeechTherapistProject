import { Check } from "lucide-react";
import clsx from "clsx";

export const BUILD_STEPS = ["חיפוש וסינון", "בחירת מילים", "שמירה לסט", "הכנה להדפסה"] as const;

/** Persistent wizard header (spec ch.8 — procedural memory: "where am I in the process?"). */
export function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol aria-label="שלבי בניית סט" className="no-print flex items-center gap-1 sm:gap-2">
      {BUILD_STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={label} className={clsx("flex items-center gap-1 sm:gap-2", state === "current" ? "flex-none sm:flex-1" : "flex-1")} aria-current={state === "current" ? "step" : undefined}>
            <span
              className={clsx(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
                state === "done" && "bg-emerald-500 text-white",
                state === "current" && "bg-brand-600 text-white ring-4 ring-brand-100",
                state === "todo" && "bg-white text-ink-faint ring-1 ring-surface-line",
              )}
            >
              {state === "done" ? <Check className="size-4" /> : n}
            </span>
            <span className={clsx("text-[13px] font-semibold sm:text-sm", state === "current" ? "whitespace-nowrap text-ink" : "hidden text-ink-faint sm:inline")}>{label}</span>
            {n < BUILD_STEPS.length && <span className={clsx("h-0.5 flex-1 rounded", n < current ? "bg-emerald-400" : "bg-surface-line")} />}
          </li>
        );
      })}
    </ol>
  );
}
