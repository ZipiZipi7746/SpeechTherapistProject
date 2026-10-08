import Link from "next/link";

export function Footer() {
  return (
    <footer className="no-print border-t border-surface-line bg-white pb-24 md:pb-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-soft sm:px-6">
        <p>© {new Date().getFullYear()} SpeechSearch · מאגר מילים לקלינאיות תקשורת</p>
        <nav aria-label="מידע משפטי" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:text-ink hover:underline">מדיניות פרטיות</Link>
          <Link href="/terms" className="hover:text-ink hover:underline">תנאי שימוש</Link>
          <Link href="/accessibility" className="hover:text-ink hover:underline">הצהרת נגישות</Link>
        </nav>
      </div>
    </footer>
  );
}
