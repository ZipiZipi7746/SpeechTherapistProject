"use client";
import clsx from "clsx";
import { ArrowRight, Copy, Download, FolderPlus, Info, Target, TriangleAlert } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tip } from "@/components/ui/Tip";
import { SaveToSetDialog } from "@/components/words/SaveToSetDialog";
import { WordVisual } from "@/components/words/WordVisual";
import { ABSTRACTNESS_LABEL, ageLabel, DIFFICULTY_LABEL, IMAGE_KIND_LABEL, POSITION_LABEL, VOWEL_LABEL } from "@/lib/constants";
import { repo } from "@/lib/data";
import { downloadWordImage } from "@/lib/download";
import { phonemePositions } from "@/lib/hebrew";
import type { ImageKind, Word } from "@/lib/types";

const DIFF_COLOR = { easy: "text-emerald-600", medium: "text-amber-600", hard: "text-rose-600" } as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-surface-line py-3 last:border-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-end font-bold">{children}</dd>
    </div>
  );
}

function WordDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [word, setWord] = useState<Word | null | undefined>(undefined);
  const [kind, setKind] = useState<ImageKind | undefined>();
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    repo.getWord(id).then((w) => { setWord(w); setKind(w?.images[0]?.kind); }).catch(() => setWord(null));
  }, [id]);

  const positions = useMemo(() => {
    if (!word?.primary_phoneme) return [];
    return [...(phonemePositions(word.plain_text).get(word.primary_phoneme) ?? [])];
  }, [word]);

  if (word === undefined) return <div className="mx-auto max-w-4xl space-y-4 px-4 py-8"><Skeleton className="h-10 w-40" /><Skeleton className="h-96" /></div>;
  if (word === null)
    return <EmptyState emoji="🤔" title="לא מצאנו את המילה הזו" actions={<button className="btn btn-primary" onClick={() => router.push("/search")}>חזרה לחיפוש</button>}>ייתכן שהיא הוסרה מהמאגר.</EmptyState>;

  const activeImage = word.images.find((i) => i.kind === kind) ?? word.images[0];
  const warn = word.cultural_warning || activeImage?.cultural_warning;
  const letters = [...word.plain_text];

  const copy = async () => { try { await navigator.clipboard.writeText(word.text); toast.show("המילה הועתקה ללוח"); } catch { toast.error("לא הצלחנו להעתיק"); } };
  const download = async () => { try { await downloadWordImage(word, kind); toast.success("התמונה ירדה ✅"); } catch { toast.error("ההורדה נכשלה. נסי שוב."); } };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <button onClick={() => (history.length > 1 ? router.back() : router.push("/search"))} className="mb-4 inline-flex items-center gap-2 rounded-xl py-2 pe-3 font-semibold text-ink-soft hover:text-ink">
        <ArrowRight className="size-5" /> חזרה לתוצאות
      </button>

      <article className="card overflow-hidden">
        <header className="relative bg-brand-gradient px-6 py-10 text-center text-white">
          <div className="mx-auto mb-4 flex size-36 items-center justify-center rounded-3xl bg-white/15 p-3 backdrop-blur">
            <WordVisual word={word} kind={kind} className="size-full" emojiClass="text-8xl" />
          </div>
          <h1 className="text-5xl font-black sm:text-6xl">{word.text}</h1>
          <p className="mt-1 text-white/75">{word.plain_text}</p>
          {warn && (
            <span className="absolute start-4 top-4">
              <Tip text="תמונה זו עשויה שלא להתאים לכל הקהלים">
                <span tabIndex={0} className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800"><TriangleAlert className="size-3.5" /> התאמה תרבותית</span>
              </Tip>
            </span>
          )}
        </header>

        {/* image kinds */}
        {word.images.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-surface-line px-6 py-4" role="group" aria-label="סוג תמונה">
            {word.images.map((i) => <button key={i.id} aria-pressed={kind === i.kind} onClick={() => setKind(i.kind)} className="chip">{IMAGE_KIND_LABEL[i.kind]}</button>)}
          </div>
        )}

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* information block — visually grouped, separate from the buttons (Gestalt) */}
          <section aria-labelledby="phon" className="rounded-3xl bg-surface-muted p-5">
            <h2 id="phon" className="mb-1 flex items-center gap-2 text-base font-extrabold"><Info className="size-5 text-brand-600" /> פרטים פונולוגיים</h2>
            <dl>
              <Row label="הברות">{word.syllable_count}</Row>
              <Row label="אותיות">{word.letter_count}</Row>
              <Row label="צלילים"><span dir="rtl" className="tracking-wide">{letters.join(" · ")}</span></Row>
              {word.primary_phoneme && <Row label="פונמה ראשונה">/{word.primary_phoneme}/</Row>}
              {positions.length > 0 && <Row label="מיקום">{positions.map((p) => POSITION_LABEL[p]).join(", ")}</Row>}
              {word.vowels.length > 0 && <Row label="תנועות">{word.vowels.map((v) => VOWEL_LABEL[v].split(" (")[0]).join(", ")}</Row>}
              {word.category && <Row label="קבוצה">{word.category.name_he}</Row>}
            </dl>
            {word.category?.description_he && <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-relaxed text-ink-soft">💡 {word.category.description_he}</p>}
          </section>

          <section aria-labelledby="fit" className="space-y-3">
            <h2 id="fit" className="flex items-center gap-2 text-base font-extrabold"><Target className="size-5 text-brand-600" /> התאמה לטיפול</h2>
            <div className="rounded-3xl bg-brand-50 p-4"><p className="text-xs text-ink-soft">גיל יעד</p><p className="text-xl font-extrabold">{ageLabel(word.age_min, word.age_max)} שנים</p></div>
            <div className="rounded-3xl bg-brand-50 p-4"><p className="text-xs text-ink-soft">רמת קושי</p><p className={clsx("text-xl font-extrabold", DIFF_COLOR[word.difficulty])}>{DIFFICULTY_LABEL[word.difficulty]}</p></div>
            <div className="rounded-3xl bg-brand-50 p-4"><p className="text-xs text-ink-soft">סוג מילה</p><p className="text-xl font-extrabold">{ABSTRACTNESS_LABEL[word.abstractness]}</p></div>
          </section>
        </div>

        {/* actions: one primary, secondary as quiet icons */}
        <footer className="flex flex-wrap items-center gap-2 border-t border-surface-line p-6">
          <button className="btn btn-primary min-h-12 px-7" onClick={() => setSaveOpen(true)}><FolderPlus className="size-5" /> הוסיפי לסט</button>
          <button className="btn-icon" onClick={download} aria-label="הורדת התמונה"><Download className="size-5" /></button>
          <button className="btn-icon" onClick={copy} aria-label="העתקת המילה"><Copy className="size-5" /></button>
        </footer>
      </article>

      <SaveToSetDialog open={saveOpen} onClose={() => setSaveOpen(false)} words={[word]} />
    </div>
  );
}

export default function WordPage() {
  return <RequireAuth><WordDetail /></RequireAuth>;
}
