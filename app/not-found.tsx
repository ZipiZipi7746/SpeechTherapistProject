import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return <EmptyState emoji="🧭" title="הדף הזה לא נמצא" actions={<Link href="/" className="btn btn-primary">לדף הבית</Link>}>אולי הקישור ישן, או שהוקלד בטעות.</EmptyState>;
}
