"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthCard, FieldError } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { repo } from "@/lib/data";

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => { if (user) router.replace("/"); }, [user, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("הסיסמה קצרה מדי — לפחות 6 תווים."); return; }
    setBusy(true);
    try {
      const { needsConfirmation } = await repo.signUp(email, password, name);
      if (needsConfirmation) { setConfirmSent(true); setBusy(false); return; }
      toast.success("ברוכה הבאה ל-SpeechSearch! 🎉");
      router.replace("/search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש");
      setBusy(false);
    }
  };

  if (confirmSent)
    return (
      <AuthCard title="כמעט שם 📬" subtitle={`שלחנו קישור אישור אל ${email}. לחצי עליו וחזרי להתחבר.`}>
        <Link href="/login" className="btn btn-primary w-full">למסך הכניסה</Link>
      </AuthCard>
    );

  return (
    <AuthCard title="הצטרפי — חינם!" subtitle="חיפוש מילים, סטים אישיים והדפסה — הכול במקום אחד." footer={<>כבר יש לך חשבון? <Link href="/login" className="font-bold text-brand-700 hover:underline">כניסה</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="label">איך לקרוא לך?</label>
          <input id="name" autoComplete="given-name" required className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </div>
        <div>
          <label htmlFor="email" className="label">מייל</label>
          <input id="email" type="email" autoComplete="email" required className="input" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">סיסמה</label>
          <input id="password" type="password" autoComplete="new-password" required minLength={6} className="input" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1.5 text-xs text-ink-faint">לפחות 6 תווים</p>
        </div>
        <FieldError>{error}</FieldError>
        <button type="submit" disabled={busy || !name.trim() || !email || !password} className="btn btn-primary w-full">{busy ? "פותחת חשבון…" : "הצטרפי — חינם!"}</button>
      </form>
    </AuthCard>
  );
}
