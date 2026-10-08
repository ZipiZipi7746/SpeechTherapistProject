"use client";
import { FlaskConical } from "lucide-react";
import { isDemoMode } from "@/lib/data";

export function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <div className="no-print bg-amber-100 px-4 py-1.5 text-center text-xs font-semibold text-amber-900">
      <FlaskConical className="me-1.5 inline size-3.5" />
      מצב הדגמה — הנתונים נשמרים רק בדפדפן הזה. חברי Supabase (ראי README) כדי לעבוד על נתונים אמיתיים.
    </div>
  );
}
