"use client";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { isMisconfigured } from "@/lib/data";

/** Blocks the whole app when a production build has no Supabase configuration (instead of failing in confusing ways). */
export function ConfigGuard({ children }: { children: ReactNode }) {
  if (!isMisconfigured) return <>{children}</>;
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <EmptyState emoji="🛠️" title="האתר עדיין לא מוגדר">
        חסרים משתני הסביבה של Supabase (<code dir="ltr">NEXT_PUBLIC_SUPABASE_URL</code> ו-<code dir="ltr">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>).
        ב-Vercel: Settings → Environment Variables, ואז Redeploy.
      </EmptyState>
    </div>
  );
}
