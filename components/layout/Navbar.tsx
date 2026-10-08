"use client";
import clsx from "clsx";
import { ChevronDown, LogOut, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSelection } from "@/components/providers/SelectionProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { repo } from "@/lib/data";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/search", label: "חיפוש" },
  { href: "/sets", label: "הסטים שלי" },
  { href: "/upload", label: "הוסיפי מילה" },
];

export function Navbar() {
  const { user, loading, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const sel = useSelection();
  const [menu, setMenu] = useState(false);
  const [pending, setPending] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    repo.pendingCount().then(setPending).catch(() => {});
  }, [isAdmin, pathname]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const signOut = async () => {
    await repo.signOut();
    sel.clear();
    setMenu(false);
    toast.show("להתראות! התנתקת בהצלחה 👋");
    router.push("/");
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-surface-line bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        {user && (
          <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                  className={clsx("rounded-xl px-4 py-2 text-[15px] font-semibold transition", active ? "bg-brand-100 text-brand-700" : "text-ink-soft hover:bg-brand-50 hover:text-ink")}>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-11 w-28 animate-pulse rounded-full bg-brand-100/60" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu}
                className="flex items-center gap-2 rounded-full bg-brand-50 py-1.5 pe-3 ps-1.5 text-[15px] font-semibold hover:bg-brand-100">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{user.display_name.slice(0, 1)}</span>
                <span className="hidden max-w-32 truncate sm:inline">שלום, {user.display_name}</span>
                <ChevronDown className="size-4 text-ink-soft" />
              </button>
              {menu && (
                <div role="menu" className="absolute end-0 top-[calc(100%+8px)] w-56 animate-fade-in rounded-2xl border border-surface-line bg-white p-1.5 shadow-pop">
                  <Link role="menuitem" href="/profile" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] hover:bg-brand-50"><User className="size-4" /> הפרופיל שלי</Link>
                  {isAdmin && (
                    <Link role="menuitem" href="/admin" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] hover:bg-brand-50">
                      <ShieldCheck className="size-4" /> ממשק ניהול
                      {pending > 0 && <span className="ms-auto rounded-full bg-amber-500 px-2 text-xs font-bold text-white">{pending}</span>}
                    </Link>
                  )}
                  <button role="menuitem" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-red-600 hover:bg-red-50"><LogOut className="size-4" /> התנתקות</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2 text-[15px] font-semibold hover:bg-brand-50">כניסה</Link>
              <Link href="/signup" className="btn btn-primary min-h-10 px-5">הצטרפי — חינם!</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
