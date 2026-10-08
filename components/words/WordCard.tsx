"use client";
import clsx from "clsx";
import { Check, Copy, Plus, TriangleAlert, ArrowUpLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSelection } from "@/components/providers/SelectionProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Tip } from "@/components/ui/Tip";
import { ageLabel, DIFFICULTY_LABEL } from "@/lib/constants";
import type { Word } from "@/lib/types";
import { WordVisual } from "./WordVisual";

const DIFF_COLOR = { easy: "text-emerald-700", medium: "text-amber-700", hard: "text-rose-700" } as const;

export function WordCard({ word }: { word: Word }) {
  const { user, requireAuth } = useAuth();
  const sel = useSelection();
  const toast = useToast();
  const selected = sel.has(word.id);
  const warn = word.cultural_warning || word.images.some((i) => i.cultural_warning);

  const toggle = () => {
    if (!requireAuth()) return;
    sel.toggle(word);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(word.text); toast.show("המילה הועתקה ללוח"); } catch { toast.error("לא הצלחנו להעתיק"); }
  };

  return (
    <article className={clsx("card group relative flex flex-col overflow-hidden transition", selected ? "border-brand-600 ring-2 ring-brand-500" : "hover:-translate-y-0.5 hover:shadow-pop")}>
      {/* picture */}
      <div className="relative bg-brand-gradient-soft">
        <WordVisual word={word} className="aspect-[4/3]" emojiClass="text-6xl sm:text-7xl" />
        {selected && (
          <span className="absolute end-3 top-3 flex size-7 items-center justify-center rounded-full bg-brand-600 text-white shadow" aria-label="נבחרה לסט"><Check className="size-4" strokeWidth={3} /></span>
        )}
        {warn && (
          <span className="absolute start-3 top-3">
            <Tip text="תמונה זו עשויה שלא להתאים לכל הקהלים">
              <span tabIndex={0} role="img" aria-label="אזהרת התאמה תרבותית" className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-600"><TriangleAlert className="size-4" /></span>
            </Tip>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-center text-2xl font-extrabold leading-tight">
          {user ? <Link href={`/words/${word.id}`} className="hover:text-brand-700">{word.text}</Link> : word.text}
        </h3>

        {/* Gestalt: the phonological info lives in one tinted block, visually apart from the actions */}
        {user ? (
          <dl className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-muted p-2.5 text-center text-xs text-ink-soft">
            <div><dt className="sr-only">הברות</dt><dd><b className="block text-sm text-ink">{word.syllable_count}</b>הברות</dd></div>
            <div><dt className="sr-only">רמת קושי</dt><dd><b className={clsx("block text-sm", DIFF_COLOR[word.difficulty])}>{DIFFICULTY_LABEL[word.difficulty]}</b>קושי</dd></div>
            <div><dt className="sr-only">גיל</dt><dd><b className="block text-sm text-ink">{ageLabel(word.age_min, word.age_max)}</b>גיל</dd></div>
          </dl>
        ) : (
          <p className="rounded-2xl bg-surface-muted p-2.5 text-center text-xs text-ink-soft">{word.syllable_count} הברות{word.category ? ` · ${word.category.name_he.split(" (")[0]}` : ""}</p>
        )}

        {/* actions: one strong primary, quiet secondary icons */}
        <div className="mt-auto flex items-center gap-1.5">
          <button onClick={toggle} aria-pressed={selected} className={clsx("btn min-h-11 flex-1 px-3 text-sm", selected ? "btn-ghost border-brand-600 text-brand-700" : "btn-primary")}>
            {selected ? <><Check className="size-4" /> נבחרה</> : <><Plus className="size-4" /> הוסיפי לסט</>}
          </button>
          {user && (
            <>
              <button onClick={copy} className="btn-icon hidden sm:inline-flex" aria-label="העתקת המילה"><Copy className="size-[18px]" /></button>
              <Link href={`/words/${word.id}`} className="btn-icon hidden sm:inline-flex" aria-label="פרטי המילה"><ArrowUpLeft className="size-[18px]" /></Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
