import type { Abstractness, Difficulty, ImageKind, Position, VowelGroup } from "./types";

export const ALPHABET = [
  "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת",
];
export const COMMON_PHONEMES = ["ש", "פ", "ר", "ל", "ס", "ק"];

export const POSITION_LABEL: Record<Position, string> = { start: "תחילה", middle: "אמצע", end: "סוף" };
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "קלה", medium: "בינונית", hard: "קשה" };
export const ABSTRACTNESS_LABEL: Record<Abstractness, string> = { concrete: "קונקרטי", abstract: "מופשט" };
export const IMAGE_KIND_LABEL: Record<ImageKind, string> = { color: "צבע", bw: "שחור-לבן", illustration: "איור" };
export const VOWEL_LABEL: Record<VowelGroup, string> = {
  a: "פתח / קמץ (a)",
  e: "צירה / סגול (e)",
  i: "חיריק (i)",
  o: "חולם (o)",
  u: "שורוק / קובוץ (u)",
};

export const AGES = [3, 4, 5, 6] as const; // 6 => 6+
export const SYLLABLES = [1, 2, 3, 4] as const; // 4 => 4+
export const LETTER_COUNTS = [2, 3, 4, 5, 6, 7] as const; // 7 => 7+

export const GUEST_RESULT_LIMIT = 5;
export const PAGE_SIZE = 24;

export const SET_COLORS: Record<string, string> = {
  purple: "from-fuchsia-500 to-purple-500",
  blue: "from-sky-400 to-blue-500",
  orange: "from-amber-400 to-orange-500",
  green: "from-emerald-400 to-teal-500",
  pink: "from-pink-400 to-rose-500",
};
export const SET_COLOR_KEYS = Object.keys(SET_COLORS);

export function ageLabel(min: number, max: number) {
  return min === max ? `${min}` : `${min}–${max}`;
}
