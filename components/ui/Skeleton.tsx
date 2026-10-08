import clsx from "clsx";

export const Skeleton = ({ className }: { className?: string }) => <div className={clsx("animate-pulse rounded-2xl bg-brand-100/60", className)} />;

export function Spinner({ label = "טוענת…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-ink-soft">
      <span className="size-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
