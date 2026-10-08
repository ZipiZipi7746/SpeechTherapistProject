"use client";
import clsx from "clsx";
import { ChevronDown, Plus, RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  ABSTRACTNESS_LABEL, AGES, ALPHABET, COMMON_PHONEMES, DIFFICULTY_LABEL, IMAGE_KIND_LABEL, LETTER_COUNTS,
  POSITION_LABEL, SYLLABLES, VOWEL_LABEL,
} from "@/lib/constants";
import { hasAnyFilter, toggleIn } from "@/lib/filters";
import type { Abstractness, Category, Difficulty, ImageKind, Position, SearchFilters, VowelGroup } from "@/lib/types";

interface Props {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
  onReset: () => void;
  categories: Category[];
}

function Section({ icon, title, hint, children }: { icon: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2.5 flex items-center gap-2 text-sm font-extrabold"><span aria-hidden>{icon}</span>{title}</legend>
      {hint && <p className="-mt-1 mb-2.5 text-xs text-ink-faint">{hint}</p>}
      {children}
    </fieldset>
  );
}

const Chip = ({ on, onClick, children, danger, label }: { on: boolean; onClick: () => void; children: ReactNode; danger?: boolean; label?: string }) => (
  <button type="button" aria-pressed={on} aria-label={label} onClick={onClick} className={clsx("chip", danger && "chip-danger")}>{children}</button>
);

/**
 * Chips instead of a form (less recall, more recognition) + progressive disclosure:
 * frequent filters first, advanced ones behind "פילטרים נוספים".
 */
export function FilterPanel({ filters: f, onChange, onReset, categories }: Props) {
  const advancedActive = f.forbidden.length + f.letters.length + f.vowels.length + f.categories.length + f.abstractness.length + f.imageKinds.length > 0;
  const [advanced, setAdvanced] = useState(advancedActive);
  const [allLetters, setAllLetters] = useState(false);
  const set = (patch: Partial<SearchFilters>) => onChange({ ...f, ...patch });

  const extraSelected = f.phonemes.filter((p) => !COMMON_PHONEMES.includes(p));
  const phonemeChips = [...COMMON_PHONEMES, ...extraSelected];

  return (
    <div className="space-y-6">
      <Section icon="🔤" title="פונמה">
        <div className="flex flex-wrap gap-2">
          {phonemeChips.map((p) => <Chip key={p} on={f.phonemes.includes(p)} onClick={() => set({ phonemes: toggleIn(f.phonemes, p), position: f.phonemes.length === 1 && f.phonemes[0] === p ? null : f.position })} label={`צליל ${p}`}>{p}</Chip>)}
          <button type="button" className="chip" aria-expanded={allLetters} aria-label="כל האותיות" onClick={() => setAllLetters((v) => !v)}><Plus className={clsx("size-4 transition", allLetters && "rotate-45")} /></button>
        </div>
        {allLetters && (
          <div className="mt-3 grid grid-cols-6 gap-1.5 rounded-2xl bg-surface-muted p-3">
            {ALPHABET.map((p) => <button key={p} type="button" aria-pressed={f.phonemes.includes(p)} onClick={() => set({ phonemes: toggleIn(f.phonemes, p) })} className="chip min-h-9 min-w-0 px-0">{p}</button>)}
          </div>
        )}
      </Section>

      <Section icon="📍" title="מיקום הצליל במילה" hint={f.phonemes.length ? undefined : "בחרי צליל כדי לבחור מיקום"}>
        <div role="radiogroup" aria-label="מיקום הצליל" className="space-y-1">
          {([null, "start", "middle", "end"] as (Position | null)[]).map((p) => (
            <label key={p ?? "any"} className={clsx("flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-[15px]", !f.phonemes.length && "cursor-not-allowed opacity-40")}>
              <input type="radio" name="position" disabled={!f.phonemes.length} checked={f.position === p} onChange={() => set({ position: p })} className="size-[18px] accent-brand-600" />
              {p ? POSITION_LABEL[p] : "בכל מקום"}
            </label>
          ))}
        </div>
      </Section>

      <Section icon="👶" title="לאיזה גיל את מכינה?">
        <div className="flex flex-wrap gap-2">
          {AGES.map((a) => <Chip key={a} on={f.age === a} onClick={() => set({ age: f.age === a ? null : a })}>{a === 6 ? "+6" : a}</Chip>)}
        </div>
      </Section>

      <Section icon="⚡" title="רמת קושי">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => <Chip key={d} on={f.difficulty.includes(d)} onClick={() => set({ difficulty: toggleIn(f.difficulty, d) })}>{DIFFICULTY_LABEL[d]}</Chip>)}
        </div>
      </Section>

      <Section icon="🥁" title="מספר הברות">
        <div className="flex flex-wrap gap-2">
          {SYLLABLES.map((n) => <Chip key={n} on={f.syllables.includes(n)} onClick={() => set({ syllables: toggleIn(f.syllables, n) })}>{n === 4 ? "+4" : n}</Chip>)}
        </div>
      </Section>

      <div className="border-t border-surface-line pt-4">
        <button type="button" onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced} className="flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-sm font-extrabold text-brand-700 hover:text-brand-900">
          פילטרים נוספים{advancedActive && !advanced ? ` (${f.forbidden.length + f.letters.length + f.vowels.length + f.categories.length + f.abstractness.length + f.imageKinds.length})` : ""}
          <ChevronDown className={clsx("size-5 transition", advanced && "rotate-180")} />
        </button>

        {advanced && (
          <div className="mt-5 animate-fade-in space-y-6">
            <Section icon="🚫" title="אותיות אסורות" hint="מילים שמכילות את האותיות האלה לא יוצגו">
              <div className="grid grid-cols-6 gap-1.5">
                {ALPHABET.map((p) => <button key={p} type="button" aria-pressed={f.forbidden.includes(p)} onClick={() => set({ forbidden: toggleIn(f.forbidden, p) })} className="chip chip-danger min-h-9 min-w-0 px-0">{p}</button>)}
              </div>
            </Section>

            <Section icon="🔢" title="מספר אותיות">
              <div className="flex flex-wrap gap-2">
                {LETTER_COUNTS.map((n) => <Chip key={n} on={f.letters.includes(n)} onClick={() => set({ letters: toggleIn(f.letters, n) })}>{n === 7 ? "+7" : n}</Chip>)}
              </div>
            </Section>

            <Section icon="🎵" title="סוג תנועה">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(VOWEL_LABEL) as VowelGroup[]).map((v) => <Chip key={v} on={f.vowels.includes(v)} onClick={() => set({ vowels: toggleIn(f.vowels, v) })}>{VOWEL_LABEL[v]}</Chip>)}
              </div>
            </Section>

            <Section icon="🧩" title="קבוצה פונולוגית" hint="לחצי על קבוצה כדי לסנן. מתחת לכל שם — הסבר קצר.">
              <div className="space-y-2">
                {categories.map((c) => {
                  const on = f.categories.includes(c.slug);
                  return (
                    <button key={c.slug} type="button" aria-pressed={on} onClick={() => set({ categories: toggleIn(f.categories, c.slug) })}
                      className={clsx("block w-full rounded-2xl border p-3 text-start transition", on ? "border-brand-600 bg-brand-50" : "border-surface-line hover:border-brand-300")}>
                      <b className="block text-sm">{c.name_he}</b>
                      <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{c.description_he}</span>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section icon="💭" title="רמת מופשטות">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ABSTRACTNESS_LABEL) as Abstractness[]).map((a) => <Chip key={a} on={f.abstractness.includes(a)} onClick={() => set({ abstractness: toggleIn(f.abstractness, a) })}>{ABSTRACTNESS_LABEL[a]}</Chip>)}
              </div>
            </Section>

            <Section icon="🖼️" title="סוג תמונה">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(IMAGE_KIND_LABEL) as ImageKind[]).map((k) => <Chip key={k} on={f.imageKinds.includes(k)} onClick={() => set({ imageKinds: toggleIn(f.imageKinds, k) })}>{IMAGE_KIND_LABEL[k]}</Chip>)}
              </div>
            </Section>
          </div>
        )}
      </div>

      {hasAnyFilter(f) && (
        <button type="button" onClick={onReset} className="btn btn-ghost w-full min-h-10 text-sm"><RotateCcw className="size-4" /> נקי הכל</button>
      )}
    </div>
  );
}
