"use client";
import clsx from "clsx";
import { ArrowRight, Mail, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/ui/Stepper";
import { WordVisual } from "@/components/words/WordVisual";
import { repo } from "@/lib/data";
import type { SetDetail } from "@/lib/types";

type Size = "large" | "medium" | "small";
const SIZE_CLASS: Record<Size, { grid: string; text: string; emoji: string }> = {
  large: { grid: "grid-cols-2", text: "text-5xl", emoji: "text-8xl" },
  medium: { grid: "grid-cols-3", text: "text-3xl", emoji: "text-6xl" },
  small: { grid: "grid-cols-4", text: "text-xl", emoji: "text-4xl" },
};

function PrintScreen() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [set, setSet] = useState<SetDetail | null | undefined>(undefined);
  const [images, setImages] = useState(true);
  const [bw, setBw] = useState(false);
  const [caption, setCaption] = useState(true);
  const [size, setSize] = useState<Size>("medium");

  useEffect(() => { repo.getSet(id).then(setSet).catch(() => setSet(null)); }, [id]);

  if (set === undefined) return <div className="mx-auto max-w-5xl px-4 py-8"><Skeleton className="h-96" /></div>;
  if (set === null) return <EmptyState emoji="🤔" title="לא מצאנו את הסט הזה" actions={<Link href="/sets" className="btn btn-primary">לכל הסטים</Link>} />;

  const sz = SIZE_CLASS[size];
  const print = () => {
    const prev = document.title;
    document.title = set.name; // becomes the PDF file name
    toast.success(`🎉 הסט מוכן! ${set.words.length} כרטיסים ממתינים ${set.child_name ? `ל${set.child_name}` : "לך"}.`);
    setTimeout(() => { window.print(); document.title = prev; }, 250);
  };
  const mailLink = `mailto:?subject=${encodeURIComponent(`הסט ״${set.name}״ — SpeechSearch`)}&body=${encodeURIComponent(`לצפייה והדפסה מהמחשב:\n${typeof location !== "undefined" ? location.href : ""}`)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="no-print mb-6"><Stepper current={4} /></div>
      <Link href={`/sets/${set.id}`} className="no-print mb-4 inline-flex items-center gap-2 py-2 font-semibold text-ink-soft hover:text-ink"><ArrowRight className="size-5" /> חזרה לסט</Link>

      {/* mobile: printing is a desktop task (spec ch.11) */}
      <div className="no-print card p-8 text-center md:hidden">
        <div className="mb-3 text-4xl">🖨️</div>
        <h1 className="text-xl font-extrabold">ההדפסה נוחה יותר מהמחשב</h1>
        <p className="mt-2 text-ink-soft">שלחי לעצמך את הקישור באימייל וצפי בסט במחשב.</p>
        <a href={mailLink} className="btn btn-primary mt-5"><Mail className="size-5" /> שלחי לאימייל לצפייה במחשב</a>
      </div>

      <div className="hidden gap-6 md:grid md:grid-cols-[280px_1fr] print:block">
        <aside className="no-print">
          <div className="card sticky top-24 space-y-5 p-5">
            <h1 className="text-lg font-extrabold">הגדרות הדפסה</h1>
            <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" className="size-5 accent-brand-600" checked={images} onChange={(e) => setImages(e.target.checked)} /> כלול תמונות</label>
            <fieldset disabled={!images} className={clsx("space-y-2", !images && "opacity-40")}>
              <legend className="mb-1 text-sm font-bold">תמונות</legend>
              <label className="flex cursor-pointer items-center gap-3"><input type="radio" name="color" className="size-4 accent-brand-600" checked={!bw} onChange={() => setBw(false)} /> צבע</label>
              <label className="flex cursor-pointer items-center gap-3"><input type="radio" name="color" className="size-4 accent-brand-600" checked={bw} onChange={() => setBw(true)} /> שחור-לבן</label>
            </fieldset>
            <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" className="size-5 accent-brand-600" checked={caption} onChange={(e) => setCaption(e.target.checked)} /> כתב מתחת לתמונה</label>
            <fieldset>
              <legend className="mb-2 text-sm font-bold">גודל גופן</legend>
              <div className="flex gap-2">
                {([["large", "גדול"], ["medium", "בינוני"], ["small", "קטן"]] as [Size, string][]).map(([k, l]) => <button key={k} aria-pressed={size === k} onClick={() => setSize(k)} className="chip flex-1 px-2">{l}</button>)}
              </div>
            </fieldset>
            <button className="btn btn-primary w-full" onClick={print} disabled={!set.words.length || (!images && !caption)}><Printer className="size-5" /> הורידי להדפסה</button>
            {!images && !caption && <p className="text-xs text-red-600">בחרי לפחות תמונות או כתב.</p>}
            <p className="text-xs leading-relaxed text-ink-faint">בחלון ההדפסה בחרי ״שמירה כ-PDF״ כדי להוריד קובץ, או מדפסת כדי להדפיס ישירות.</p>
          </div>
        </aside>

        {/* live preview of the printed sheet */}
        <section aria-label="תצוגה מקדימה" className="print-root card min-h-[60vh] p-8">
          <h2 className="mb-6 border-b-2 border-ink pb-3 text-2xl font-black">{set.name}{set.child_name ? ` — ${set.child_name}` : ""}</h2>
          <ul className={clsx("grid gap-4", sz.grid)}>
            {set.words.map((w) => (
              <li key={w.id} className="print-card flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-ink/20 p-3 text-center">
                {images && <WordVisual word={w} kind={bw ? "bw" : "color"} className="aspect-square w-full max-w-40" emojiClass={sz.emoji} />}
                {caption && <b className={clsx("font-black leading-tight", sz.text)}>{w.text}</b>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function PrintPage() {
  return <RequireAuth><PrintScreen /></RequireAuth>;
}
