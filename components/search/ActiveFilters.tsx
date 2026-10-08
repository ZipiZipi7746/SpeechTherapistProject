"use client";
import { X } from "lucide-react";
import type { ActiveChip } from "@/lib/filters";

/** Active filters: solid dark chips with ✕, a horizontally scrollable row on mobile (spec ch.10–11). */
export function ActiveFilters({ chips, onRemove, onClear }: { chips: ActiveChip[]; onRemove: (c: ActiveChip) => void; onClear: () => void }) {
  if (!chips.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" aria-label="פילטרים פעילים">
      {chips.map((c) => (
        <button key={c.id} onClick={() => onRemove(c)} aria-label={`הסרת הפילטר ${c.label}`} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 text-sm font-semibold text-white transition hover:bg-brand-800">
          {c.label}<X className="size-3.5" />
        </button>
      ))}
      <button onClick={onClear} className="shrink-0 px-2 text-sm font-bold text-brand-700 hover:underline">נקי הכל</button>
    </div>
  );
}
