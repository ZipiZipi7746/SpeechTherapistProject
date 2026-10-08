"use client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useToast } from "@/components/providers/ToastProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { repo } from "@/lib/data";
import type { Category, CategoryInput } from "@/lib/types";

function Categories() {
  const toast = useToast();
  const [items, setItems] = useState<Category[] | null>(null);
  const [form, setForm] = useState<CategoryInput | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => repo.listCategories().then(setItems).catch(() => setItems([]));
  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!form) return;
    if (!form.name_he.trim()) { setError("חסר שם לקבוצה."); return; }
    setBusy(true); setError("");
    try { await repo.adminSaveCategory(form); toast.success("הקבוצה נשמרה ✅"); setForm(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "השמירה נכשלה"); }
    finally { setBusy(false); }
  };
  const del = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await repo.adminDeleteCategory(deleting.id); toast.show("הקבוצה נמחקה"); setDeleting(null); await load(); }
    catch { toast.error("המחיקה נכשלה"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-soft">קבוצות פונולוגיות מופיעות בפילטרים, בטופס ההעלאה ובעמוד המילה. ההסבר הקצר עוזר לסטודנטיות ולקלינאיות חדשות — כתבי אותו בשפה פשוטה.</p>
        <button className="btn btn-primary" onClick={() => { setForm({ name_he: "", description_he: "" }); setError(""); }}><Plus className="size-5" /> קבוצה חדשה</button>
      </div>
      {!items ? <Skeleton className="h-60" /> : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="card flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1"><b className="block text-lg">{c.name_he}</b><p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.description_he || "אין הסבר עדיין"}</p></div>
              <div className="flex shrink-0 gap-1">
                <button className="btn-icon" aria-label={`עריכת ${c.name_he}`} onClick={() => { setForm({ id: c.id, name_he: c.name_he, description_he: c.description_he }); setError(""); }}><Pencil className="size-[18px]" /></button>
                <button className="btn-icon text-red-600 hover:bg-red-50" aria-label={`מחיקת ${c.name_he}`} onClick={() => setDeleting(c)}><Trash2 className="size-[18px]" /></button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="card p-10 text-center text-ink-soft">אין קבוצות. הוסיפי את הראשונה.</li>}
        </ul>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "עריכת קבוצה" : "קבוצה חדשה"} size="sm"
        footer={<><button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? "שומרת…" : "שמירה"}</button><button className="btn btn-ghost" onClick={() => setForm(null)} disabled={busy}>בטלי</button></>}>
        {form && (
          <div className="space-y-4">
            <div><label htmlFor="cat-name" className="label">שם הקבוצה</label><input id="cat-name" data-autofocus className="input" value={form.name_he} maxLength={60} onChange={(e) => setForm({ ...form, name_he: e.target.value })} placeholder="חוככים (פריקטיבים)" /></div>
            <div><label htmlFor="cat-desc" className="label">הסבר קצר</label><textarea id="cat-desc" rows={4} className="input py-3" value={form.description_he} maxLength={300} onChange={(e) => setForm({ ...form, description_he: e.target.value })} placeholder="צלילים שנוצרים מחיכוך של אוויר…" /></div>
            {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!deleting} danger busy={busy} title="מחיקת קבוצה" confirmLabel="כן, מחקי"
        message={`למחוק את ״${deleting?.name_he ?? ""}״? המילים שבקבוצה יישארו במאגר בלי קבוצה. לא ניתן לבטל.`} onClose={() => setDeleting(null)} onConfirm={del} />
    </>
  );
}

export default function AdminCategoriesPage() {
  return <AdminShell><Categories /></AdminShell>;
}
