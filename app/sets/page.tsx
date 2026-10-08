"use client";
import { Download, FolderOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { SetFormModal } from "@/components/sets/SetFormModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tip } from "@/components/ui/Tip";
import { SET_COLORS } from "@/lib/constants";
import { repo } from "@/lib/data";
import { plural, relativeDay } from "@/lib/format";
import type { SetSummary } from "@/lib/types";

function SetsScreen() {
  const router = useRouter();
  const toast = useToast();
  const [sets, setSets] = useState<SetSummary[] | null>(null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<SetSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const load = () => repo.listSets().then((s) => { setSets(s); setError(false); }).catch(() => setError(true));
  useEffect(() => { void load(); }, []);

  const shown = useMemo(() => (sets ?? []).filter((s) => s.name.includes(q.trim()) || (s.child_name ?? "").includes(q.trim())), [sets, q]);
  const totalWords = (sets ?? []).reduce((n, s) => n + s.word_count, 0);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await repo.deleteSet(deleting.id); toast.show("הסט נמחק"); setDeleting(null); await load(); }
    catch { toast.error("המחיקה נכשלה. נסי שוב."); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">הסטים שלי</h1>
          {sets && <p className="mt-1 text-ink-soft">{plural(sets.length, "סט", "סטים")} • {totalWords} מילים סך הכול</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus className="size-5" /> סט חדש</button>
      </div>

      {sets && sets.length > 0 && (
        <div className="card mt-6 flex items-center gap-3 px-5">
          <Search className="size-5 text-ink-faint" />
          <input aria-label="חיפוש סט" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חפשי סט…" className="min-h-12 flex-1 bg-transparent outline-none placeholder:text-ink-faint" />
        </div>
      )}

      <div className="mt-5 space-y-3">
        {error && <div className="card p-8 text-center"><p className="font-bold">לא הצלחנו לטעון את הסטים 😕</p><button className="btn btn-primary mt-3" onClick={load}>נסי שוב</button></div>}
        {!sets && !error && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        {sets && sets.length === 0 && (
          <EmptyState emoji="📂" title="עוד אין לך סטים" actions={<Link href="/search" className="btn btn-primary">לחיפוש מילים</Link>}>
            חפשי מילים, לחצי ״הוסיפי לסט״ ושמרי אותן כסט לילד/ה.
          </EmptyState>
        )}
        {sets && sets.length > 0 && shown.length === 0 && <p className="py-10 text-center text-ink-soft">לא נמצא סט בשם הזה.</p>}
        {shown.map((s) => (
          <article key={s.id} className="card flex flex-wrap items-center gap-4 p-4 transition hover:shadow-pop sm:flex-nowrap">
            <Link href={`/sets/${s.id}`} className="flex min-w-0 flex-1 items-center gap-4" aria-label={`פתיחת הסט ${s.name}`}>
              <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow ${SET_COLORS[s.color] ?? SET_COLORS.purple}`}><FolderOpen className="size-6" /></span>
              <span className="min-w-0">
                <b className="block truncate text-lg">{s.name}</b>
                <span className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-bold text-ink">{s.word_count} מילים</span>עודכן: {relativeDay(s.updated_at)}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <Tip text="עריכה"><Link href={`/sets/${s.id}`} className="btn-icon border-surface-line" aria-label={`עריכת ${s.name}`}><Pencil className="size-[18px]" /></Link></Tip>
              <Tip text="הורידי להדפסה"><Link href={`/sets/${s.id}/print`} className="btn-icon border-surface-line" aria-label={`הורדת ${s.name} להדפסה`}><Download className="size-[18px]" /></Link></Tip>
              <Tip text="מחיקה"><button onClick={() => setDeleting(s)} className="btn-icon border-surface-line text-red-600 hover:bg-red-50 hover:text-red-700" aria-label={`מחיקת ${s.name}`}><Trash2 className="size-[18px]" /></button></Tip>
            </div>
          </article>
        ))}
      </div>

      <SetFormModal open={creating} title="סט חדש" submitLabel="יצירת סט" onClose={() => setCreating(false)}
        onSubmit={async (v) => { const id = await repo.createSet({ ...v, wordIds: [] }); toast.success("הסט נוצר ✅"); router.push(`/sets/${id}`); }} />
      <ConfirmModal open={!!deleting} danger busy={busy} title="מחיקת סט" confirmLabel="כן, מחקי"
        message={`בטוחה שתרצי למחוק את הסט ״${deleting?.name ?? ""}״? לא ניתן לבטל.`} onClose={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}

export default function SetsPage() {
  return <RequireAuth><SetsScreen /></RequireAuth>;
}
