"use client";
import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSelection } from "@/components/providers/SelectionProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { repo } from "@/lib/data";

function Profile() {
  const { user, isAdmin, refresh } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const sel = useSelection();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) setName(user.display_name); }, [user]);

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
