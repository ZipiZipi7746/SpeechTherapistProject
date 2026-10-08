"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { AuthCard, FieldError } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { isDemoMode, repo } from "@/lib/data";
import { safeRedirect } from "@/lib/safeRedirect";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();
  const next = params.get("next");
  const dest = safeRedirect(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.replace(dest); }, [user, dest, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await repo.signIn(email, password);
      toast.success("ברוכה השבה! 👋");
      router.replace(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש");
      setBusy(false);
    }
  };

  return (
    <AuthCard title="ברוכה השבה" subtitle="כדי להמשיך מהמקום שעצרת." footer={<>עוד אין לך חשבון? <Link href="/signup" className="font-bold text-brand-700 hover:underline">הצטרפי — חינם!</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">מייל</label>
          <input id="email" type="email" autoComplete="email" required className="input" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">סיסמה</label>
          <input id="password" type="password" autoComplete="current-password" required className="input" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <FieldError>{error}</FieldError>
        {error && <p className="text-sm"><Link href="/forgot" className="font-bold text-brand-700 hover:underline">איפוס סיסמה</Link></p>}
        <button type="submit" disabled={busy || !email || !password} className="btn btn-primary w-full">{busy ? "מתחברת…" : "כניסה"}</button>
        {!error && <p className="text-center text-sm"><Link href="/forgot" className="text-ink-soft hover:underline">שכחתי סיסמה</Link></p>}
      </form>
      {isDemoMode && (
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <b>מצב הדגמה — חשבונות לניסיון:</b>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="chip text-xs" onClick={() => { setEmail("demo@speechsearch.app"); setPassword("demo1234"); }}>קלינאית</button>
            <button type="button" className="chip text-xs" onClick={() => { setEmail("admin@speechsearch.app"); setPassword("admin1234"); }}>מנהלת</button>
          </div>
        </div>
      )}
    </AuthCard>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
