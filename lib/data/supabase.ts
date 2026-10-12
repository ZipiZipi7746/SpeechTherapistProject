import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Category, CategoryInput, ProfessionalType, VerificationStatus, PendingUpload, Profile, Role, SearchFilters, SetSummary, UploadInput, Word, WordInput,
} from "../types";
import { AppError, type Repo } from "./repo";

const WORD_SELECT = "*, category:phonological_categories(*), images:word_images(*)";
const BUCKET = "word-images";

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function fail(error: { message: string; code?: string } | null, fallback = "משהו השתבש. נסי שוב בעוד רגע."): void {
  if (!error) return;
  if (error.code === "42501" || /row-level security|forbidden/i.test(error.message)) throw new AppError("אין הרשאה לפעולה זו.", "forbidden");
  console.error(error);
  throw new AppError(fallback, error.code ?? "db");
}

function authError(message: string): AppError {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return new AppError("המייל או הסיסמה לא מתאימים. רוצי לאפס?", "bad_credentials");
  if (m.includes("email not confirmed")) return new AppError("צריך לאשר את כתובת המייל — שלחנו לך קישור.", "unconfirmed");
  if (m.includes("already registered")) return new AppError("כתובת המייל הזו כבר רשומה. אולי להתחבר?", "exists");
  if (m.includes("password")) return new AppError("הסיסמה קצרה מדי — לפחות 6 תווים.", "weak_password");
  if (m.includes("rate limit")) return new AppError("נסינו יותר מדי פעמים. נסי שוב בעוד כמה דקות.", "rate_limit");
  return new AppError("משהו השתבש. נסי שוב בעוד רגע.", "auth");
}

const mapWord = (r: any): Word => ({ ...r, category: r.category ?? null, images: r.images ?? [] });

async function currentUserId(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new AppError("צריך להתחבר כדי לבצע פעולה זו.", "auth");
  return data.user.id;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await sb().from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

let categoryCache: Category[] | null = null;
async function categories(): Promise<Category[]> {
  if (categoryCache) return categoryCache;
  const { data, error } = await sb().from("phonological_categories").select("*").order("name_he");
  fail(error);
  categoryCache = (data ?? []) as Category[];
  return categoryCache;
}

async function searchArgs(f: SearchFilters) {
  const cats = await categories();
  const ids = f.categories.map((s) => cats.find((c) => c.slug === s)?.id).filter(Boolean);
  const arr = <T,>(a: T[]) => (a.length ? a : null);
  return {
    p_q: f.q.trim() || null,
    p_phonemes: arr(f.phonemes),
    p_position: f.phonemes.length ? f.position : null,
    p_forbidden: arr(f.forbidden),
    p_syllables: arr(f.syllables),
    p_letters: arr(f.letters),
    p_vowels: arr(f.vowels),
    p_categories: arr(ids as string[]),
    p_age: f.age,
    p_difficulty: arr(f.difficulty),
    p_abstractness: arr(f.abstractness),
    p_image_kinds: arr(f.imageKinds),
  };
}

async function uploadImage(userId: string, image: Blob): Promise<{ path: string; url: string }> {
  const ext = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb().storage.from(BUCKET).upload(path, image, { contentType: image.type, upsert: false });
  if (error) { console.error(error); throw new AppError("העלאת התמונה נכשלה. בדקי שהקובץ קטן מ-2MB ונסי שוב.", "upload"); }
  return { path, url: sb().storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

const uploadRow = (input: UploadInput) => ({
  text: input.text.trim(), syllable_count: input.syllable_count, vowels: input.vowels, primary_phoneme: input.primary_phoneme,
  category_id: input.category_id, age_min: input.age_min, age_max: input.age_max, difficulty: input.difficulty,
  abstractness: input.abstractness, image_kind: input.image_kind, cultural_warning: input.cultural_warning,
});

/** Fire-and-forget email notification (server route is a no-op without RESEND_API_KEY). */
async function notify(body: Record<string, unknown>): Promise<{ sent: boolean; reason?: string }> {
  try {
    const { data } = await sb().auth.getSession();
    if (!data.session) return { sent: false, reason: "no session" };
    const res = await fetch("/api/notify", {
      method: "POST", keepalive: true,
      headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify(body),
    });
    return (await res.json()) as { sent: boolean; reason?: string };
  } catch { return { sent: false, reason: "network" }; } // notifications are best-effort
}

const mapUpload = (r: any): PendingUpload => ({ ...r, category: r.category ?? null, submitter_name: r.submitter?.display_name });

export const supabaseRepo: Repo = {
  mode: "supabase",

  async getProfile() {
    const { data } = await sb().auth.getSession();
    return data.session ? fetchProfile(data.session.user.id) : null;
  },
  onAuthChange(cb) {
    const { data } = sb().auth.onAuthStateChange((_e, session) => {
      // defer: calling supabase inside the callback can deadlock
      setTimeout(async () => cb(session ? await fetchProfile(session.user.id) : null), 0);
    });
    return () => data.subscription.unsubscribe();
  },
  async signIn(email, password) {
    const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw authError(error.message);
  },
  async signUp(email, password, displayName, pro) {
    const { data, error } = await sb().auth.signUp({
      email: email.trim(), password,
      options: { data: { display_name: displayName.trim(), professional_type: pro?.type ?? "other", license_number: pro?.license.trim() ?? "" }, emailRedirectTo: `${location.origin}/` },
    });
    if (error) throw authError(error.message);
    // Supabase returns an obfuscated user with no identities when the email already exists
    if (data.user && data.user.identities?.length === 0) throw authError("already registered");
    return { needsConfirmation: !data.session };
  },
  async signOut() { await sb().auth.signOut(); },
  async resetPassword(email) {
    const { error } = await sb().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/reset-password` });
    if (error) throw authError(error.message);
  },
  async updatePassword(password) {
    const { error } = await sb().auth.updateUser({ password });
    if (error) throw authError(error.message);
  },
  async updateDisplayName(name) {
    const id = await currentUserId();
    fail((await sb().from("profiles").update({ display_name: name.trim() }).eq("id", id)).error);
  },

  listCategories: categories,
  async searchWords(f, page, pageSize) {
    const { data, error, count } = await sb()
      .rpc("search_words", await searchArgs(f), { count: "exact" })
      .select(WORD_SELECT).order("plain_text").range(page * pageSize, (page + 1) * pageSize - 1);
    fail(error, "החיפוש נכשל. נסי שוב.");
    return { words: (data ?? []).map(mapWord), total: count ?? 0 };
  },
  async countWords(f) {
    const { count, error } = await sb().rpc("search_words", await searchArgs(f), { count: "exact", head: true });
    fail(error);
    return count ?? 0;
  },
  async getWord(id) {
    const { data, error } = await sb().from("words").select(WORD_SELECT).eq("id", id).maybeSingle();
    fail(error);
    return data ? mapWord(data) : null;
  },
  async guestSearch(q) {
    const [{ data, error }, total] = await Promise.all([
      sb().rpc("guest_search", { p_q: q.trim() || null }),
      sb().rpc("guest_total"),
    ]);
    fail(error);
    const words: Word[] = ((data ?? []) as any[]).map((r) => ({
      id: r.id, text: r.text, plain_text: r.plain_text, syllable_count: r.syllable_count, letter_count: [...r.plain_text].length,
      vowels: [], primary_phoneme: null, category_id: null, age_min: 3, age_max: 7, difficulty: "easy", abstractness: "concrete",
      emoji: r.emoji, cultural_warning: false,
      images: r.image_url ? [{ id: `${r.id}-img`, kind: "illustration" as const, url: r.image_url, cultural_warning: false }] : [],
      category: r.category_name ? { id: "", slug: "", name_he: r.category_name, description_he: "" } : null,
    }));
    return { words, total: words.length, libraryTotal: Number(total.data ?? 0) };
  },

  async listSets() {
    const { data, error } = await sb().from("sets").select("*, set_items(count)").order("updated_at", { ascending: false });
    fail(error);
    return (data ?? []).map((s: any): SetSummary => ({
      id: s.id, name: s.name, child_name: s.child_name, color: s.color, updated_at: s.updated_at, word_count: s.set_items?.[0]?.count ?? 0,
    }));
  },
  async getSet(id) {
    const { data, error } = await sb().from("sets").select(`*, set_items(position, added_at, word:words(${WORD_SELECT}))`).eq("id", id).maybeSingle();
    fail(error);
    if (!data) return null;
    const items = [...((data as any).set_items ?? [])].sort((a, b) => a.position - b.position || a.added_at.localeCompare(b.added_at));
    const words = items.map((i: any) => i.word).filter(Boolean).map(mapWord);
    return { id: data.id, name: data.name, child_name: data.child_name, color: data.color, updated_at: data.updated_at, word_count: words.length, words };
  },
  async createSet({ name, childName, color, wordIds }) {
    const { data, error } = await sb().from("sets").insert({ name: name.trim(), child_name: childName?.trim() || null, color: color ?? "purple" }).select("id").single();
    fail(error);
    const id = (data as any).id as string;
    if (wordIds.length) {
      const rows = [...new Set(wordIds)].map((word_id, position) => ({ set_id: id, word_id, position }));
      fail((await sb().from("set_items").insert(rows)).error);
    }
    return id;
  },
  async addWordsToSet(setId, wordIds) {
    const { data: existing, error } = await sb().from("set_items").select("word_id, position").eq("set_id", setId);
    fail(error);
    const have = new Set((existing ?? []).map((r: any) => r.word_id));
    const next = Math.max(-1, ...(existing ?? []).map((r: any) => r.position)) + 1;
    const fresh = [...new Set(wordIds)].filter((id) => !have.has(id));
    if (fresh.length) fail((await sb().from("set_items").insert(fresh.map((word_id, i) => ({ set_id: setId, word_id, position: next + i })))).error);
    await sb().from("sets").update({ updated_at: new Date().toISOString() }).eq("id", setId);
    return fresh.length;
  },
  async removeWordFromSet(setId, wordId) {
    fail((await sb().from("set_items").delete().eq("set_id", setId).eq("word_id", wordId)).error);
    await sb().from("sets").update({ updated_at: new Date().toISOString() }).eq("id", setId);
  },
  async updateSet(id, patch) {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name.trim();
    if (patch.childName !== undefined) row.child_name = patch.childName?.trim() || null;
    if (patch.color) row.color = patch.color;
    fail((await sb().from("sets").update(row).eq("id", id)).error);
  },
  async deleteSet(id) { fail((await sb().from("sets").delete().eq("id", id)).error); },

  async submitUpload(input, image) {
    const userId = await currentUserId();
    const img = image ? await uploadImage(userId, image) : null;
    const { data, error } = await sb().from("pending_uploads").insert({ ...uploadRow(input), image_path: img?.path ?? null, image_url: img?.url ?? null }).select("id").single();
    fail(error);
    void notify({ type: "submitted", uploadId: (data as { id: string }).id });
  },
  async listMyUploads() {
    const { data, error } = await sb().from("pending_uploads").select("*, category:phonological_categories(*)").order("created_at", { ascending: false });
    fail(error);
    const uid = await currentUserId();
    return (data ?? []).filter((r: any) => r.submitted_by === uid).map(mapUpload);
  },
  async resubmitUpload(id, input, image) {
    const userId = await currentUserId();
    const img = image ? await uploadImage(userId, image) : null;
    const row: Record<string, unknown> = { ...uploadRow(input), status: "pending", rejection_reason: null, admin_notified_at: null, result_notified_at: null };
    if (img) { row.image_path = img.path; row.image_url = img.url; }
    fail((await sb().from("pending_uploads").update(row).eq("id", id)).error);
    void notify({ type: "submitted", uploadId: id });
  },
  async deleteUpload(id) { fail((await sb().from("pending_uploads").delete().eq("id", id)).error); },

  async listPendingUploads() {
    const { data, error } = await sb().from("pending_uploads").select("*, category:phonological_categories(*), submitter:profiles!pending_uploads_submitted_by_fkey(display_name)").eq("status", "pending").order("created_at");
    fail(error);
    return (data ?? []).map(mapUpload);
  },
  async pendingCount() {
    const [{ count: uploads }, { count: licenses }] = await Promise.all([
      sb().from("pending_uploads").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb().from("profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
    ]);
    return (uploads ?? 0) + (licenses ?? 0);
  },
  async approveUpload(id) {
    fail((await sb().rpc("approve_upload", { p_id: id })).error);
    void notify({ type: "reviewed", uploadId: id });
  },
  async rejectUpload(id, reason) {
    fail((await sb().rpc("reject_upload", { p_id: id, p_reason: reason })).error, "לא הצלחנו לדחות. ודאי שכתבת הסבר.");
    void notify({ type: "reviewed", uploadId: id });
  },
  async adminListWords(q, page, pageSize) {
    let query = sb().from("words").select(WORD_SELECT, { count: "exact" }).order("plain_text");
    if (q.trim()) query = query.ilike("plain_text", `%${q.trim().replace(/[%_]/g, "")}%`);
    const { data, error, count } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
    fail(error);
    return { words: (data ?? []).map(mapWord), total: count ?? 0 };
  },
  async adminSaveWord(input: WordInput) {
    const row = {
      text: input.text.trim(), syllable_count: input.syllable_count, vowels: input.vowels, category_id: input.category_id,
      age_min: input.age_min, age_max: input.age_max, difficulty: input.difficulty, abstractness: input.abstractness,
      emoji: input.emoji, cultural_warning: input.cultural_warning,
    };
    fail(input.id ? (await sb().from("words").update(row).eq("id", input.id)).error : (await sb().from("words").insert(row)).error);
  },
  async adminDeleteWord(id) { fail((await sb().from("words").delete().eq("id", id)).error); },
  async submitLicense(type: ProfessionalType, license: string) {
    const { error } = await sb().rpc("submit_license", { p_license: license.trim(), p_type: type });
    if (error?.message.includes("invalid license")) throw new AppError("מספר הרישיון לא תקין (3–20 תווים: ספרות, אותיות באנגלית, / או -).", "license");
    fail(error);
  },
  async adminReviewLicense(userId: string, status: VerificationStatus, note?: string) {
    fail((await sb().rpc("review_license", { p_user: userId, p_status: status, p_note: note ?? null })).error, "העדכון נכשל. ודאי שכתבת סיבה לדחייה.");
    void notify({ type: "license", userId });
  },
  async adminSaveCategory(input: CategoryInput) {
    const row = { name_he: input.name_he.trim(), description_he: input.description_he.trim() };
    if (!row.name_he) throw new AppError("חסר שם לקבוצה.", "name");
    const { error } = input.id
      ? await sb().from("phonological_categories").update(row).eq("id", input.id)
      : await sb().from("phonological_categories").insert({ ...row, slug: `custom-${crypto.randomUUID().slice(0, 8)}` });
    categoryCache = null;
    if (error?.code === "23505") throw new AppError("כבר קיימת קבוצה בשם הזה.", "duplicate");
    fail(error);
  },
  async adminDeleteCategory(id) {
    fail((await sb().from("phonological_categories").delete().eq("id", id)).error);
    categoryCache = null;
  },
  async sendTestEmail() { return notify({ type: "test" }); },
  async adminListUsers() {
    const { data, error } = await sb().from("profiles").select("*").order("created_at", { ascending: false });
    fail(error);
    return (data ?? []) as Profile[];
  },
  async adminSetRole(userId, role: Role) { fail((await sb().rpc("set_user_role", { p_user: userId, p_role: role })).error); },
};
