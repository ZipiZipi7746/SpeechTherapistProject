import {
  ABSTRACTNESS_LABEL, DIFFICULTY_LABEL, IMAGE_KIND_LABEL, POSITION_LABEL, VOWEL_LABEL,
} from "./constants";
import type {
  Abstractness, Category, Difficulty, ImageKind, Position, SearchFilters, VowelGroup,
} from "./types";

export const EMPTY_FILTERS: SearchFilters = {
  q: "", phonemes: [], position: null, forbidden: [], syllables: [], letters: [], vowels: [],
  categories: [], age: null, difficulty: [], abstractness: [], imageKinds: [],
};

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
const nums = (v: string | null) => list(v).map(Number).filter((n) => Number.isFinite(n));

export function parseFilters(p: URLSearchParams): SearchFilters {
  const pos = p.get("pos");
  const age = Number(p.get("age"));
  return {
    q: p.get("q") ?? "",
    phonemes: list(p.get("ph")),
    position: pos === "start" || pos === "middle" || pos === "end" ? (pos as Position) : null,
    forbidden: list(p.get("no")),
    syllables: nums(p.get("syl")),
    letters: nums(p.get("len")),
    vowels: list(p.get("vow")) as VowelGroup[],
    categories: list(p.get("cat")),
    age: p.get("age") && Number.isFinite(age) ? age : null,
    difficulty: list(p.get("diff")) as Difficulty[],
    abstractness: list(p.get("abs")) as Abstractness[],
    imageKinds: list(p.get("img")) as ImageKind[],
  };
}

export function serializeFilters(f: SearchFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.phonemes.length) p.set("ph", f.phonemes.join(","));
  if (f.position && f.phonemes.length) p.set("pos", f.position);
  if (f.forbidden.length) p.set("no", f.forbidden.join(","));
  if (f.syllables.length) p.set("syl", f.syllables.join(","));
  if (f.letters.length) p.set("len", f.letters.join(","));
  if (f.vowels.length) p.set("vow", f.vowels.join(","));
  if (f.categories.length) p.set("cat", f.categories.join(","));
  if (f.age !== null) p.set("age", String(f.age));
  if (f.difficulty.length) p.set("diff", f.difficulty.join(","));
  if (f.abstractness.length) p.set("abs", f.abstractness.join(","));
  if (f.imageKinds.length) p.set("img", f.imageKinds.join(","));
  return p.toString();
}

export type FilterKey = keyof SearchFilters;
export interface ActiveChip {
  id: string;
  key: FilterKey;
  value?: string | number;
  label: string;
}

export function activeChips(f: SearchFilters, categories: Category[] = []): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (f.q.trim()) chips.push({ id: "q", key: "q", label: `“${f.q.trim()}”` });
  f.phonemes.forEach((v) => chips.push({ id: `ph-${v}`, key: "phonemes", value: v, label: `/${v}/` }));
  if (f.position && f.phonemes.length)
    chips.push({ id: "pos", key: "position", label: `מיקום: ${POSITION_LABEL[f.position]}` });
  f.forbidden.forEach((v) => chips.push({ id: `no-${v}`, key: "forbidden", value: v, label: `ללא ${v}` }));
  if (f.age !== null) chips.push({ id: "age", key: "age", label: `גיל ${f.age === 6 ? "6+" : f.age}` });
  f.difficulty.forEach((v) => chips.push({ id: `diff-${v}`, key: "difficulty", value: v, label: `קושי: ${DIFFICULTY_LABEL[v]}` }));
  f.syllables.forEach((v) => chips.push({ id: `syl-${v}`, key: "syllables", value: v, label: `${v === 4 ? "4+" : v} הברות` }));
  f.letters.forEach((v) => chips.push({ id: `len-${v}`, key: "letters", value: v, label: `${v === 7 ? "7+" : v} אותיות` }));
  f.vowels.forEach((v) => chips.push({ id: `vow-${v}`, key: "vowels", value: v, label: `תנועה: ${VOWEL_LABEL[v].split(" (")[0]}` }));
  f.categories.forEach((v) =>
    chips.push({ id: `cat-${v}`, key: "categories", value: v, label: categories.find((c) => c.slug === v)?.name_he.split(" (")[0] ?? v }),
  );
  f.abstractness.forEach((v) => chips.push({ id: `abs-${v}`, key: "abstractness", value: v, label: ABSTRACTNESS_LABEL[v] }));
  f.imageKinds.forEach((v) => chips.push({ id: `img-${v}`, key: "imageKinds", value: v, label: `תמונה: ${IMAGE_KIND_LABEL[v]}` }));
  return chips;
}

export function removeChip(f: SearchFilters, chip: ActiveChip): SearchFilters {
  const next: SearchFilters = { ...f };
  switch (chip.key) {
    case "q": next.q = ""; break;
    case "position": next.position = null; break;
    case "age": next.age = null; break;
    case "phonemes":
      next.phonemes = f.phonemes.filter((x) => x !== chip.value);
      if (!next.phonemes.length) next.position = null;
      break;
    default: {
      const k = chip.key as "forbidden" | "syllables" | "letters" | "vowels" | "categories" | "difficulty" | "abstractness" | "imageKinds";
      (next as unknown as Record<string, unknown[]>)[k] = (f[k] as unknown[]).filter((x) => x !== chip.value);
    }
  }
  return next;
}

export function hasAnyFilter(f: SearchFilters): boolean {
  return activeChips(f).length > 0;
}

export function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}
