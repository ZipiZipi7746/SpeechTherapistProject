"use client";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <EmptyState emoji="😕" title="משהו השתבש" actions={<button className="btn btn-primary" onClick={reset}>נסי שוב</button>}>זה קרה לנו, לא לך. נסי לרענן, ואם זה חוזר — ספרי לנו.</EmptyState>;
}
