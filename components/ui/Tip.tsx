import type { ReactNode } from "react";

/** Lightweight CSS tooltip (hover + keyboard focus). */
export function Tip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full start-1/2 z-30 mb-2 w-max max-w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs font-medium leading-snug text-white opacity-0 shadow-pop transition group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 rtl:translate-x-1/2">
        {text}
      </span>
    </span>
  );
}
