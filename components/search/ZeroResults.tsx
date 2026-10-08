"use client";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { repo } from "@/lib/data";
import { activeChips, removeChip, EMPTY_FILTERS, type ActiveChip } from "@/lib/filters";
import type { Category, SearchFilters } from "@/lib/types";

/**
 * Spec scenario 4: zero results are neither empty nor an error — a friendly state with
 * one-tap chips that remove a filter (and show how many results that would give).
 */
export function ZeroResults({ filters, categories, onChange }: { filters: SearchFilters; categories: Category[]; onChange: (f: SearchFilters) => void }) {
  const chips = activeChips(filters, categories);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let live = true;
    setCounts({});
    Promise.all(chips.map(async (c) => [c.id, await repo.countWords(removeChip(filters, c))] as const))
      .then((r) => live && setCounts(Object.fromEntries(r)))
      .catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const remove = (c: ActiveChip) => onChange(removeChip(filters, c));
  // most helpful first: the removals that give the most results
  const sorted = [...chips].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));

  return (
    <>
    <EmptyState emoji="🧐" title="לא מצאנו מילים כאלה" actions={
      <div className="flex flex-wrap justify-center gap-2" aria-label="הצעות להרחבת החיפוש">
        {sorted.map((c) => (
          <button key={c.id} onClick={() => remove(c)} className={`chip min-h-11 font-semibold ${counts[c.id] === 0 ? "opacity-60" : "border-brand-300 bg-brand-50"}`}>
            הסר: {c.label}
            {counts[c.id] !== undefined && <span className="rounded-full bg-white px-2 text-xs text-brand-700">{counts[c.id]}</span>}
          </button>
        ))}
        <button onClick={() => onChange(EMPTY_FILTERS)} className="chip min-h-11 font-bold text-brand-700">נקי הכל</button>
      </div>
    }>
      נסי להרחיב את החיפוש 👇
    </EmptyState>
    <p className="pb-6 text-center">
      <Link href="/upload" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline"><PlusCircle className="size-4" /> לא מצאת? הוסיפי מילה חדשה</Link>
    </p>
    </>
  );
}
