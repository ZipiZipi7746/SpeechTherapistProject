"use client";
import clsx from "clsx";
import { FolderOpen, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const ITEMS = [
  { href: "/search", label: "חיפוש", Icon: Search },
  { href: "/sets", label: "סטים", Icon: FolderOpen },
  { href: "/profile", label: "פרופיל", Icon: UserRound },
];

/** Mobile-only bottom navigation (spec ch.11). */
export function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user || pathname.startsWith("/admin")) return null;
  return (
    <nav aria-label="ניווט תחתון" className="no-print pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t border-surface-line bg-white/95 backdrop-blur md:hidden">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={clsx("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold", active ? "text-brand-700" : "text-ink-faint")}>
            <span className={clsx("flex h-7 w-14 items-center justify-center rounded-full transition", active && "bg-brand-100")}><Icon className="size-5" /></span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
