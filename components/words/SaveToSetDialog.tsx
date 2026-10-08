"use client";
import clsx from "clsx";
import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelection } from "@/components/providers/SelectionProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { repo } from "@/lib/data";
import type { SetSummary, Word } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Words to save. Defaults to the global selection. */
  words?: Word[];
  /** Called after a successful save (e.g. to clear selection). */
  onSaved?: () => void;
}

export function SaveToSetDialog({ open, onClose, words, onSaved }: Props) {
  const sel = useSelection();
  const toast = useToast();
  const router = useRouter();
  const items = words ?? sel.words;
  const [sets, setSets] = useState<SetSummary[] | null>(null);
  const [target, setTarget] = useState<string>("new");
  const [name, setName] = useState("");
  const [child, setChild] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(""); setBusy(false);
    repo.listSets().then((s) => { setSets(s); setTarget(s.length ? s[0].id : "new"); }).catch(() => setSets([]));
  }, [open]);

  const save = async () => {
    setError("");
    if (!items.length) return;
    if (target === "new" && !name.trim()) { setError("איך נקרא לסט? למשל: ״שין תחילת מילה — דניאל״"); return; }
    setBusy(true);
    try {
      const ids = items.map((w) => w.id);
      let setId = target;
      if (target === "new") {
        setId = await repo.createSet({ name, childName: child || null, wordIds: ids });
        toast.success(`הסט ״${name.trim()}״ נשמר ✅ ${ids.length} מילים בפנים`);
      } else {
        const added = await repo.addWordsToSet(target, ids);
        toast.success(added === 1 ? "המילה נשמרה לסט ✅" : `${added} מילים נשמרו לסט ✅`);
      }
      if (!words) sel.clear();
      onSaved?.();
      onClose();
      router.push(`/sets/${setId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "משהו השתבש");
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose} title={`שמירה לסט — ${items.length} ${items.length === 1 ? "מילה" : "מילים"}`}
      footer={<>
        <button className="btn btn-primary" onClick={save} disabled={busy || !items.length}>{busy ? "שומרת…" : "שמרי לסט"}</button>
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>בטלי</button>
      </>}
    >
      <div className="space-y-3">
        {sets === null ? <p className="py-6 text-center text-sm text-ink-soft">טוענת את הסטים שלך…</p> : (
          <fieldset className="space-y-2">
            <legend className="label">לאיזה סט?</legend>
            {sets.map((s) => (
              <label key={s.id} className={clsx("flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5", target === s.id ? "border-brand-600 bg-brand-50" : "border-surface-line")}>
                <input type="radio" name="target" className="size-4 accent-brand-600" checked={target === s.id} onChange={() => setTarget(s.id)} />
                <span className="flex-1 font-semibold">{s.name}</span>
                <span className="text-xs text-ink-soft">{s.word_count} מילים</span>
              </label>
            ))}
            <label className={clsx("flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5", target === "new" ? "border-brand-600 bg-brand-50" : "border-surface-line")}>
              <input type="radio" name="target" className="size-4 accent-brand-600" checked={target === "new"} onChange={() => setTarget("new")} />
              <FolderPlus className="size-5 text-brand-600" /><span className="flex-1 font-semibold">סט חדש</span>
            </label>
          </fieldset>
        )}
        {target === "new" && (
          <div className="space-y-3 rounded-2xl bg-surface-muted p-4">
            <div>
              <label htmlFor="set-name" className="label">שם הסט</label>
              <input id="set-name" data-autofocus className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="שין תחילת מילה — דניאל" maxLength={120} />
            </div>
            <div>
              <label htmlFor="set-child" className="label">למי הסט? <span className="font-normal text-ink-faint">(אופציונלי)</span></label>
              <input id="set-child" className="input" value={child} onChange={(e) => setChild(e.target.value)} placeholder="דניאל" maxLength={40} />
            <p className="mt-1.5 text-xs text-ink-faint">מספיק שם פרטי או כינוי — בלי שם משפחה או פרטים מזהים.</p>
            </div>
          </div>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}
