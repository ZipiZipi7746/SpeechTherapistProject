"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Word } from "@/lib/types";

/** Words picked for a new set. Survives navigation (sessionStorage) so the sticky "N words selected" bar never loses its place. */
interface SelectionApi {
  words: Word[];
  ids: Set<string>;
  count: number;
  has: (id: string) => boolean;
  toggle: (w: Word) => boolean; // returns true when now selected
  remove: (id: string) => void;
  clear: () => void;
}

const KEY = "speechsearch_selection";
const Ctx = createContext<SelectionApi | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [words, setWords] = useState<Word[]>([]);
  const ref = useRef<Word[]>([]);
  ref.current = words;

  useEffect(() => {
    try { const raw = sessionStorage.getItem(KEY); if (raw) setWords(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(words)); } catch { /* ignore */ }
  }, [words]);

  const toggle = useCallback((w: Word) => {
    const selected = ref.current.some((x) => x.id === w.id);
    setWords((cur) => (selected ? cur.filter((x) => x.id !== w.id) : [...cur, w]));
    return !selected;
  }, []);

  const api = useMemo<SelectionApi>(() => {
    const ids = new Set(words.map((w) => w.id));
    return {
      words, ids, count: words.length, has: (id) => ids.has(id), toggle,
      remove: (id) => setWords((cur) => cur.filter((x) => x.id !== id)), clear: () => setWords([]),
    };
  }, [words, toggle]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSelection(): SelectionApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSelection must be used inside SelectionProvider");
  return v;
}
