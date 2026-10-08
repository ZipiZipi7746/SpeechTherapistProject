"use client";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; message: string }
interface ToastApi { show: (message: string, kind?: ToastKind) => void; success: (m: string) => void; error: (m: string) => void }

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId.current++;
    setItems((l) => [...l.slice(-3), { id, kind, message }]);
    setTimeout(() => dismiss(id), 3000); // spec: transient, 3 seconds
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({ show, success: (m) => show(m, "success"), error: (m) => show(m, "error") }), [show]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" role="status" className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-8">
        {items.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "pointer-events-auto flex max-w-md animate-toast-in items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold shadow-pop",
              t.kind === "success" && "bg-emerald-600 text-white",
              t.kind === "error" && "bg-red-600 text-white",
              t.kind === "info" && "bg-ink text-white",
            )}
          >
            {t.kind === "success" ? <CheckCircle2 className="size-5 shrink-0" /> : t.kind === "error" ? <AlertCircle className="size-5 shrink-0" /> : null}
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="סגירה" className="-me-1 rounded-lg p-1 opacity-80 hover:opacity-100"><X className="size-4" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used inside ToastProvider");
  return v;
}
