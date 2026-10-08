"use client";
import { ArrowRight, Copy, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { SetFormModal } from "@/components/sets/SetFormModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/ui/Stepper";
import { WordVisual } from "@/components/words/WordVisual";
import { ageLabel, DIFFICULTY_LABEL } from "@/lib/constants";
import { repo } from "@/lib/data";
import { relativeDay } from "@/lib/format";
import type { SetDetail } from "@/lib/types";

function SetScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [set, setSet] = useState<SetDetail | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => repo.getSet(id).then(setSet).catch(() => setSet(null));
  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (set === undefined) return <div className="mx-auto max-w-5xl space-y-4 px-4 py-8"><Skeleton className="h-10" /><Skeleton className="h-40" /></div>;
  if (set === null) return <EmptyState emoji="🤔" title="לא מצאנו את הסט הזה" actions={<Link href="/sets" className="btn btn-primary">לכל הסטים</Link>}>ייתכן שהוא נמחק.</EmptyState>;

  const remove = async (wordId: string) => {
    try { await repo.removeWordFromSet(set.id, wordId); toast.show("המילה הוסרה מהסט"); await load(); }
    catch { toast.error("ההסרה נכשלה. נסי שוב."); }
  };
  const copySet = async () => {
    const text = `${set.name}\n${set.words.map((w, i) => `${i + 1}. ${w.text}`).join("\n")}`;
    try { await navigator.clipboard.writeText(text); toast.show("הסט הועתק ללוח"); } catch { toast.error("לא הצלחנו להעתיק"); }
  };
  const del = async () => {
    setBusy(true);
    try { await repo.deleteSet(set.id); toast.show("הסט נמחק"); router.replace("/sets"); }
    catch { toast.error("המחיקה נכשלה. נסי שוב."); setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6"><Stepper current={3} /></div>
      <Link href="/sets" className="mb-4 inline-flex items-center gap-2 py-2 font-semibold text-ink-soft hover:text-ink"><ArrowRight className="size-5" /> כל הסטים</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-3xl font-black">
            <span className="truncate">{set.name}</span>
            <button className="btn-icon shrink-0" onClick={() => setEditing(true)} aria-label="עריכת שם הסט"><Pencil className="size-5" /></button>
          </h1>
          <p className="mt-1 text-ink-soft">{set.words.length} מילים{set.child_name ? ` • ל${set.child_name}` : ""} • עודכן: {relativeDay(set.updated_at)}</p>
        </div>
        <div className="flex items-center gap-1">
          {set.words.length > 0 && <Link href={`/sets/${set.id}/print`} className="btn btn-primary"><Printer className="size-5" /> הכיני להדפסה</Link>}
          <button className="btn-icon" onClick={copySet} aria-label="העתקת הסט ללוח"><Copy className="size-5" /></button>
          <button className="btn-icon text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleting(true)} aria-label="מחיקת הסט"><Trash2 className="size-5" /></button>
        </div>
      </header>

      {set.words.length === 0 ? (
        <EmptyState emoji="🗂️" title="הסט עוד ריק" actions={<Link href="/search" className="btn btn-primary"><Plus className="size-5" /> חיפוש מילים להוספה</Link>}>
          חפשי מילים ולחצי ״הוסיפי לסט״.
        </EmptyState>
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {set.words.map((w) => (
              <li key={w.id} className="card group relative flex flex-col overflow-hidden">
                <Link href={`/words/${w.id}`} className="block bg-brand-gradient-soft"><WordVisual word={w} className="aspect-[4/3]" emojiClass="text-6xl" /></Link>
                <div className="p-3 text-center">
                  <b className="block text-xl">{w.text}</b>
                  <span className="text-xs text-ink-soft">{w.syllable_count} הברות · {DIFFICULTY_LABEL[w.difficulty]} · גיל {ageLabel(w.age_min, w.age_max)}</span>
                </div>
                <button onClick={() => remove(w.id)} aria-label={`הסרת ${w.plain_text} מהסט`} className="absolute end-2 top-2 flex size-9 items-center justify-center rounded-xl bg-white/90 text-red-600 shadow transition hover:bg-red-50"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center"><Link href="/search" className="inline-flex items-center gap-2 font-bold text-brand-700 hover:underline"><Plus className="size-5" /> הוסיפי עוד מילים</Link></p>
        </>
      )}

      <SetFormModal open={editing} title="עריכת הסט" submitLabel="שמרי" initial={{ name: set.name, childName: set.child_name, color: set.color }} onClose={() => setEditing(false)}
        onSubmit={async (v) => { await repo.updateSet(set.id, v); toast.success("הסט עודכן ✅"); setEditing(false); await load(); }} />
      <ConfirmModal open={deleting} danger busy={busy} title="מחיקת סט" confirmLabel="כן, מחקי" message={`בטוחה שתרצי למחוק את הסט ״${set.name}״? לא ניתן לבטל.`} onClose={() => setDeleting(false)} onConfirm={del} />
    </div>
  );
}

export default function SetPage() {
  return <RequireAuth><SetScreen /></RequireAuth>;
}
