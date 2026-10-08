"use client";
import { Layers, Search, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { repo } from "@/lib/data";
import type { Word } from "@/lib/types";
import { WordVisual } from "@/components/words/WordVisual";

const FEATURES = [
  { Icon: Wand2, title: "חיפוש פונולוגי חכם", text: "פונמה, מיקום בתוך המילה, גיל, מספר הברות ורמת קושי — בכמה לחיצות במקום 45 דקות בגוגל." },
  { Icon: ShieldCheck, title: "תמונות מותאמות תרבותית", text: "מאגר שנבנה ומאושר על ידי אנשי מקצוע, עם סימון ברור לתמונות שעשויות לא להתאים לכל הקהלים." },
  { Icon: Layers, title: "סטים מוכנים להדפסה", text: "בוחרות מילים, שומרות סט לכל ילד/ה, ומורידות להדפסה בלחיצה." },
];

export function GuestHome() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [samples, setSamples] = useState<Word[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    repo.guestSearch("").then((r) => { setSamples(r.words); setTotal(r.libraryTotal); }).catch(() => {});
  }, []);

  const submit = (e: FormEvent) => { e.preventDefault(); router.push(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); };

  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pb-6 pt-14 text-center sm:pt-20">
        <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-surface-line bg-white px-4 py-1.5 text-sm text-ink-soft shadow-card">
          <Sparkles className="size-4 text-brand-600" />
          {total ? `${total.toLocaleString("he-IL")}+ מילים` : "מאגר מילים"} • קהילת קלינאיות בישראל
        </p>
        <h1 className="text-balance text-4xl font-black leading-[1.15] tracking-tight sm:text-6xl">
          מצאי את <span className="bg-brand-gradient bg-clip-text text-transparent">המילה המושלמת</span> לטיפול
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">חיפוש פונולוגי חכם, תמונות מותאמות וסטים שניתן להוריד — הכול במקום אחד.</p>

        <form onSubmit={submit} role="search" className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-3xl border border-surface-line bg-white p-2 ps-3 shadow-pop">
          <Search className="ms-2 size-5 shrink-0 text-ink-faint" />
          <input aria-label="חיפוש מילה" value={q} onChange={(e) => setQ(e.target.value)} placeholder="הקלידי מילה, צליל או קטגוריה…" className="min-h-12 flex-1 bg-transparent px-2 text-lg outline-none placeholder:text-ink-faint" />
          <button className="btn btn-primary min-h-12 px-7">חיפוש</button>
        </form>
      </section>

      {samples.length > 0 && (
        <section aria-labelledby="samples" className="mx-auto max-w-4xl px-4 pb-6">
          <h2 id="samples" className="mb-4 text-center text-sm font-semibold text-ink-soft">תוצאות לדוגמה</h2>
          <ul className="flex flex-wrap justify-center gap-3">
            {samples.map((w) => (
              <li key={w.id}>
                <Link href={`/search?q=${encodeURIComponent(w.plain_text)}`} className="card flex w-36 flex-col items-center gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-pop">
                  <WordVisual word={w} className="h-14" emojiClass="text-5xl" />
                  <span className="text-lg font-extrabold">{w.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto mt-14 grid max-w-6xl gap-5 px-4 sm:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }) => (
          <div key={title} className="card p-6">
            <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-gradient-soft text-brand-700"><Icon className="size-6" /></span>
            <h3 className="text-lg font-extrabold">{title}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-14 max-w-3xl px-4">
        <div className="rounded-[2rem] bg-brand-gradient p-8 text-center text-white shadow-pop sm:p-12">
          <h2 className="text-3xl font-black">מוכנה לחסוך שעות הכנה?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">אורחות רואות 5 תוצאות לכל חיפוש. ההרשמה חינם ופותחת את המאגר המלא, כל הפילטרים והסטים האישיים.</p>
          <Link href="/signup" className="btn mt-7 bg-white px-8 text-brand-700 shadow-lg hover:bg-brand-50">הצטרפי — חינם!</Link>
        </div>
      </section>
    </>
  );
}
