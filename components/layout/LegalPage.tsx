import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/lib/site";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-1 text-sm text-ink-soft">עודכן לאחרונה: {updated}</p>
      {!CONTACT_EMAIL && (
        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <b>טיוטה:</b> מסמך זה נכתב כתבנית ויש להתאים אותו לשירות בפועל (ואם נדרש — לבדוק מול איש מקצוע) לפני פרסום. הגדירי את המשתנה
          <code dir="ltr" className="mx-1">NEXT_PUBLIC_CONTACT_EMAIL</code> כדי שהודעה זו תיעלם.
        </p>
      )}
      <div className="mt-6 space-y-6 text-[16px] leading-relaxed text-ink-soft [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:mt-1 [&_ul]:list-disc [&_ul]:ps-6">{children}</div>
    </article>
  );
}

export const Contact = () => (CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-brand-700 underline">{CONTACT_EMAIL}</a> : <b>[כתובת מייל ליצירת קשר]</b>);
