"use client";
import clsx from "clsx";
import { Clock, CircleX, CircleCheck, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Tip } from "@/components/ui/Tip";
import { DIFFICULTY_LABEL, ageLabel } from "@/lib/constants";
import type { PendingUpload } from "@/lib/types";

const STATUS = {
  pending: { tag: "ממתין", cls: "bg-amber-50 border-amber-200", tagCls: "bg-amber-200 text-amber-900", Icon: Clock, text: "המילה שלך ממתינה לאישור — נודיע לך!" },
  rejected: { tag: "נדחתה", cls: "bg-red-50 border-red-200", tagCls: "bg-red-200 text-red-900", Icon: CircleX, text: "" },
  approved: { tag: "אושרה", cls: "bg-emerald-50 border-emerald-200", tagCls: "bg-emerald-200 text-emerald-900", Icon: CircleCheck, text: "המילה נכנסה למאגר. תודה על התרומה! 💜" },
} as const;

export function MyUploads({ items, onEdit, onDelete }: { items: PendingUpload[]; onEdit: (u: PendingUpload) => void; onDelete: (u: PendingUpload) => Promise<void> }) {
  const [deleting, setDeleting] = useState<PendingUpload | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <ul className="space-y-3">
        {items.map((u) => {
          const s = STATUS[u.status];
          return (
            <li key={u.id} className={clsx("flex flex-wrap items-center gap-4 rounded-3xl border p-4", s.cls)}>
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {u.image_url ? <img src={u.image_url} alt="" className="size-full object-contain" /> : "🖼️"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-xl">{u.text}</b>
                  <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", s.tagCls)}><s.Icon className="size-3.5" />{s.tag}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">{u.syllable_count} הברות · {DIFFICULTY_LABEL[u.difficulty]} · גיל {ageLabel(u.age_min, u.age_max)}{u.cultural_warning ? " · 🟡 סומנה כרגישה תרבותית" : ""}</p>
                {u.status === "rejected"
                  ? <p className="mt-1.5 text-sm text-red-800"><b>סיבה:</b> {u.rejection_reason}</p>
                  : <p className="mt-1.5 text-sm text-ink-soft">{s.text}</p>}
              </div>
              <div className="flex items-center gap-1">
                {u.status === "rejected" && <button className="btn btn-primary min-h-10 px-4 text-sm" onClick={() => onEdit(u)}><Pencil className="size-4" /> תקני והגישי מחדש</button>}
                {u.status !== "approved" && <Tip text="מחיקה"><button className="btn-icon text-red-600 hover:bg-red-100" aria-label={`מחיקת ${u.text}`} onClick={() => setDeleting(u)}><Trash2 className="size-[18px]" /></button></Tip>}
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmModal open={!!deleting} danger busy={busy} title="מחיקת בקשה" confirmLabel="כן, מחקי" message={`בטוחה שתרצי למחוק את ״${deleting?.text ?? ""}״? לא ניתן לבטל.`}
        onClose={() => setDeleting(null)} onConfirm={async () => { if (!deleting) return; setBusy(true); try { await onDelete(deleting); } finally { setBusy(false); setDeleting(null); } }} />
    </>
  );
}
