"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SET_COLORS, SET_COLOR_KEYS } from "@/lib/constants";
import clsx from "clsx";

interface Props {
  open: boolean;
  title: string;
  initial?: { name: string; childName: string | null; color: string };
  submitLabel: string;
  onSubmit: (v: { name: string; childName: string | null; color: string }) => Promise<void>;
  onClose: () => void;
}

export function SetFormModal({ open, title, initial, submitLabel, onSubmit, onClose }: Props) {
  const [name, setName] = useState("");
  const [child, setChild] = useState("");
  const [color, setColor] = useState("purple");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? ""); setChild(initial?.childName ?? ""); setColor(initial?.color ?? "purple"); setError(""); setBusy(false);
  }, [open, initial]);

  const submit = async () => {
    if (!name.trim()) { setError("איך נקרא לסט? למשל: ״שין תחילת מילה — דניאל״"); return; }
    setBusy(true);
    try { await onSubmit({ name, childName: child.trim() || null, color }); }
    catch (e) { setError(e instanceof Error ? e.message : "משהו השתבש"); setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? "שומרת…" : submitLabel}</button><button className="btn btn-ghost" onClick={onClose} disabled={busy}>בטלי</button></>}>
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
        <div><label htmlFor="sf-name" className="label">שם הסט</label><input id="sf-name" data-autofocus className="input" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="שין תחילת מילה — דניאל" /></div>
        <div><label htmlFor="sf-child" className="label">למי הסט? <span className="font-normal text-ink-faint">(אופציונלי)</span></label><input id="sf-child" className="input" value={child} maxLength={40} onChange={(e) => setChild(e.target.value)} placeholder="דניאל" /></div>
        <p className="-mt-2 text-xs text-ink-faint">מספיק שם פרטי או כינוי — בלי שם משפחה או פרטים מזהים.</p>
        <div>
          <span className="label">צבע</span>
          <div className="flex gap-2" role="radiogroup" aria-label="צבע הסט">
            {SET_COLOR_KEYS.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={color === k} aria-label={k} onClick={() => setColor(k)}
                className={clsx("size-9 rounded-xl bg-gradient-to-br transition", SET_COLORS[k], color === k ? "ring-2 ring-offset-2 ring-brand-600" : "opacity-70 hover:opacity-100")} />
            ))}
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
