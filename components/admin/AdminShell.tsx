"use client";
import clsx from "clsx";
import { ArrowRight, Database, Inbox, Shapes, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { repo } from "@/lib/data";

const TABS = [
  { href: "/admin", label: "ממתין לאישור", Icon: Inbox },
  { href: "/admin/words", label: "עריכת מאגר", Icon: Database },
  { href: "/admin/categories", label: "קבוצות פונולוגיות", Icon: Shapes },
  { href: "/admin/users", label: "משתמשים", Icon: Users },
];

/** Separate, hidden admin interface (spec ch.4): its own chrome, no entry point in the clinician navigation. */
export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [pending, setPending] = useState(0);
  useEffect(() => { repo.pendingCount().then(setPending).catch(() => {}); }, [path]);

  return (
    <RequireAuth admin>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-ink px-6 py-4 text-white">
          <h1 className="text-xl font-extrabold">ממשק ניהול</h1>
          <Link href="/" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">לאתר <ArrowRight className="size-4 rotate-180" /></Link>
        </div>
        <nav aria-label="ניהול" className="mb-6 flex gap-2 overflow-x-auto">
          {TABS.map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={clsx("chip shrink-0", active && "!border-ink !bg-ink !text-white")}>
                <Icon className="size-4" /> {label}
                {href === "/admin" && pending > 0 && <span className="ms-1 rounded-full bg-amber-400 px-2 text-xs font-extrabold text-ink">{pending}</span>}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </RequireAuth>
  );
}
