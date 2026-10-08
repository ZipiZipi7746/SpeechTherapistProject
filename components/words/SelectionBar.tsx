"use client";
import { FolderPlus, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSelection } from "@/components/providers/SelectionProvider";
import { SaveToSetDialog } from "./SaveToSetDialog";

/**
 * Persistent selection area (spec ch.8): "3 words selected — [Save to set]".
 * Desktop: sticky bottom bar. Mobile: FAB at bottom-right (spec ch.11).
 */
export function SelectionBar() {
  const { user } = useAuth();
  const sel = useSelection();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const hidden = !user || sel.count === 0 || /\/print$/.test(path) || path.startsWith("/admin");
  return (
    <>
      {!hidden && (
        <>
          <div className="no-print fixed inset-x-0 bottom-4 z-40 hidden justify-center px-4 md:flex">
            <div className="flex w-full max-w-2xl animate-toast-in items-center justify-between gap-4 rounded-3xl border border-brand-200 bg-white p-3 ps-5 shadow-pop">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{sel.count}</span>
                <span className="font-semibold">{sel.count === 1 ? "מילה נבחרה" : "מילים נבחרו"}</span>
                <button onClick={sel.clear} className="btn-icon size-8" aria-label="ניקוי הבחירה"><X className="size-4" /></button>
              </div>
              <button className="btn btn-primary" onClick={() => setOpen(true)}><FolderPlus className="size-5" /> שמרי לסט</button>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)} aria-label={`שמרי ${sel.count} מילים לסט`}
            className="no-print fixed bottom-20 start-4 z-40 flex size-16 animate-toast-in items-center justify-center rounded-full bg-brand-gradient text-white shadow-pop md:hidden"
          >
            <FolderPlus className="size-7" />
            <span className="absolute -end-1 -top-1 flex size-6 items-center justify-center rounded-full bg-amber-400 text-xs font-extrabold text-ink">{sel.count}</span>
          </button>
        </>
      )}
      <SaveToSetDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
