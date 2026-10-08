import type { Position } from "./types";

const FINAL: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

/** Removes nikud / cantillation marks and the geresh sign. */
export function stripNikud(s: string): string {
  return s.replace(/[֑-ׇ׳]/g, "").trim();
}

export function normLetter(c: string): string {
  return FINAL[c] ?? c;
}

export function isHebrewLetter(c: string): boolean {
  return /[א-ת]/.test(c);
}

/** letter -> set of positions in which it appears (start / middle / end). Mirrors the DB trigger. */
export function phonemePositions(plain: string): Map<string, Set<Position>> {
  const letters = [...plain];
  const map = new Map<string, Set<Position>>();
  letters.forEach((raw, i) => {
    const l = normLetter(raw);
    const pos: Position = i === 0 ? "start" : i === letters.length - 1 ? "end" : "middle";
    if (!map.has(l)) map.set(l, new Set());
    map.get(l)!.add(pos);
  });
  return map;
}

/** Suggests a category slug from the first letter (manner of articulation). */
export function suggestCategorySlug(plain: string, hasGeresh = false): string | null {
  const first = normLetter(plain[0] ?? "");
  if (hasGeresh && first === "ג") return "affricates";
  if ("בפטתדקכג".includes(first)) return "stops";
  if ("סזחהוש".includes(first)) return "fricatives";
  if (first === "צ") return "affricates";
  if ("מנ".includes(first)) return "nasals";
  if ("לר".includes(first)) return "liquids";
  if ("יאע".includes(first)) return "glides";
  return null;
}
