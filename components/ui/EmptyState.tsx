import type { ReactNode } from "react";

export function EmptyState({ emoji = "🔎", title, children, actions }: { emoji?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-14 text-center">
      <div className="mb-4 flex size-20 items-center justify-center rounded-3xl bg-brand-gradient-soft text-4xl" aria-hidden>{emoji}</div>
      <h3 className="text-xl font-extrabold">{title}</h3>
      {children && <div className="mt-2 text-[15px] leading-relaxed text-ink-soft">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
