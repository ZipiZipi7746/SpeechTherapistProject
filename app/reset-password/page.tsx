"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard, FieldError } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { repo } from "@/lib/data";
import { Spinner } from "@/components/ui/Skeleton";
import Link from "next/link";

/** Landing page of the Supabase recovery e-mail: the recovery token signs the user in, then they pick a new password. */
export default function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (!user)
    return (
      <AuthCard title="הקישור לא תקף" subtitle="ייתכן שהקישור פג תוקף. אפשר לבקש חדש.">
        <Link href="/forgot" className="btn btn-primary w-full">בקשי קישור חדש</Link>
      </AuthCard>
    );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("הסיסמה קצרה מדי — לפחות 6 תווים."); return; }
    setBusy(true); setError("");
    try { await repo.updatePassword(password); toast.success("הסיסמה עודכנה ✅"); router.replace("/"); }
    catch (err) { setError(err instanceof Error ? err.message : "משהו השתבש"); setBusy(false); }
  };

  return (
    <AuthCard title="בחירת סיסמה חדשה">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="pw" className="label">סיסמה חדשה</label>
          <input id="pw" type="password" autoComplete="new-password" className="input" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <FieldError>{error}</FieldError>
        <button type="submit" disabled={busy || !password} className="btn btn-primary w-full">{busy ? "שומרת…" : "שמרי סיסמה"}</button>
      </form>
    </AuthCard>
  );
}
