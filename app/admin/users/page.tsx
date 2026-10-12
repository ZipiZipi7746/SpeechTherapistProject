"use client";
import { BadgeCheck, Mail, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { VerificationBadge } from "@/components/profile/LicenseForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { PROFESSIONAL_LABEL } from "@/lib/constants";
import { repo } from "@/lib/data";
import { relativeDay } from "@/lib/format";
import type { Profile, Role } from "@/lib/types";

function Users() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<Profile[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [rejecting, setRejecting] = useState<Profile | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const load = () => repo.adminListUsers().then(setUsers).catch(() => setUsers([]));
  useEffect(() => { void load(); }, []);

  const sendTest = async () => {
    setTesting(true);
    try {
      const r = await repo.sendTestEmail();
      if (r.sent) toast.success("מייל הבדיקה נשלח ✅ בדקי את תיבת הדואר");
      else toast.error(r.reason?.startsWith("not configured") ? `חסרות הגדרות: ${r.reason.replace("not configured: ", "")}` : `המייל לא נשלח: ${r.reason ?? "שגיאה"}`);
    } finally { setTesting(false); }
  };
  const change = async (u: Profile, role: Role) => {
    try { await repo.adminSetRole(u.id, role); toast.success(`${u.display_name} — ${role === "admin" ? "מנהלת" : "קלינאית"} ✅`); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "העדכון נכשל"); }
  };
  const verify = async (u: Profile) => {
    try { await repo.adminReviewLicense(u.id, "verified"); toast.success(`הרישיון של ${u.display_name} אומת ✅`); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "העדכון נכשל"); }
  };
  const reject = async () => {
    if (!rejecting) return;
    if (!note.trim()) { setError("כתבי סיבה קצרה — היא תוצג למשתמשת."); return; }
    try { await repo.adminReviewLicense(rejecting.id, "rejected", note); toast.show("האימות נדחה והסבר נשמר"); setRejecting(null); setNote(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "העדכון נכשל"); }
  };

  if (!users) return <Skeleton className="h-64" />;
  // pending license reviews first
  const sorted = [...users].sort((a, b) => Number(b.verification_status === "pending") - Number(a.verification_status === "pending"));
  const pending = users.filter((u) => u.verification_status === "pending").length;

  return (
    <>
      {pending > 0 && <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{pending} רישיונות ממתינים לאימות — בדקי כל מספר מול הרישום הרשמי של משרד הבריאות לפני האישור.</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-[15px]">
          <thead className="border-b border-surface-line text-sm text-ink-soft"><tr>{["שם", "מייל", "סוג", "רישיון", "אימות", "תפקיד"].map((h) => <th key={h} className="px-4 py-3 text-start font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u.id} className="border-b border-surface-line align-middle last:border-0">
                <td className="px-4 py-3 font-bold">{u.display_name}<span className="block text-xs font-normal text-ink-faint">הצטרפה {relativeDay(u.created_at)}</span></td>
                <td className="px-4 text-ink-soft" dir="ltr"><span className="block text-end">{u.email}</span></td>
                <td className="px-4 text-sm">{PROFESSIONAL_LABEL[u.professional_type ?? "other"]}</td>
                <td className="px-4 font-mono text-sm" dir="ltr"><span className="block text-end">{u.license_number ?? "—"}</span></td>
                <td className="px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <VerificationBadge status={u.verification_status ?? "none"} />
                    {u.professional_type === "slp" && u.verification_status !== "verified" && u.license_number && (
                      <button className="btn btn-primary min-h-8 bg-none bg-emerald-600 px-3 text-xs shadow-none hover:bg-emerald-700" onClick={() => verify(u)}><BadgeCheck className="size-3.5" /> אמתי</button>
                    )}
                    {u.professional_type === "slp" && u.verification_status !== "rejected" && u.license_number && (
                      <button className="btn btn-danger-ghost min-h-8 px-3 text-xs" onClick={() => { setRejecting(u); setNote(""); setError(""); }}><XCircle className="size-3.5" /> דחי</button>
                    )}
                  </div>
                </td>
                <td className="px-4">
                  <select aria-label={`תפקיד של ${u.display_name}`} className="input min-h-9 w-32 py-1 text-sm" value={u.role} disabled={u.id === user?.id} onChange={(e) => change(u, e.target.value as Role)}>
                    <option value="clinician">קלינאית</option><option value="admin">מנהלת</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-surface-line px-4 py-3 text-xs text-ink-faint">מנהלות אינן רואות את הסטים הפרטיים של קלינאיות — הם מוגנים ברמת מסד הנתונים.</p>
        <div className="flex flex-wrap items-center gap-3 border-t border-surface-line px-4 py-4">
          <button className="btn btn-ghost min-h-10 text-sm" disabled={testing} onClick={sendTest}><Mail className="size-4" /> {testing ? "שולחת…" : "שלחי מייל בדיקה"}</button>
          <span className="text-xs text-ink-faint">בודק שהתראות המייל (Resend) מוגדרות — המייל נשלח לכתובת ADMIN_NOTIFY_EMAIL.</span>
        </div>
      </div>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={`דחיית אימות — ${rejecting?.display_name ?? ""}`} size="sm"
        footer={<><button className="btn btn-danger" onClick={reject}>דחייה ושמירת הסבר</button><button className="btn btn-ghost" onClick={() => setRejecting(null)}>בטלי</button></>}>
        <label htmlFor="lic-note" className="label">מה לא תקין?</label>
        <textarea id="lic-note" data-autofocus rows={3} className="input py-3" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="למשל: המספר לא נמצא ברישום. אפשר לבדוק ולשלוח שוב." />
        {error && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      </Modal>
    </>
  );
}

export default function AdminUsersPage() {
  return <AdminShell><Users /></AdminShell>;
}
