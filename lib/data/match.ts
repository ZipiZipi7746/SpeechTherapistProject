import { phonemePositions, stripNikud } from "../hebrew";
import type { Category, SearchFilters, Word } from "../types";

/** In-memory twin of the SQL function `search_words` (used by demo mode). */
export function matchesFilters(w: Word, f: SearchFilters, categories: Category[]): boolean {
  const q = stripNikud(f.q).replace(/[%_]/g, "");
  if (q) {
    const inText = w.plain_text.includes(q);
    const inCat = w.category?.name_he.includes(f.q.trim()) ?? false;
    if (!inText && !inCat) return false;
  }
  const pp = phonemePositions(w.plain_text);
  if (f.phonemes.length) {
    const ok = f.phonemes.some((ph) => {
      const pos = pp.get(ph);
      return pos && (!f.position || pos.has(f.position));
    });
    if (!ok) return false;
  }
  if (f.forbidden.some((l) => pp.has(l))) return false;
  if (f.syllables.length && !f.syllables.some((s) => (s === 4 ? w.syllable_count >= 4 : w.syllable_count === s))) return false;
  if (f.letters.length && !f.letters.some((s) => (s === 7 ? w.letter_count >= 7 : w.letter_count === s))) return false;
  if (f.vowels.length && !f.vowels.some((v) => w.vowels.includes(v))) return false;
  if (f.categories.length) {
    const ids = categories.filter((c) => f.categories.includes(c.slug)).map((c) => c.id);
    if (!w.category_id || !ids.includes(w.category_id)) return false;
  }
  if (f.age !== null && !(w.age_min <= f.age && w.age_max >= f.age)) return false;
  if (f.difficulty.length && !f.difficulty.includes(w.difficulty)) return false;
  if (f.abstractness.length && !f.abstractness.includes(w.abstractness)) return false;
  if (f.imageKinds.length && !w.images.some((i) => f.imageKinds.includes(i.kind))) return false;
  return true;
}
