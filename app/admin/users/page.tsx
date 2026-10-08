"use client";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { repo } from "@/lib/data";
import { relativeDay } from "@/lib/format";
import type { Profile, Role } from "@/lib/types";

function Users() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<Profile[] | null>(null);
  const [testing, setTesting] = useState(false);
  const sendTest = async () => {
    setTesting(true);
    try {
      const r = await repo.sendTestEmail();
      if (r.sent) toast.success("מייל הבדיקה נשלח ✅ בדקי את תיבת הדואר");
      else toast.error(r.reason?.startsWith("not configured") ? `חסרות הגדרות: ${r.reason.replace("not configured: ", "")}` : `המייל לא נשלח: ${r.reason ?? "שגיאה"}`);
    } finally { setTesting(false); }
  };
  const load = () => repo.adminListUsers().then(setUsers).catch(() => setUsers([]));
  useEffect(() => { void load(); }, []);

  const change = async (u: Profile, role: Role) => {
    try { await repo.adminSetRole(u.id, role); toast.success(`${u.display_name} — ${role === "admin" ? "מנהלת" : "קלינאית"} ✅`); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "העדכון נכשל"); }
  };

  if (!users) return <Skeleton className="h-64" />;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-[15px]">
        <thead className="border-b border-surface-line text-sm text-ink-soft"><tr>{["שם", "מייל", "הצטרפה", "תפקיד"].map((h) => <th key={h} className="px-4 py-3 text-start font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-surface-line last:border-0">
              <td className="px-4 py-3 font-bold">{u.display_name}</td>
              <td className="px-4 text-ink-soft" dir="ltr"><span className="block text-end">{u.email}</span></td>
              <td className="px-4 text-sm text-ink-soft">{relativeDay(u.created_at)}</td>
              <td className="px-4">
                <select aria-label={`תפקיד של ${u.display_name}`} className="input min-h-9 w-36 py-1 text-sm" value={u.role} disabled={u.id === user?.id} onChange={(e) => change(u, e.target.value as Role)}>
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
  );
}

export default function AdminUsersPage() {
  return <AdminShell><Users /></AdminShell>;
}
