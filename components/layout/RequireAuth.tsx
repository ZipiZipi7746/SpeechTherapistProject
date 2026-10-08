"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Skeleton";

/** Client-side route guard. The real enforcement is Row Level Security in the database. */
export function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [loading, user, router, path]);

  if (loading || !user) return <Spinner />;
  if (admin && !isAdmin)
    return (
      <EmptyState emoji="🔒" title="האזור הזה שמור למנהלות המערכת" actions={<Link href="/" className="btn btn-primary">חזרה לדף הבית</Link>}>
        אם את חושבת שזו טעות — פני למנהלת המערכת.
      </EmptyState>
    );
  return <>{children}</>;
}
