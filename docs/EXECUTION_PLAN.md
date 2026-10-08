# SpeechSearch — Execution Plan

1. **Setup** — Next.js 15 (App Router), Tailwind 3 with RTL logical utilities, lucide-react, Heebo font, Supabase client with demo-mode fallback.
2. **Database & Supabase** — `supabase/migrations/0001_init.sql`: profiles, phonological_categories, words, word_phonemes, word_images, sets, set_items, pending_uploads; triggers; RPCs (`search_words`, `guest_search`, `approve_upload`, `reject_upload`, `set_user_role`); RLS; `word-images` storage bucket. `supabase/seed.sql` generated from `supabase/seed/words.txt`.
3. **Auth & roles** — Guest / Clinician / Admin; login, signup, reset; client guards backed by RLS; hidden admin area.
4. **UI kit & layouts** — Navbar, Bottom Nav, Bottom Sheet, Chips, Modal, Toast, Stepper, Word Card, Empty State, Tooltip.
5. **Features** — search (URL-synced filters, progressive disclosure, zero-result recovery), word detail, sets (CRUD + print preview), community upload + moderation queue.
6. **Polish & deploy** — toasts, error/404, empty states, a11y, README, Vercel config.
