"use client";
import { ArrowLeft, FolderOpen, History, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { SET_COLORS } from "@/lib/constants";
import { repo } from "@/lib/data";
import { getRecent, type RecentSearch } from "@/lib/recent";
import type { SetSummary } from "@/lib/types";

export function MemberHome() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [sets, setSets] = useState<SetSummary[] | null>(null);

  useEffect(() => {
    setRecent(getRecent());
    repo.listSets().then(setSets).catch(() => setSets([]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">שלום, {user?.display_name} 👋</h1>
          <p className="mt-1 text-ink-soft">מה מכינות היום?</p>
        </div>
        <Link href="/search" className="btn btn-primary min-h-12 px-7"><Search className="size-5" /> חיפוש חדש</Link>
      </div>

      <section className="mt-10" aria-labelledby="recent">
        <h2 id="recent" className="mb-3 flex items-center gap-2 text-lg font-extrabold"><History className="size-5 text-brand-600" /> חיפושים אחרונים</h2>
        {recent.length ? (
          <ul className="flex flex-wrap gap-2">
            {recent.map((r) => <li key={r.query}><Link href={`/search?${r.query}`} className="chip">{r.label}</Link></li>)}
          </ul>
        ) : <p className="rounded-2xl bg-white p-5 text-ink-soft shadow-card">עוד לא חיפשת — בואי נתחיל! החיפושים שלך יופיעו כאן.</p>}
      </section>

      <section className="mt-10" aria-labelledby="sets">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="sets" className="flex items-center gap-2 text-lg font-extrabold"><FolderOpen className="size-5 text-brand-600" /> סטים שמורים</h2>
          <Link href="/sets" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">לכל הסטים <ArrowLeft className="size-4" /></Link>
        </div>
        {sets === null ? <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          : sets.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {sets.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <Link href={`/sets/${s.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-pop">
                    <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${SET_COLORS[s.color] ?? SET_COLORS.purple}`}><FolderOpen className="size-6" /></span>
                    <span className="min-w-0"><b className="block truncate text-lg">{s.name}</b><span className="text-sm text-ink-soft">{s.word_count} מילים</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="card flex flex-col items-center gap-3 p-8 text-center">
              <p className="text-ink-soft">עוד אין לך סטים. חפשי מילים ולחצי ״הוסיפי לסט״.</p>
              <Link href="/search" className="btn btn-ghost"><Plus className="size-4" /> להתחיל לחפש</Link>
            </div>
          )}
      </section>
    </div>
  );
}
