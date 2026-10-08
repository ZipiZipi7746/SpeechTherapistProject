"use client";
import { Lock, PlusCircle, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSelection } from "@/components/providers/SelectionProvider";
import { ActiveFilters } from "@/components/search/ActiveFilters";
import { FilterPanel } from "@/components/search/FilterPanel";
import { ZeroResults } from "@/components/search/ZeroResults";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/ui/Stepper";
import { WordCard } from "@/components/words/WordCard";
import { GUEST_RESULT_LIMIT, PAGE_SIZE } from "@/lib/constants";
import { repo } from "@/lib/data";
import { activeChips, EMPTY_FILTERS, parseFilters, removeChip, serializeFilters } from "@/lib/filters";
import { addRecent } from "@/lib/recent";
import type { Category, SearchFilters, Word } from "@/lib/types";

function SearchScreen() {
  const { user, loading: authLoading } = useAuth();
  const sel = useSelection();
  const router = useRouter();
  const params = useSearchParams();
  // Local state is the source of truth (so rapid chip clicks never act on a stale URL); the URL mirrors it.
  const [filters, setFilters] = useState<SearchFilters>(() => parseFilters(new URLSearchParams(params.toString())));
  const key = serializeFilters(filters);
  const lastPush = useRef(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [libraryTotal, setLibraryTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [text, setText] = useState(filters.q);
  const reqId = useRef(0);

  const go = useCallback((f: SearchFilters) => {
    setFilters(f);
    lastPush.current = Date.now();
    const qs = serializeFilters(f);
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router]);

  // back / forward navigation: adopt the URL when it changed from outside
  useEffect(() => {
    if (Date.now() - lastPush.current < 1500) return;
    const fromUrl = parseFilters(new URLSearchParams(params.toString()));
    if (serializeFilters(fromUrl) !== serializeFilters(filters)) setFilters(fromUrl);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  // text box → URL (debounced), keeping all other filters
  useEffect(() => { setText(filters.q); }, [filters.q]);
  useEffect(() => {
    if (text.trim() === filters.q.trim()) return;
    const t = setTimeout(() => go({ ...filters, q: text }), 350);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (user) repo.listCategories().then(setCategories).catch(() => {}); }, [user]);

  useEffect(() => {
    if (authLoading) return;
    const id = ++reqId.current;
    setStatus("loading"); setPage(0);
    const run = user
      ? repo.searchWords(filters, 0, PAGE_SIZE).then((r) => ({ ...r, libraryTotal: 0 }))
      : repo.guestSearch(filters.q);
    run.then((r) => {
      if (id !== reqId.current) return;
      setWords(r.words); setTotal(r.total); setLibraryTotal(r.libraryTotal); setStatus("ready");
      if (user && key) addRecent(key, activeChips(filters, categories).map((c) => c.label).join(" · ") || "חיפוש");
    }).catch(() => { if (id === reqId.current) setStatus("error"); });
  }, [key, user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await repo.searchWords(filters, page + 1, PAGE_SIZE);
      setWords((w) => [...w, ...r.words]); setPage((p) => p + 1);
    } catch { setStatus("error"); } finally { setLoadingMore(false); }
  };

  const chips = activeChips(filters, categories);
  const guest = !user;
  const step = sel.count > 0 ? 2 : 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {user && <div className="mb-6"><Stepper current={step} /></div>}

      <form role="search" onSubmit={(e) => { e.preventDefault(); go({ ...filters, q: text }); }} className="card mb-5 flex items-center gap-3 px-5">
        <Search className="size-5 shrink-0 text-ink-faint" />
        <input aria-label="חיפוש מילה, צליל או קטגוריה" value={text} onChange={(e) => setText(e.target.value)} placeholder="מצאי את המילה המושלמת לטיפול…" className="min-h-14 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-faint" />
      </form>

      {guest && !authLoading && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-gradient-soft p-4 ring-1 ring-brand-200">
          <p className="flex items-center gap-2 text-[15px] font-medium"><Lock className="size-4 shrink-0 text-brand-700" /> כאורחת את רואה עד {GUEST_RESULT_LIMIT} תוצאות, בלי פילטרים. הצטרפי וקבלי את המאגר המלא{libraryTotal ? ` (${libraryTotal}+ מילים)` : ""}.</p>
          <Link href="/signup" className="btn btn-primary min-h-10 px-5">הצטרפי — חינם!</Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {user && (
          <aside className="hidden lg:block" aria-label="פילטרים">
            <div className="card sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto p-5">
              <FilterPanel filters={filters} onChange={go} onReset={() => go({ ...EMPTY_FILTERS, q: filters.q })} categories={categories} />
            </div>
          </aside>
        )}

        <section aria-live="polite" className="min-w-0">
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg font-extrabold">
                {status === "ready" ? (guest ? `מציגה ${words.length}${total > words.length ? ` מתוך ${total}` : ""} תוצאות` : `${total} מילים`) : "מחפשת…"}
              </h1>
              {user && (
                <button onClick={() => setSheet(true)} className="btn btn-ghost min-h-10 px-4 text-sm lg:hidden">
                  <SlidersHorizontal className="size-4" /> סינון{chips.length ? ` (${chips.length})` : ""}
                </button>
              )}
            </div>
            {user && <ActiveFilters chips={chips} onRemove={(c) => go(removeChip(filters, c))} onClear={() => go(EMPTY_FILTERS)} />}
          </div>

          {status === "loading" && (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-72" />)}</div>
          )}

          {status === "error" && (
            <div className="card p-10 text-center">
              <p className="text-lg font-bold">לא הצלחנו לטעון את התוצאות 😕</p>
              <button onClick={() => go(filters)} className="btn btn-primary mt-4">נסי שוב</button>
            </div>
          )}

          {status === "ready" && words.length === 0 && (
            user ? <ZeroResults filters={filters} categories={categories} onChange={go} />
              : <div className="card p-10 text-center"><p className="text-lg font-bold">לא מצאנו מילים כאלה 👇</p><p className="mt-1 text-ink-soft">נסי חיפוש אחר, או הצטרפי לחיפוש מתקדם.</p></div>
          )}

          {status === "ready" && words.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {words.map((w) => <WordCard key={w.id} word={w} />)}
              </div>
              {user && words.length < total && (
                <div className="mt-8 text-center">
                  <button onClick={loadMore} disabled={loadingMore} className="btn btn-ghost px-8">{loadingMore ? "טוענת…" : `טעני עוד (${total - words.length})`}</button>
                </div>
              )}
              {guest && total > words.length && (
                <div className="mt-8 rounded-3xl bg-brand-gradient p-6 text-center text-white">
                  <p className="text-lg font-bold">יש עוד {total - words.length} תוצאות לחיפוש הזה 🔒</p>
                  <Link href="/signup" className="btn mt-3 bg-white px-7 text-brand-700 hover:bg-brand-50">הצטרפי — חינם!</Link>
                </div>
              )}
              {user && (
                <p className="mt-10 text-center">
                  <Link href="/upload" className="inline-flex items-center gap-2 text-[15px] font-bold text-brand-700 hover:underline"><PlusCircle className="size-5" /> לא מצאת? הוסיפי מילה חדשה</Link>
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <Modal open={sheet} onClose={() => setSheet(false)} title="סינון" sheet
        footer={<><button className="btn btn-primary" onClick={() => setSheet(false)}>הצגת תוצאות{status === "ready" ? ` (${total})` : ""}</button></>}>
        <FilterPanel filters={filters} onChange={go} onReset={() => go({ ...EMPTY_FILTERS, q: filters.q })} categories={categories} />
      </Modal>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchScreen /></Suspense>;
}
