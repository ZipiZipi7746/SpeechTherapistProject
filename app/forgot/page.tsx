"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthCard, FieldError } from "@/components/auth/AuthCard";
import { repo } from "@/lib/data";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try { await repo.resetPassword(email); setDone(true); }
    catch (err) { setError(err instanceof Error ? err.message : "משהו השתבש"); }
    finally { setBusy(false); }
  };

  if (done)
    return (
      <AuthCard title="בדקי את המייל 📬" subtitle="אם הכתובת רשומה אצלנו, שלחנו אליה קישור לאיפוס הסיסמה.">
        <Link href="/login" className="btn btn-primary w-full">חזרה לכניסה</Link>
      </AuthCard>
    );
  return (
    <AuthCard title="איפוס סיסמה" subtitle="נשלח לך קישור לבחירת סיסמה חדשה." footer={<Link href="/login" className="font-bold text-brand-700 hover:underline">חזרה לכניסה</Link>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">מייל</label>
          <input id="email" type="email" autoComplete="email" required className="input" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <FieldError>{error}</FieldError>
        <button type="submit" disabled={busy || !email} className="btn btn-primary w-full">{busy ? "שולחת…" : "שלחי קישור"}</button>
      </form>
    </AuthCard>
  );
}
