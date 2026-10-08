"use client";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ABSTRACTNESS_LABEL, ageLabel, DIFFICULTY_LABEL, IMAGE_KIND_LABEL } from "@/lib/constants";
import { repo } from "@/lib/data";
import { relativeDay } from "@/lib/format";
import type { PendingUpload } from "@/lib/types";

function Queue() {
  const toast = useToast();
  const [items, setItems] = useState<PendingUpload[] | null>(null);
  const [rejecting, setRejecting] = useState<PendingUpload | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => repo.listPendingUploads().then(setItems).catch(() => setItems([]));
  useEffect(() => { void load(); }, []);

  const approve = async (u: PendingUpload) => {
    setBusyId(u.id);
    try { await repo.approveUpload(u.id); toast.success(`״${u.text}״ אושרה ונכנסה למאגר ✅`); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "האישור נכשל"); }
    finally { setBusyId(null); }
  };
  const reject = async () => {
    if (!rejecting) return;
    if (!reason.trim()) { setError("כתבי הסבר קצר — הקלינאית תראה אותו ותוכל לתקן."); return; }
    setBusyId(rejecting.id);
    try { await repo.rejectUpload(rejecting.id, reason); toast.show("הבקשה נדחתה והסבר נשלח"); setRejecting(null); setReason(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "הדחייה נכשלה"); }
    finally { setBusyId(null); }
  };

  if (!items) return <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;
  if (!items.length) return <EmptyState emoji="🎉" title="אין תוכן שממתין לאישור">כל ההגשות טופלו. כל הכבוד!</EmptyState>;

  return (
    <>
      <ul className="space-y-4">
        {items.map((u) => (
          <li key={u.id} className="card flex flex-wrap gap-5 p-5 sm:flex-nowrap">
            <div className="flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-gradient-soft text-5xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {u.image_url ? <img src={u.image_url} alt={u.text} className="size-full object-contain" /> : "🖼️"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-3"><h2 className="text-2xl font-black">{u.text}</h2><span className="text-sm text-ink-soft">מאת {u.submitter_name ?? "—"} · {relativeDay(u.created_at)}</span></div>
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                <div><dt className="inline text-ink-soft">הברות: </dt><dd className="inline font-bold">{u.syllable_count}</dd></div>
                <div><dt className="inline text-ink-soft">גיל: </dt><dd className="inline font-bold">{ageLabel(u.age_min, u.age_max)}</dd></div>
                <div><dt className="inline text-ink-soft">קושי: </dt><dd className="inline font-bold">{DIFFICULTY_LABEL[u.difficulty]}</dd></div>
                <div><dt className="inline text-ink-soft">סוג: </dt><dd className="inline font-bold">{ABSTRACTNESS_LABEL[u.abstractness]}</dd></div>
                <div><dt className="inline text-ink-soft">קבוצה: </dt><dd className="inline font-bold">{u.category?.name_he ?? "לא צוינה"}</dd></div>
                <div><dt className="inline text-ink-soft">תמונה: </dt><dd className="inline font-bold">{IMAGE_KIND_LABEL[u.image_kind]}</dd></div>
              </dl>
              {u.cultural_warning && <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-900"><TriangleAlert className="size-4" /> הקלינאית סימנה: התמונה עשויה שלא להתאים לכל הקהלים</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {/* critical actions: text is mandatory next to the icon (spec ch.8) */}
                <button className="btn btn-primary min-h-10 bg-none bg-emerald-600 px-5 text-sm shadow-none hover:bg-emerald-700" disabled={busyId === u.id} onClick={() => approve(u)}><CircleCheck className="size-4" /> אישור</button>
                <button className="btn btn-danger-ghost min-h-10 px-5 text-sm" disabled={busyId === u.id} onClick={() => { setRejecting(u); setReason(""); setError(""); }}><CircleX className="size-4" /> דחייה + הסבר</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={`דחיית ״${rejecting?.text ?? ""}״`} size="sm"
        footer={<><button className="btn btn-danger" onClick={reject} disabled={busyId === rejecting?.id}>דחייה ושליחת הסבר</button><button className="btn btn-ghost" onClick={() => setRejecting(null)}>בטלי</button></>}>
        <label htmlFor="reason" className="label">מה כדאי לתקן?</label>
        <textarea id="reason" data-autofocus rows={4} className="input py-3" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="למשל: התמונה לא ברורה מספיק, או שהמילה כבר קיימת במאגר." />
        {error && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      </Modal>
    </>
  );
}

export default function AdminPage() {
  return <AdminShell><Queue /></AdminShell>;
}
