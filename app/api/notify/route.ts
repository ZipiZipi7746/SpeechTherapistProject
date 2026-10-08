import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * E-mail notifications through Resend (the spec's stack choice).
 *   "submitted" — a clinician submitted a word        -> e-mail ADMIN_NOTIFY_EMAIL
 *   "reviewed"  — an admin approved / rejected a word -> e-mail the submitter
 *   "test"      — an admin checks the configuration   -> e-mail ADMIN_NOTIFY_EMAIL
 *
 * Security: the caller is identified by their Supabase access token; everything else is read from the
 * database (never trusted from the request body), and each submission / review can mail only once.
 * Without the env vars below the route is a harmless no-op that reports what is missing.
 */

type Body = { type: "submitted"; uploadId: string } | { type: "reviewed"; uploadId: string } | { type: "test" };
type Result = { sent: boolean; reason?: string };

const json = (r: Result, status = 200) => NextResponse.json(r, { status });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string, cta?: { href: string; label: string }) {
  return `<!doctype html><html dir="rtl" lang="he"><body style="margin:0;background:#f8f8fd;font-family:Arial,Helvetica,sans-serif;color:#16132b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e7e5f3">
<tr><td style="background:#7c4dcf;background-image:linear-gradient(135deg,#7c4dcf,#c97be0);padding:20px 28px;color:#fff;font-size:20px;font-weight:bold">SpeechSearch</td></tr>
<tr><td style="padding:28px;line-height:1.7;font-size:16px"><h1 style="margin:0 0 12px;font-size:22px">${esc(title)}</h1>${body}
${cta ? `<p style="margin:24px 0 0"><a href="${esc(cta.href)}" style="display:inline-block;background:#7c4dcf;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:bold">${esc(cta.label)}</a></p>` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

async function sendMail(to: string, subject: string, html: string): Promise<Result> {
  const res = await fetch(`${process.env.RESEND_API_URL ?? "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.RESEND_FROM ?? "SpeechSearch <onboarding@resend.dev>", to, subject, html }),
  });
  if (res.ok) return { sent: true };
  const detail = await res.json().catch(() => ({}));
  console.error("[notify] Resend error", res.status, detail);
  return { sent: false, reason: `Resend: ${(detail as { message?: string }).message ?? res.status}` };
}

/** Marks the row as notified (atomically, so concurrent calls can't double-send). Returns false if it already was. */
async function claim(db: SupabaseClient, id: string, column: "admin_notified_at" | "result_notified_at"): Promise<boolean> {
  const { data } = await db.from("pending_uploads").update({ [column]: new Date().toISOString() }).eq("id", id).is(column, null).select("id");
  return (data?.length ?? 0) > 0;
}
const unclaim = (db: SupabaseClient, id: string, column: string) => db.from("pending_uploads").update({ [column]: null }).eq("id", id);

async function handle(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL", !anon && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    !process.env.RESEND_API_KEY && "RESEND_API_KEY", !service && "SUPABASE_SERVICE_ROLE_KEY", !process.env.ADMIN_NOTIFY_EMAIL && "ADMIN_NOTIFY_EMAIL",
  ].filter(Boolean);
  if (missing.length) return json({ sent: false, reason: `not configured: ${missing.join(", ")}` });

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ sent: false, reason: "unauthorized" }, 401);
  const caller = createClient(url!, anon!, { auth: { persistSession: false } });
  const { data: auth } = await caller.auth.getUser(token);
  if (!auth.user) return json({ sent: false, reason: "unauthorized" }, 401);

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !["submitted", "reviewed", "test"].includes(body.type)) return json({ sent: false, reason: "bad request" }, 400);

  const db = createClient(url!, service!, { auth: { persistSession: false } });
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL!;

  const isAdmin = async () => (await db.from("profiles").select("role").eq("id", auth.user!.id).maybeSingle()).data?.role === "admin";

  if (body.type === "test") {
    if (!(await isAdmin())) return json({ sent: false, reason: "forbidden" }, 403);
    return json(await sendMail(adminTo, "מייל בדיקה — SpeechSearch", layout("ההתראות עובדות ✅", "<p>אם את קוראת את זה, הגדרות המייל תקינות.</p>", { href: `${site}/admin`, label: "לממשק הניהול" })));
  }

  const { data: up } = await db.from("pending_uploads")
    .select("id, text, status, rejection_reason, submitted_by, admin_notified_at, result_notified_at").eq("id", body.uploadId).maybeSingle();
  if (!up) return json({ sent: false, reason: "not found" }, 404);

  if (body.type === "submitted") {
    if (up.submitted_by !== auth.user.id) return json({ sent: false, reason: "forbidden" }, 403);
    if (up.status !== "pending") return json({ sent: false, reason: "not pending" });
    if (!(await claim(db, up.id, "admin_notified_at"))) return json({ sent: false, reason: "already notified" });
    const r = await sendMail(adminTo, "מילה חדשה ממתינה לאישור — SpeechSearch",
      layout("מילה חדשה ממתינה לאישור", `<p>הוגשה המילה <b style="font-size:20px">${esc(up.text)}</b>.</p>`, { href: `${site}/admin`, label: "לתור האישורים" }));
    if (!r.sent) await unclaim(db, up.id, "admin_notified_at");
    return json(r);
  }

  // reviewed: admin only; what to say comes from the database, not from the request
  if (!(await isAdmin())) return json({ sent: false, reason: "forbidden" }, 403);
  if (up.status !== "approved" && up.status !== "rejected") return json({ sent: false, reason: "not reviewed" });
  if (!(await claim(db, up.id, "result_notified_at"))) return json({ sent: false, reason: "already notified" });
  const { data: submitter } = await db.from("profiles").select("email").eq("id", up.submitted_by).maybeSingle();
  if (!submitter?.email) { await unclaim(db, up.id, "result_notified_at"); return json({ sent: false, reason: "no recipient" }); }

  const r = up.status === "approved"
    ? await sendMail(submitter.email, "המילה שלך אושרה 🎉",
        layout("המילה שלך אושרה 🎉", `<p>המילה <b style="font-size:20px">${esc(up.text)}</b> אושרה ונכנסה למאגר. תודה על התרומה לקהילה!</p>`, { href: `${site}/search?q=${encodeURIComponent(String(up.text))}`, label: "לראות במאגר" }))
    : await sendMail(submitter.email, "המילה שלך דורשת תיקון",
        layout("המילה שלך דורשת תיקון", `<p>המילה <b style="font-size:20px">${esc(up.text)}</b> לא אושרה הפעם.</p><p style="background:#fff1f1;padding:12px 16px;border-radius:12px"><b>הסיבה:</b> ${esc(up.rejection_reason)}</p><p>אפשר לתקן ולהגיש מחדש בלחיצה אחת.</p>`, { href: `${site}/upload`, label: "תקני והגישי מחדש" }));
  if (!r.sent) await unclaim(db, up.id, "result_notified_at");
  return json(r);
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    // e.g. a network filter blocking api.resend.com, or a wrong key/URL — report it instead of a bare 500
    const err = e as Error & { cause?: { code?: string; message?: string } };
    const detail = err.cause?.code ?? err.cause?.message ?? err.message;
    console.error("[notify] failed:", e);
    return json({ sent: false, reason: `server error: ${detail}` });
  }
}
