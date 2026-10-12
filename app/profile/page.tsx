"use client";
import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSelection } from "@/components/providers/SelectionProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ProfessionalFields, VerificationBadge, licenseError, useLicenseState } from "@/components/profile/LicenseForm";
import { repo } from "@/lib/data";

function Profile() {
  const { user, isAdmin, refresh } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const sel = useSelection();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const pro = useLicenseState(user?.professional_type ?? "other", user?.license_number ?? null);
  const [licErr, setLicErr] = useState("");
  useEffect(() => { if (user) { setName(user.display_name); pro.setType(user.professional_type ?? "other"); pro.setLicense(user.license_number ?? ""); } }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const saveLicense = async () => {
    const e = licenseError(pro.type, pro.license) ?? (pro.type === "slp" && !pro.license.trim() ? "הזיני את מספר הרישיון." : undefined);
    setLicErr(e ?? ""); if (e) return;
    setBusy(true);
    try { await repo.submitLicense(pro.type, pro.license); await refresh(); toast.success(pro.type === "slp" ? "הרישיון נשלח לאימות — נעדכן אותך ✅" : "הפרופיל עודכן ✅"); }
    catch (err) { setLicErr(err instanceof Error ? err.message : "העדכון נכשל"); }
    finally { setBusy(false); }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try { await repo.updateDisplayName(name); await refresh(); toast.success("השם עודכן ✅"); }
    catch { toast.error("העדכון נכשל. נסי שוב."); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-3xl font-black">הפרופיל שלי</h1>
      <form onSubmit={save} className="card mt-6 space-y-4 p-6">
        <div><label htmlFor="pn" className="label">שם</label><input id="pn" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></div>
        <div><span className="label">מייל</span><p className="input flex items-center text-ink-soft" dir="ltr">{user?.email}</p></div>
        <button className="btn btn-primary" disabled={busy || !name.trim() || name === user?.display_name}>שמירה</button>
      </form>
      <section className="card mt-4 space-y-4 p-6" aria-labelledby="pro">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="pro" className="text-lg font-extrabold">אימות מקצועי</h2>
          <VerificationBadge status={user?.verification_status ?? "none"} />
        </div>
        {user?.verification_status === "verified" && <p className="text-sm text-ink-soft">הרישיון שלך אומת. את יכולה להעלות מילים ותמונות לקהילה. 💜</p>}
        {user?.verification_status === "pending" && <p className="text-sm text-ink-soft">הרישיון (<span dir="ltr">{user.license_number}</span>) ממתין לבדיקת מנהלת. עד האימות כל החיפוש והסטים פתוחים לך — רק ההעלאה נעולה.</p>}
        {user?.verification_status === "rejected" && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800"><b>הסיבה:</b> {user.verification_note}</p>}
        {user?.verification_status !== "verified" && (
          <>
            <ProfessionalFields type={pro.type} license={pro.license} onType={pro.setType} onLicense={pro.setLicense} error={licErr} />
            <button className="btn btn-primary" onClick={saveLicense} disabled={busy}>{pro.type === "slp" ? "שלחי לאימות" : "שמרי"}</button>
          </>
        )}
      </section>
      <div className="mt-4 space-y-3">
        {isAdmin && <Link href="/admin" className="btn btn-ghost w-full"><ShieldCheck className="size-5" /> ממשק ניהול</Link>}
        <button className="btn btn-danger-ghost w-full" onClick={async () => { await repo.signOut(); sel.clear(); toast.show("להתראות! התנתקת בהצלחה 👋"); router.push("/"); }}><LogOut className="size-5" /> התנתקות</button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <RequireAuth><Profile /></RequireAuth>;
}
