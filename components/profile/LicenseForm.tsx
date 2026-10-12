"use client";
import clsx from "clsx";
import { BadgeCheck, Clock, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { PROFESSIONAL_LABEL, LICENSE_PATTERN } from "@/lib/constants";
import type { ProfessionalType, VerificationStatus } from "@/lib/types";

const TYPES = Object.keys(PROFESSIONAL_LABEL) as ProfessionalType[];

/** Radio cards + license field. Used in sign-up (uncontrolled submit) and in the profile (with its own save button). */
export function ProfessionalFields({ type, license, onType, onLicense, error }: {
  type: ProfessionalType; license: string; onType: (t: ProfessionalType) => void; onLicense: (v: string) => void; error?: string;
}) {
  return (
    <fieldset>
      <legend className="label">מי את?</legend>
      <div className="grid gap-2" role="radiogroup" aria-label="סוג מקצועי">
        {TYPES.map((t) => (
          <label key={t} className={clsx("flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-[15px] transition", type === t ? "border-brand-600 bg-brand-50 font-semibold" : "border-surface-line hover:border-brand-300")}>
            <input type="radio" name="professional" className="size-4 accent-brand-600" checked={type === t} onChange={() => onType(t)} />
            {PROFESSIONAL_LABEL[t]}
          </label>
        ))}
      </div>
      {type === "slp" && (
        <div className="mt-3 rounded-2xl bg-surface-muted p-4">
          <label htmlFor="license" className="label">מספר רישיון משרד הבריאות</label>
          <input id="license" className={clsx("input", error && "border-red-400")} dir="ltr" inputMode="text" autoComplete="off" value={license} maxLength={20}
            onChange={(e) => onLicense(e.target.value)} placeholder="123456" aria-describedby="license-help" />
          <p id="license-help" className="mt-2 text-xs leading-relaxed text-ink-soft">מנהלת תאמת את המספר מול הרישום של משרד הבריאות לפני שנפתחת האפשרות להעלות מילים. אפשר להשלים גם אחר כך בפרופיל. כל שאר היכולות פתוחות מיד.</p>
          {error && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        </div>
      )}
    </fieldset>
  );
}

export function licenseError(type: ProfessionalType, license: string): string | undefined {
  if (type === "slp" && license.trim() && !LICENSE_PATTERN.test(license.trim())) return "מספר הרישיון לא תקין (3–20 תווים: ספרות, אותיות באנגלית, / או -).";
  return undefined;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const map = {
    verified: { Icon: BadgeCheck, cls: "bg-emerald-100 text-emerald-800", text: "מאומתת" },
    pending: { Icon: Clock, cls: "bg-amber-100 text-amber-800", text: "ממתין לאימות" },
    rejected: { Icon: ShieldAlert, cls: "bg-red-100 text-red-800", text: "האימות נדחה" },
    none: { Icon: ShieldAlert, cls: "bg-surface-muted text-ink-soft", text: "לא אומת" },
  }[status];
  return <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", map.cls)}><map.Icon className="size-3.5" />{map.text}</span>;
}

export function useLicenseState(initialType: ProfessionalType, initialLicense: string | null) {
  const [type, setType] = useState<ProfessionalType>(initialType);
  const [license, setLicense] = useState(initialLicense ?? "");
  return { type, setType, license, setLicense };
}
