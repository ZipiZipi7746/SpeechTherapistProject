"use client";
import clsx from "clsx";
import { ImagePlus, Info, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ABSTRACTNESS_LABEL, ALPHABET, DIFFICULTY_LABEL, IMAGE_KIND_LABEL, POSITION_LABEL, VOWEL_LABEL } from "@/lib/constants";
import { prepareImage } from "@/lib/download";
import { normLetter, phonemePositions, stripNikud, suggestCategorySlug } from "@/lib/hebrew";
import { toggleIn } from "@/lib/filters";
import type { Abstractness, Category, Difficulty, ImageKind, PendingUpload, Position, UploadInput, VowelGroup } from "@/lib/types";

const MAX_RAW_BYTES = 8 * 1024 * 1024;
const MAX_FINAL_BYTES = 2 * 1024 * 1024; // matches the storage bucket limit
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  categories: Category[];
  /** When re-submitting a rejected word. */
  initial?: PendingUpload;
  onSubmit: (input: UploadInput, image: Blob | null) => Promise<void>;
  onCancel?: () => void;
}

export function UploadForm({ categories, initial, onSubmit, onCancel }: Props) {
  const [text, setText] = useState(initial?.text ?? "");
  const [syllables, setSyllables] = useState<number | null>(initial?.syllable_count ?? null);
  const [phoneme, setPhoneme] = useState(initial?.primary_phoneme ?? "");
  const [position, setPosition] = useState<Position>("start");
  const [ageMin, setAgeMin] = useState(initial?.age_min ?? 4);
  const [ageMax, setAgeMax] = useState(initial?.age_max ?? 6);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "easy");
  const [abstractness, setAbstractness] = useState<Abstractness>(initial?.abstractness ?? "concrete");
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [categoryTouched, setCategoryTouched] = useState(!!initial);
  const [vowels, setVowels] = useState<VowelGroup[]>(initial?.vowels ?? []);
  const [imageKind, setImageKind] = useState<ImageKind>(initial?.image_kind ?? "illustration");
  const [culturalWarning, setCulturalWarning] = useState(initial?.cultural_warning ?? false);
  const [image, setImage] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.image_url ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const plain = useMemo(() => stripNikud(text), [text]);

  // helpful defaults: first letter -> primary phoneme and a suggested category
  useEffect(() => {
    if (!plain) return;
    if (!initial) setPhoneme((p) => (p ? p : normLetter(plain[0])));
    if (!categoryTouched) {
      const slug = suggestCategorySlug(plain, text.includes("׳"));
      const c = categories.find((x) => x.slug === slug);
      if (c) setCategoryId(c.id);
    }
  }, [plain, text, categories, categoryTouched, initial]);

  const category = categories.find((c) => c.id === categoryId);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    setErrors((e) => ({ ...e, image: "" }));
    if (!ACCEPT.includes(file.type)) return setErrors((e) => ({ ...e, image: "אפשר להעלות רק JPG, PNG או WebP." }));
    if (file.size > MAX_RAW_BYTES) return setErrors((e) => ({ ...e, image: "הקובץ גדול מדי (עד 8MB)." }));
    try {
      const blob = await prepareImage(file);
      if (blob.size > MAX_FINAL_BYTES) return setErrors((e) => ({ ...e, image: "התמונה כבדה מדי גם אחרי כיווץ. נסי תמונה פשוטה יותר." }));
      setImage(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setErrors((e) => ({ ...e, image: "לא הצלחנו לקרוא את התמונה. נסי קובץ אחר." }));
    }
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!plain) e.text = "איזו מילה מוסיפות?";
    else if (!/^[א-ת'׳\- ]+$/.test(plain)) e.text = "המילה צריכה להכיל אותיות בעברית בלבד.";
    else if (plain.length > 30) e.text = "המילה ארוכה מדי.";
    if (!syllables) e.syllables = "כמה הברות יש במילה?";
    if (phoneme) {
      const pos = phonemePositions(plain).get(normLetter(phoneme));
      if (!pos) e.phoneme = `האות ״${phoneme}״ לא מופיעה במילה.`;
      else if (!pos.has(position)) e.phoneme = `האות ״${phoneme}״ לא נמצאת ב${POSITION_LABEL[position]} המילה.`;
    }
    if (ageMin > ageMax) e.age = "גיל ההתחלה צריך להיות קטן מגיל הסיום.";
    if (!initial && !image) e.image = "הוסיפי תמונה — כך המילה תהיה שימושית לכולן.";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { document.getElementById(`field-${Object.keys(e)[0]}`)?.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    setBusy(true);
    try {
      await onSubmit({
        text: text.trim(), syllable_count: syllables!, primary_phoneme: phoneme ? normLetter(phoneme) : null,
        category_id: categoryId || null, vowels, age_min: ageMin, age_max: ageMax, difficulty, abstractness, image_kind: imageKind, cultural_warning: culturalWarning,
      }, image);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "משהו השתבש" });
      setBusy(false);
    }
  };

  const Err = ({ k }: { k: string }) => (errors[k] ? <p role="alert" className="mt-2 text-sm font-medium text-red-600">{errors[k]}</p> : null);

  return (
    <form onSubmit={submit} noValidate className="card space-y-8 p-6 sm:p-8">
      <div id="field-text">
        <label htmlFor="word-text" className="label">שם המילה</label>
        <input id="word-text" className={clsx("input text-xl font-bold", errors.text && "border-red-400")} value={text} onChange={(e) => setText(e.target.value)} placeholder="שׁוּלְחָן" maxLength={40} />
        <p className="mt-1.5 text-xs text-ink-faint">אפשר עם ניקוד — זה עוזר לקרוא נכון.</p>
        <Err k="text" />
      </div>

      <div id="field-syllables">
        <span className="label">מספר הברות</span>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((n) => <button key={n} type="button" aria-pressed={syllables === n} onClick={() => setSyllables(n)} className="chip">{n === 4 ? "+4" : n}</button>)}
        </div>
        <Err k="syllables" />
      </div>

      <div id="field-phoneme" className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="phoneme" className="label">פונמה עיקרית <span className="font-normal text-ink-faint">(אופציונלי)</span></label>
          <select id="phoneme" className="input" value={phoneme} onChange={(e) => setPhoneme(e.target.value)}>
            <option value="">—</option>
            {ALPHABET.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <span className="label">מיקום</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="מיקום הפונמה">
            {(Object.keys(POSITION_LABEL) as Position[]).map((p) => (
              <label key={p} className={clsx("chip cursor-pointer", !phoneme && "opacity-40")}>
                <input type="radio" name="pos" className="sr-only" disabled={!phoneme} checked={position === p} onChange={() => setPosition(p)} aria-label={POSITION_LABEL[p]} />
                <span aria-hidden className={clsx("size-3.5 rounded-full border-2", position === p ? "border-brand-600 bg-brand-600" : "border-ink-faint")} />{POSITION_LABEL[p]}
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2"><Err k="phoneme" /></div>
      </div>

      <div id="field-age">
        <span className="label">לאיזה גילאים המילה מתאימה?</span>
        <div className="flex items-center gap-3">
          <select aria-label="מגיל" className="input w-28" value={ageMin} onChange={(e) => setAgeMin(+e.target.value)}>{[2, 3, 4, 5, 6, 7].map((a) => <option key={a}>{a}</option>)}</select>
          <span className="text-ink-soft">עד</span>
          <select aria-label="עד גיל" className="input w-28" value={ageMax} onChange={(e) => setAgeMax(+e.target.value)}>{[2, 3, 4, 5, 6, 7].map((a) => <option key={a}>{a}</option>)}</select>
        </div>
        <Err k="age" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <fieldset>
          <legend className="label">רמת קושי</legend>
          <div className="flex flex-wrap gap-2">{(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => <button key={d} type="button" aria-pressed={difficulty === d} onClick={() => setDifficulty(d)} className="chip">{DIFFICULTY_LABEL[d]}</button>)}</div>
        </fieldset>
        <fieldset>
          <legend className="label">סוג מילה</legend>
          <div className="flex flex-wrap gap-2">{(Object.keys(ABSTRACTNESS_LABEL) as Abstractness[]).map((a) => <button key={a} type="button" aria-pressed={abstractness === a} onClick={() => setAbstractness(a)} className="chip">{ABSTRACTNESS_LABEL[a]}</button>)}</div>
        </fieldset>
      </div>

      <div>
        <label htmlFor="category" className="label">קבוצה פונולוגית</label>
        <select id="category" className="input" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setCategoryTouched(true); }}>
          <option value="">לא יודעת — המנהלת תשלים</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name_he}</option>)}
        </select>
        {category && <p className="mt-2 flex gap-2 rounded-xl bg-brand-50 p-3 text-sm leading-relaxed text-ink-soft"><Info className="mt-0.5 size-4 shrink-0 text-brand-600" />{category.description_he}</p>}
      </div>

      <fieldset>
        <legend className="label">סוג תנועה <span className="font-normal text-ink-faint">(אופציונלי)</span></legend>
        <div className="flex flex-wrap gap-2">{(Object.keys(VOWEL_LABEL) as VowelGroup[]).map((v) => <button key={v} type="button" aria-pressed={vowels.includes(v)} onClick={() => setVowels(toggleIn(vowels, v))} className="chip">{VOWEL_LABEL[v]}</button>)}</div>
      </fieldset>

      {/* eslint-disable @next/next/no-img-element */}
      <div id="field-image">
        <span className="label">תמונה</span>
        <div className="flex flex-wrap items-start gap-4">
          <button type="button" onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void pickImage(e.dataTransfer.files[0]); }}
            className={clsx("relative flex size-40 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed bg-surface-muted text-ink-soft transition hover:border-brand-400 hover:bg-brand-50", errors.image ? "border-red-400" : "border-surface-line")}
            aria-label="בחירת תמונה">
            {preview ? <img src={preview} alt="תצוגה מקדימה" className="size-full object-contain" />
              : <span className="flex flex-col items-center gap-2 text-sm"><ImagePlus className="size-8" />גררי או בחרי</span>}
          </button>
          <input ref={fileRef} type="file" accept={ACCEPT.join(",")} className="sr-only" tabIndex={-1} onChange={(e) => void pickImage(e.target.files?.[0])} />
          <div className="space-y-3">
            {preview && <button type="button" onClick={() => { setImage(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }} className="btn btn-ghost min-h-9 px-3 text-sm"><X className="size-4" /> הסרה</button>}
            <div role="radiogroup" aria-label="סוג התמונה" className="flex flex-wrap gap-2">
              {(Object.keys(IMAGE_KIND_LABEL) as ImageKind[]).map((k) => <button key={k} type="button" aria-pressed={imageKind === k} onClick={() => setImageKind(k)} className="chip min-h-9 text-sm">{IMAGE_KIND_LABEL[k]}</button>)}
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-ink-faint">JPG / PNG / WebP. התמונה מכווצת אוטומטית. נא להעלות תמונות צנועות ומוכרות — מתאימות לכל המגזרים.</p>
          </div>
        </div>
        <Err k="image" />
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-amber-500" checked={culturalWarning} onChange={(e) => setCulturalWarning(e.target.checked)} />
          <span><b>🟡 התמונה עשויה שלא להתאים לכל הקהלים</b><br /><span className="text-ink-soft">למשל לבוש, סמלים או תרבות שלא מתאימים לילדים במגזר מסוים. נסמן אותה באזהרה קטנה והמנהלת תבדוק.</span></span>
        </label>
      </div>

      {errors.form && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700">{errors.form}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-surface-line pt-6">
        <button className="btn btn-primary min-h-12 px-8" disabled={busy}>{busy ? "שולחת…" : initial ? "הגישי מחדש" : "שליחה לאישור"}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>בטלי</button>}
      </div>
    </form>
  );
}
