import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-ink-soft">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <p className="mt-5 text-center text-[15px] text-ink-soft">{footer}</p>}
    </div>
  );
}

export function FieldError({ children }: { children?: string }) {
  return children ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{children}</p> : null;
}
