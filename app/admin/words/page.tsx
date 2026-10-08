"use client";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useToast } from "@/components/providers/ToastProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ABSTRACTNESS_LABEL, DIFFICULTY_LABEL, VOWEL_LABEL, ageLabel } from "@/lib/constants";
import { repo } from "@/lib/data";
import { toggleIn } from "@/lib/filters";
import type { Abstractness, Category, Difficulty, VowelGroup, Word, WordInput } from "@/lib/types";

const PAGE = 30;
const blank: WordInput = { text: "", syllable_count: 2, vowels: [], category_id: null, age_min: 4, age_max: 6, difficulty: "easy", abstractness: "concrete", emoji: "", cultural_warning: false };

function MasterWords() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{ words: Word[]; total: number } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<WordInput | null>(null);
  const [deleting, setDeleting] = useState<Word | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => repo.adminListWords(q, page, PAGE).then(setData).catch(() => setData({ words: [], total: 0 }));
  useEffect(() => { repo.listCategories().then(setCategories).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!form) return;
    if (!form.text.trim()) { setError("חסר שם למילה."); return; }
    setBusy(true); setError("");
    try { await repo.adminSaveWord({ ...form, emoji: form.emoji?.trim() || null }); toast.success("המילה נשמרה ✅"); setForm(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "השמירה נכשלה"); }
    finally { setBusy(false); }
  };
  const del = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await repo.adminDeleteWord(deleting.id); toast.show("המילה נמחקה מהמאגר"); setDeleting(null); await load(); }
    catch { toast.error("המחיקה נכשלה"); }
    finally { setBusy(false); }
  };
  const set = (p: Partial<WordInput>) => setForm((f) => (f ? { ...f, ...p } : f));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="card flex flex-1 items-center gap-3 px-4"><Search className="size-5 text-ink-faint" /><input aria-label="חיפוש במאגר" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="חיפוש מילה במאגר…" className="min-h-12 flex-1 bg-transparent outline-none" /></div>
        <button className="btn btn-primary" onClick={() => { setForm(blank); setError(""); }}><Plus className="size-5" /> מילה חדשה</button>
      </div>

      {!data ? <Skeleton className="h-80" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-start text-[15px]">
            <thead className="border-b border-surface-line text-sm text-ink-soft"><tr>{["מילה", "הברות", "גיל", "קושי", "קבוצה", ""].map((h) => <th key={h} className="px-4 py-3 text-start font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {data.words.map((w) => (
                <tr key={w.id} className="border-b border-surface-line last:border-0 hover:bg-brand-50/40">
                  <td className="px-4 py-2.5 text-lg font-bold">{w.emoji} {w.text}</td>
                  <td className="px-4">{w.syllable_count}</td><td className="px-4">{ageLabel(w.age_min, w.age_max)}</td>
                  <td className="px-4">{DIFFICULTY_LABEL[w.difficulty]}</td><td className="px-4 text-sm text-ink-soft">{w.category?.name_he.split(" (")[0] ?? "—"}</td>
                  <td className="px-4"><div className="flex justify-end gap-1">
                    <button className="btn-icon" aria-label={`עריכת ${w.plain_text}`} onClick={() => { setForm({ id: w.id, text: w.text, syllable_count: w.syllable_count, vowels: w.vowels, category_id: w.category_id, age_min: w.age_min, age_max: w.age_max, difficulty: w.difficulty, abstractness: w.abstractness, emoji: w.emoji ?? "", cultural_warning: w.cultural_warning }); setError(""); }}><Pencil className="size-[18px]" /></button>
                    <button className="btn-icon text-red-600 hover:bg-red-50" aria-label={`מחיקת ${w.plain_text}`} onClick={() => setDeleting(w)}><Trash2 className="size-[18px]" /></button>
                  </div></td>
                </tr>
              ))}
              {data.words.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-soft">לא נמצאו מילים.</td></tr>}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-surface-line px-4 py-3 text-sm text-ink-soft">
            <span>{data.total} מילים</span>
            <div className="flex gap-2">
              <button className="btn btn-ghost min-h-9 px-4 text-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>הקודם</button>
              <button className="btn btn-ghost min-h-9 px-4 text-sm" disabled={(page + 1) * PAGE >= data.total} onClick={() => setPage((p) => p + 1)}>הבא</button>
            </div>
          </div>
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "עריכת מילה" : "מילה חדשה"} size="md"
        footer={<><button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? "שומרת…" : "שמירה"}</button><button className="btn btn-ghost" onClick={() => setForm(null)} disabled={busy}>בטלי</button></>}>
        {form && (
          <div className="space-y-4">
            <div><label htmlFor="aw-text" className="label">מילה (עם ניקוד)</label><input id="aw-text" data-autofocus className="input text-lg font-bold" value={form.text} onChange={(e) => set({ text: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="aw-syl" className="label">הברות</label><select id="aw-syl" className="input" value={form.syllable_count} onChange={(e) => set({ syllable_count: +e.target.value })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div>
              <div><label htmlFor="aw-emoji" className="label">אימוג׳י (גיבוי לתמונה)</label><input id="aw-emoji" className="input" value={form.emoji ?? ""} onChange={(e) => set({ emoji: e.target.value })} /></div>
              <div><label htmlFor="aw-min" className="label">מגיל</label><select id="aw-min" className="input" value={form.age_min} onChange={(e) => set({ age_min: +e.target.value })}>{[2, 3, 4, 5, 6, 7].map((n) => <option key={n}>{n}</option>)}</select></div>
              <div><label htmlFor="aw-max" className="label">עד גיל</label><select id="aw-max" className="input" value={form.age_max} onChange={(e) => set({ age_max: +e.target.value })}>{[2, 3, 4, 5, 6, 7].map((n) => <option key={n}>{n}</option>)}</select></div>
              <div><label htmlFor="aw-diff" className="label">קושי</label><select id="aw-diff" className="input" value={form.difficulty} onChange={(e) => set({ difficulty: e.target.value as Difficulty })}>{(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>)}</select></div>
              <div><label htmlFor="aw-abs" className="label">סוג</label><select id="aw-abs" className="input" value={form.abstractness} onChange={(e) => set({ abstractness: e.target.value as Abstractness })}>{(Object.keys(ABSTRACTNESS_LABEL) as Abstractness[]).map((a) => <option key={a} value={a}>{ABSTRACTNESS_LABEL[a]}</option>)}</select></div>
            </div>
            <div><label htmlFor="aw-cat" className="label">קבוצה פונולוגית</label><select id="aw-cat" className="input" value={form.category_id ?? ""} onChange={(e) => set({ category_id: e.target.value || null })}><option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name_he}</option>)}</select></div>
            <fieldset><legend className="label">תנועות</legend><div className="flex flex-wrap gap-2">{(Object.keys(VOWEL_LABEL) as VowelGroup[]).map((v) => <button key={v} type="button" aria-pressed={form.vowels.includes(v)} className="chip min-h-9 text-sm" onClick={() => set({ vowels: toggleIn(form.vowels, v) })}>{VOWEL_LABEL[v].split(" (")[0]}</button>)}</div></fieldset>
            <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" className="size-5 accent-amber-500" checked={form.cultural_warning} onChange={(e) => set({ cultural_warning: e.target.checked })} /> סימון אזהרת התאמה תרבותית 🟡</label>
            {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleting} danger busy={busy} title="מחיקת מילה מהמאגר" confirmLabel="כן, מחקי" message={`למחוק את ״${deleting?.plain_text ?? ""}״ מהמאגר הראשי? המילה תוסר גם מכל הסטים. לא ניתן לבטל.`} onClose={() => setDeleting(null)} onConfirm={del} />
    </>
  );
}

export default function AdminWordsPage() {
  return <AdminShell><MasterWords /></AdminShell>;
}
