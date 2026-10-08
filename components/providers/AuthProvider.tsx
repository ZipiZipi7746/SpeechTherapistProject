"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { repo } from "@/lib/data";
import type { Profile } from "@/lib/types";

interface AuthApi {
  user: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  /** Returns true when signed in. For guests it opens the friendly "sign up — it's free" prompt (spec scenario 2). */
  requireAuth: () => boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [gate, setGate] = useState(false);

  const refresh = useCallback(async () => {
    try { setUser(await repo.getProfile()); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    return repo.onAuthChange((p) => { setUser(p); setLoading(false); });
  }, [refresh]);

  const api = useMemo<AuthApi>(() => ({
    user, loading, isAdmin: user?.role === "admin", refresh,
    requireAuth: () => { if (user) return true; setGate(true); return false; },
  }), [user, loading, refresh]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <Modal
        open={gate} onClose={() => setGate(false)} title="רגע לפני שממשיכות 💜" size="sm"
        footer={
          <>
            <Link href="/signup" className="btn btn-primary" onClick={() => setGate(false)}>הרשמי עכשיו</Link>
            <Link href="/login" className="btn btn-ghost" onClick={() => setGate(false)}>כבר יש לי חשבון</Link>
          </>
        }
      >
        <p className="text-[15px] leading-relaxed text-ink-soft">כדי לשמור מילים, יש להירשם — <b className="text-ink">זה חינם וקל!</b> אחרי ההרשמה נפתח לך המאגר המלא, כל הפילטרים והסטים האישיים.</p>
      </Modal>
    </Ctx.Provider>
  );
}

export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
