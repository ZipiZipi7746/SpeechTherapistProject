import { Search } from "lucide-react";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3" aria-label="SpeechSearch — דף הבית">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-[0_6px_16px_rgba(124,77,207,.3)]"><Search className="size-5" strokeWidth={2.5} /></span>
      <span className="leading-tight">
        <span dir="ltr" className="block text-lg font-extrabold tracking-tight">SpeechSearch</span>
        <span className="block text-xs text-ink-soft">מאגר מילים לטיפול</span>
      </span>
    </Link>
  );
}
