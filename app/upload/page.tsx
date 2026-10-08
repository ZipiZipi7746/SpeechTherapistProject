"use client";
import clsx from "clsx";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { MyUploads } from "@/components/upload/MyUploads";
import { UploadForm } from "@/components/upload/UploadForm";
import { repo } from "@/lib/data";
import type { Category, PendingUpload } from "@/lib/types";

function UploadScreen() {
  const toast = useToast();
  const [tab, setTab] = useState<"new" | "mine">("new");
  const [categories, setCategories] = useState<Category[]>([]);
  const [mine, setMine] = useState<PendingUpload[] | null>(null);
  const [editing, setEditing] = useState<PendingUpload | null>(null);
  const [formKey, setFormKey] = useState(0);

  const loadMine = () => repo.listMyUploads().then(setMine).catch(() => setMine([]));
  useEffect(() => { repo.listCategories().then(setCategories).catch(() => {}); void loadMine(); }, []);

  const waiting = mine?.filter((u) => u.status === "pending").length ?? 0;
  const rejected = mine?.filter((u) => u.status === "rejected").length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-black">הוסיפי מילה</h1>
      <p className="mt-1 text-ink-soft">לא מצאת מילה במאגר? הוסיפי אותה — וכל הקלינאיות ייהנו.</p>

      <div role="tablist" className="mt-6 flex gap-2">
        <button role="tab" aria-selected={tab === "new"} onClick={() => { setTab("new"); setEditing(null); }} className={clsx("chip", tab === "new" && "!border-brand-600 !bg-brand-600 !text-white")}>הוספת מילה</button>
        <button role="tab" aria-selected={tab === "mine"} onClick={() => setTab("mine")} className={clsx("chip", tab === "mine" && "!border-brand-600 !bg-brand-600 !text-white")}>
          ההעלאות שלי{mine && mine.length ? ` (${mine.length})` : ""}{rejected > 0 && <span className="size-2 rounded-full bg-red-500" aria-label="יש מילה שנדחתה" />}
        </button>
      </div>

      {tab === "new" && (
        <div className="mt-6 space-y-4">
          <p className="flex items-center gap-2 rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-900"><Info className="size-5 shrink-0" /> המילה תעבור אישור מנהלת לפני פרסום.</p>
          {editing && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900"><b>מתקנות את ״{editing.text}״.</b> סיבת הדחייה: {editing.rejection_reason}</p>}
          <UploadForm key={editing?.id ?? formKey} categories={categories} initial={editing ?? undefined}
            onCancel={editing ? () => setEditing(null) : undefined}
            onSubmit={async (input, image) => {
              if (editing) await repo.resubmitUpload(editing.id, input, image); else await repo.submitUpload(input, image);
              toast.success("המילה שלך ממתינה לאישור — נודיע לך! ✅");
              setEditing(null); setFormKey((k) => k + 1); await loadMine(); setTab("mine");
            }} />
        </div>
      )}

      {tab === "mine" && (
        <div className="mt-6">
          {!mine ? <Skeleton className="h-28" /> : mine.length === 0 ? (
            <div className="card p-10 text-center text-ink-soft">עוד לא העלית מילים. ההעלאות שלך יופיעו כאן עם הסטטוס שלהן.</div>
          ) : (
            <>
              {waiting > 0 && <p className="mb-3 text-sm text-ink-soft">{waiting} ממתינות לאישור</p>}
              <MyUploads items={mine}
                onEdit={(u) => { setEditing(u); setTab("new"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                onDelete={async (u) => { await repo.deleteUpload(u.id); toast.show("הבקשה נמחקה"); await loadMine(); }} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return <RequireAuth><UploadScreen /></RequireAuth>;
}
