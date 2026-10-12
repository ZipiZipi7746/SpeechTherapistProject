import seed from "@/data/seed-words.json";
import { normLetter, stripNikud } from "../hebrew";
import type {
  Category, CategoryInput, ProfessionalType, VerificationStatus, PendingUpload, Profile, Role, SearchFilters, SetDetail, SetSummary, UploadInput, Word, WordImage, WordInput,
} from "../types";
import { matchesFilters } from "./match";
import { AppError, type Repo } from "./repo";

/* Demo mode: everything lives in localStorage. NOT secure — for evaluation only. */

const KEY = "speechsearch_demo_v1";
const GUEST_LIMIT = 5;

interface DemoUser extends Profile { password: string }
interface DemoSet { id: string; owner_id: string; name: string; child_name: string | null; color: string; updated_at: string; word_ids: string[] }
interface DemoUpload extends UploadInput {
  id: string; submitted_by: string; image_url: string | null; status: "pending" | "approved" | "rejected";
  rejection_reason: string | null; created_at: string;
}
interface State {
  users: DemoUser[]; sessionUserId: string | null; words: Word[]; sets: DemoSet[]; uploads: DemoUpload[]; categories?: Category[];
}

const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const now = () => new Date().toISOString();

const defaultCategories: Category[] = seed.categories.map((c) => ({ id: `cat-${c.slug}`, ...c }));
const catBySlug = (slug: string) => defaultCategories.find((c) => c.slug === slug) ?? null;

function seedWords(): Word[] {
  return seed.words.map((w) => ({
    id: w.slug, text: w.text, plain_text: w.plain_text, syllable_count: w.syllable_count, letter_count: w.letter_count,
    vowels: w.vowels as Word["vowels"], primary_phoneme: w.primary_phoneme, category_id: `cat-${w.category}`,
    category: catBySlug(w.category), age_min: w.age_min, age_max: w.age_max, difficulty: w.difficulty as Word["difficulty"],
    abstractness: w.abstractness as Word["abstractness"], emoji: w.emoji, cultural_warning: w.cultural_warning,
    images: w.image_kinds.map((k, i): WordImage => ({ id: `${w.slug}-img${i}`, kind: k as WordImage["kind"], url: null, cultural_warning: false })),
  }));
}

function initialState(): State {
  const t = now();
  return {
    users: [
      { id: "u-demo", email: "demo@speechsearch.app", password: "demo1234", display_name: "מיכל", role: "clinician", professional_type: "slp", license_number: "123456", verification_status: "verified", verification_note: null, created_at: t },
      { id: "u-admin", email: "admin@speechsearch.app", password: "admin1234", display_name: "מנהלת", role: "admin", professional_type: "other", license_number: null, verification_status: "none", verification_note: null, created_at: t },
    ],
    sessionUserId: null, words: seedWords(), sets: [], uploads: [],
  };
}

let cache: State | null = null;
const listeners = new Set<(p: Profile | null) => void>();

function load(): State {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as State;
      cache.users.forEach((u) => { u.professional_type ??= "other"; u.license_number ??= null; u.verification_status ??= "none"; u.verification_note ??= null; });
      return cache;
    }
  } catch { /* fall through */ }
  cache = initialState();
  return cache;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); }
  catch { throw new AppError("אין מקום לשמירה בדפדפן (מצב הדגמה). נסי למחוק תמונות שהועלו.", "quota"); }
}
/** Categories are editable by admins, so they live in the persisted state. */
const cats = (): Category[] => (load().categories ??= defaultCategories.map((c) => ({ ...c })));
/** Words with their category refreshed from the (editable) category list. */
const allWords = (): Word[] => { const c = cats(); return load().words.map((w) => ({ ...w, category: c.find((x) => x.id === w.category_id) ?? null })); };
const strip = ({ password: _p, ...rest }: DemoUser): Profile => rest;
const me = (): DemoUser | null => { const s = load(); return s.users.find((u) => u.id === s.sessionUserId) ?? null; };
const requireMe = () => me() ?? (() => { throw new AppError("צריך להתחבר כדי לבצע פעולה זו.", "auth"); })();
const requireAdmin = () => { const u = requireMe(); if (u.role !== "admin") throw new AppError("אין הרשאה לפעולה זו.", "forbidden"); return u; };
const notify = () => { const p = me(); listeners.forEach((l) => l(p ? strip(p) : null)); };

function toUpload(u: DemoUpload): PendingUpload {
  const s = load();
  return { ...u, category: cats().find((c) => c.id === u.category_id) ?? null, submitter_name: s.users.find((x) => x.id === u.submitted_by)?.display_name };
}

async function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(b); });
}

export const demoRepo: Repo = {
  mode: "demo",

  async getProfile() { const u = me(); return u ? strip(u) : null; },
  onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
  async signIn(email, password) {
    const s = load();
    const u = s.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
    if (!u) throw new AppError("המייל או הסיסמה לא מתאימים. רוצי לאפס?", "bad_credentials");
    s.sessionUserId = u.id; save(); notify();
  },
  async signUp(email, password, displayName, pro) {
    const s = load();
    if (s.users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) throw new AppError("כתובת המייל הזו כבר רשומה. אולי להתחבר?", "exists");
    const u: DemoUser = { id: uid(), email: email.trim(), password, display_name: displayName.trim() || email.split("@")[0], role: "clinician", created_at: now(),
      professional_type: pro?.type ?? "other", license_number: pro?.type === "slp" && pro.license.trim() ? pro.license.trim() : null,
      verification_status: pro?.type === "slp" && pro.license.trim() ? "pending" : "none", verification_note: null };
    s.users.push(u); s.sessionUserId = u.id; save(); notify();
    return { needsConfirmation: false };
  },
  async signOut() { const s = load(); s.sessionUserId = null; save(); notify(); },
  async resetPassword() { /* demo: no email is sent */ },
  async updatePassword(password) { const u = requireMe(); u.password = password; save(); },
  async submitLicense(type: ProfessionalType, license: string) {
    const u = requireMe(); const lic = license.trim();
    if (type === "slp" && !/^[0-9A-Za-z/-]{3,20}$/.test(lic)) throw new AppError("מספר הרישיון לא תקין (3–20 תווים: ספרות, אותיות באנגלית, / או -).", "license");
    u.professional_type = type; u.license_number = type === "slp" ? lic : null;
    u.verification_status = type === "slp" ? "pending" : "none"; u.verification_note = null; save(); notify();
  },
  async adminReviewLicense(userId: string, status: VerificationStatus, note?: string) {
    requireAdmin(); const u = load().users.find((x) => x.id === userId); if (!u) return;
    if (status === "rejected" && !note?.trim()) throw new AppError("צריך לכתוב סיבה קצרה לדחייה.", "reason");
    u.verification_status = status; u.verification_note = status === "rejected" ? note!.trim() : null; save();
  },
  async updateDisplayName(name) { const u = requireMe(); u.display_name = name.trim(); save(); notify(); },

  async listCategories() { return cats(); },
  async searchWords(f, page, pageSize) {
    requireMe();
    const all = allWords().filter((w) => matchesFilters(w, f, cats())).sort((a, b) => a.plain_text.localeCompare(b.plain_text, "he"));
    return { words: all.slice(page * pageSize, (page + 1) * pageSize), total: all.length };
  },
  async countWords(f) { requireMe(); return allWords().filter((w) => matchesFilters(w, f, cats())).length; },
  async getWord(id) { requireMe(); return allWords().find((w) => w.id === id) ?? null; },
  async guestSearch(q) {
    const s = load();
    const q2 = stripNikud(q);
    const hits = allWords().filter((w) => !q2 || w.plain_text.includes(q2)).sort((a, b) => a.plain_text.localeCompare(b.plain_text, "he"));
    return { words: hits.slice(0, GUEST_LIMIT).map((w) => ({ ...w, images: [] })), total: hits.length, libraryTotal: s.words.length };
  },

  async listSets() {
    const u = requireMe();
    return load().sets.filter((s) => s.owner_id === u.id).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((s): SetSummary => ({ id: s.id, name: s.name, child_name: s.child_name, color: s.color, updated_at: s.updated_at, word_count: s.word_ids.length }));
  },
  async getSet(id) {
    const u = requireMe(); const st = load();
    const s = st.sets.find((x) => x.id === id && x.owner_id === u.id);
    if (!s) return null;
    return {
      id: s.id, name: s.name, child_name: s.child_name, color: s.color, updated_at: s.updated_at, word_count: s.word_ids.length,
      words: s.word_ids.map((wid) => allWords().find((w) => w.id === wid)).filter((w): w is Word => !!w),
    } satisfies SetDetail;
  },
  async createSet({ name, childName, color, wordIds }) {
    const u = requireMe();
    const s: DemoSet = { id: uid(), owner_id: u.id, name: name.trim(), child_name: childName?.trim() || null, color: color ?? "purple", updated_at: now(), word_ids: [...new Set(wordIds)] };
    load().sets.push(s); save(); return s.id;
  },
  async addWordsToSet(setId, wordIds) {
    const u = requireMe();
    const s = load().sets.find((x) => x.id === setId && x.owner_id === u.id);
    if (!s) throw new AppError("הסט לא נמצא.", "not_found");
    const fresh = wordIds.filter((id) => !s.word_ids.includes(id));
    s.word_ids.push(...fresh); s.updated_at = now(); save(); return fresh.length;
  },
  async removeWordFromSet(setId, wordId) {
    const u = requireMe(); const s = load().sets.find((x) => x.id === setId && x.owner_id === u.id);
    if (!s) return; s.word_ids = s.word_ids.filter((id) => id !== wordId); s.updated_at = now(); save();
  },
  async updateSet(id, patch) {
    const u = requireMe(); const s = load().sets.find((x) => x.id === id && x.owner_id === u.id);
    if (!s) throw new AppError("הסט לא נמצא.", "not_found");
    if (patch.name !== undefined) s.name = patch.name.trim();
    if (patch.childName !== undefined) s.child_name = patch.childName?.trim() || null;
    if (patch.color) s.color = patch.color;
    s.updated_at = now(); save();
  },
  async deleteSet(id) { const u = requireMe(); const st = load(); st.sets = st.sets.filter((s) => !(s.id === id && s.owner_id === u.id)); save(); },

  async submitUpload(input, image) {
    const u = requireMe();
    if (u.role !== "admin" && u.verification_status !== "verified") throw new AppError("העלאת מילים פתוחה לקלינאיות מאומתות בלבד.", "forbidden");
    const image_url = image ? await blobToDataUrl(image) : null;
    load().uploads.push({ ...input, id: uid(), submitted_by: u.id, image_url, status: "pending", rejection_reason: null, created_at: now() });
    save();
  },
  async listMyUploads() {
    const u = requireMe();
    return load().uploads.filter((x) => x.submitted_by === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(toUpload);
  },
  async resubmitUpload(id, input, image) {
    const u = requireMe(); const up = load().uploads.find((x) => x.id === id && x.submitted_by === u.id);
    if (!up || up.status !== "rejected") throw new AppError("אפשר לתקן ולהגיש מחדש רק מילה שנדחתה.", "bad_state");
    Object.assign(up, input, { status: "pending", rejection_reason: null });
    if (image) up.image_url = await blobToDataUrl(image);
    save();
  },
  async deleteUpload(id) {
    const u = requireMe(); const st = load();
    st.uploads = st.uploads.filter((x) => !(x.id === id && x.submitted_by === u.id && x.status !== "approved")); save();
  },

  async listPendingUploads() { requireAdmin(); return load().uploads.filter((x) => x.status === "pending").sort((a, b) => a.created_at.localeCompare(b.created_at)).map(toUpload); },
  async pendingCount() { const u = me(); return u?.role === "admin" ? load().uploads.filter((x) => x.status === "pending").length + load().users.filter((x) => x.verification_status === "pending").length : 0; },
  async approveUpload(id) {
    requireAdmin(); const st = load(); const up = st.uploads.find((x) => x.id === id);
    if (!up || up.status === "approved") throw new AppError("הבקשה לא נמצאה או שכבר אושרה.", "bad_state");
    const plain = stripNikud(up.text);
    const wid = uid();
    st.words.push({
      id: wid, text: up.text, plain_text: plain, syllable_count: up.syllable_count, letter_count: [...plain].length, vowels: up.vowels,
      primary_phoneme: up.primary_phoneme ?? normLetter(plain[0] ?? ""), category_id: up.category_id,
      category: cats().find((c) => c.id === up.category_id) ?? null, age_min: up.age_min, age_max: up.age_max,
      difficulty: up.difficulty, abstractness: up.abstractness, emoji: up.image_url ? null : "🖼️", cultural_warning: false,
      images: [{ id: uid(), kind: up.image_kind, url: up.image_url, cultural_warning: !!up.cultural_warning }],
    });
    up.status = "approved"; up.rejection_reason = null; save();
  },
  async rejectUpload(id, reason) {
    requireAdmin(); if (!reason.trim()) throw new AppError("צריך לכתוב הסבר קצר לדחייה.", "reason");
    const up = load().uploads.find((x) => x.id === id); if (!up) return;
    up.status = "rejected"; up.rejection_reason = reason.trim(); save();
  },
  async adminListWords(q, page, pageSize) {
    requireAdmin();
    const f = { q, phonemes: [], position: null, forbidden: [], syllables: [], letters: [], vowels: [], categories: [], age: null, difficulty: [], abstractness: [], imageKinds: [] } satisfies SearchFilters;
    const all = allWords().filter((w) => matchesFilters(w, f, cats())).sort((a, b) => a.plain_text.localeCompare(b.plain_text, "he"));
    return { words: all.slice(page * pageSize, (page + 1) * pageSize), total: all.length };
  },
  async adminSaveWord(input: WordInput) {
    requireAdmin(); const st = load();
    const plain = stripNikud(input.text);
    const patch = {
      text: input.text, plain_text: plain, letter_count: [...plain].length, syllable_count: input.syllable_count, vowels: input.vowels,
      category_id: input.category_id, category: cats().find((c) => c.id === input.category_id) ?? null, age_min: input.age_min,
      age_max: input.age_max, difficulty: input.difficulty, abstractness: input.abstractness, emoji: input.emoji, cultural_warning: input.cultural_warning,
    };
    const existing = input.id ? st.words.find((w) => w.id === input.id) : null;
    if (existing) Object.assign(existing, patch);
    else st.words.push({ id: uid(), primary_phoneme: normLetter(plain[0] ?? ""), images: [], ...patch });
    save();
  },
  async adminDeleteWord(id) { requireAdmin(); const st = load(); st.words = st.words.filter((w) => w.id !== id); st.sets.forEach((s) => (s.word_ids = s.word_ids.filter((x) => x !== id))); save(); },
  async adminSaveCategory(input: CategoryInput) {
    requireAdmin(); const list = cats();
    if (!input.name_he.trim()) throw new AppError("חסר שם לקבוצה.", "name");
    const dup = list.find((c) => c.name_he.trim() === input.name_he.trim() && c.id !== input.id);
    if (dup) throw new AppError("כבר קיימת קבוצה בשם הזה.", "duplicate");
    const existing = input.id ? list.find((c) => c.id === input.id) : null;
    if (existing) { existing.name_he = input.name_he.trim(); existing.description_he = input.description_he.trim(); }
    else list.push({ id: uid(), slug: `custom-${uid().slice(0, 8)}`, name_he: input.name_he.trim(), description_he: input.description_he.trim() });
    save();
  },
  async adminDeleteCategory(id) {
    requireAdmin(); const st = load();
    st.categories = cats().filter((c) => c.id !== id);
    st.words.forEach((w) => { if (w.category_id === id) { w.category_id = null; w.category = null; } });
    st.uploads.forEach((u) => { if (u.category_id === id) u.category_id = null; });
    save();
  },
  async sendTestEmail() { requireAdmin(); return { sent: false, reason: "demo mode: no e-mail is sent" }; },
  async adminListUsers() { requireAdmin(); return load().users.map(strip); },
  async adminSetRole(userId, role: Role) {
    const a = requireAdmin(); if (userId === a.id) throw new AppError("אי אפשר לשנות את התפקיד של עצמך.", "self");
    const u = load().users.find((x) => x.id === userId); if (u) { u.role = role; save(); }
  },
};
