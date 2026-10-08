# SpeechSearch — מאגר מילים לקלינאיות תקשורת

Hebrew (RTL) web app for speech-language pathologists: phonological word search, culturally-appropriate pictures,
therapy sets you can print, and a moderated community upload flow. Built from the UX specification
(`docs/EXECUTION_PLAN.md` lists the build plan).

**Stack:** Next.js 15 (App Router) · Tailwind 3 · lucide-react · Supabase (Auth, Postgres, Storage) · Resend · Vercel

## Quick start (demo mode — no backend needed)

```bash
npm install
npm run dev        # http://localhost:3000
```

Without Supabase env vars the app runs in **demo mode**: 142 seed words, accounts and sets stored in the browser's
`localStorage`. Demo logins (shown on the login page): `demo@speechsearch.app / demo1234` (clinician),
`admin@speechsearch.app / admin1234` (admin). Demo mode is for evaluation only — it is not secure.

## Connect Supabase

1. Create a Supabase project.
2. SQL editor → run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` → `.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Auth → URL configuration: add your site URL and `<site>/reset-password` to the redirect list.
5. Sign up in the app, then promote yourself: `update profiles set role = 'admin' where email = 'you@example.com';`
6. Run `supabase/migrations/0002_cultural_warning_and_categories.sql`, `0003_email_notifications.sql` and `0004_security_hardening.sql` as well.
7. (Optional) **E-mail notifications via Resend** — see below.

## E-mail notifications (Resend)

Sent: admin is notified of each new submission; the submitter is told when a word is approved or rejected (with the reason).

1. Create a free account at https://resend.com → **API Keys** → create a key.
2. Put these in `.env.local` (all server-only):
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM="SpeechSearch <onboarding@resend.dev>"
   ADMIN_NOTIFY_EMAIL=the e-mail you registered to Resend with
   SUPABASE_SERVICE_ROLE_KEY=...   (Supabase → Project Settings → API Keys → the *secret* / service_role key)
   ```
3. Restart `npm run dev`, sign in as admin → **ממשק ניהול → משתמשים → שלחי מייל בדיקה**. The toast tells you what is missing.

**Important limits:** until you verify your own domain in Resend (Domains → add DNS records) the sender must be
`onboarding@resend.dev` and Resend only delivers to *your own account e-mail*. So admin alerts work immediately, but e-mails to
other clinicians arrive only after domain verification (then set `RESEND_FROM="SpeechSearch <noreply@your-domain>"`).
Behind a filter such as NetFree, also allow `api.resend.com` — the call is made from the Next.js server.
Never expose the service-role key: it bypasses all security rules (do not prefix it with `NEXT_PUBLIC_`).

## Deploy to Vercel

Full checklist: [`docs/DEPLOY.md`](docs/DEPLOY.md). Summary:

Import the repo, set the same env vars (Production + Preview), deploy. No `vercel.json` needed.
`NEXT_PUBLIC_SITE_URL` (optional) sets the links used in notification emails.

## How the spec maps to the code

| Spec | Where |
|---|---|
| Roles: guest / clinician / admin | `profiles.role`, RLS in `0001_init.sql`, `RequireAuth`, hidden `/admin` area |
| Guest: basic search, 5 results | `guest_search()` RPC enforces the limit **in the database**; `/search` guest mode |
| Chips filters + progressive disclosure | `components/search/FilterPanel.tsx` ("פילטרים נוספים") |
| All 11 filters | phoneme, forbidden letters, position, syllables, letters, vowel type, phonological group, age, difficulty, abstractness, image type → `search_words()` |
| Active-filter chips, zero-results recovery | `ActiveFilters.tsx`, `ZeroResults.tsx` (shows how many results each removal gives) |
| Sticky selection bar / mobile FAB | `components/words/SelectionBar.tsx` |
| 4-step Stepper | `components/ui/Stepper.tsx` on search, set and print screens |
| Sets, delete confirm modal, toasts | `app/sets/*`, `ConfirmModal`, `ToastProvider` (3 s) |
| Print / PDF | `/sets/[id]/print` — settings + live preview; "הורידי להדפסה" opens the browser print dialog (Save as PDF). Mobile shows "send to e-mail" instead |
| Community upload + moderation | `/upload` (validation, image resize), `pending_uploads`, `/admin` (approve / reject with reason), `approve_upload()` RPC |
| Mobile: bottom sheet, 2-col grid, bottom nav | `Modal sheet`, `BottomNav`, responsive grid |

## Architecture notes

- **One data interface** (`lib/data/repo.ts`) with two implementations: Supabase (`supabase.ts`) and demo (`demo.ts`).
  The demo's `matchesFilters` mirrors the SQL `search_words` function.
- **Security lives in the database** (Row Level Security): sets are private to their owner (admins can't read them),
  only admins can approve content or change roles, guests can't read the library.
  Client route guards are UX only.
- Phonemes are indexed per letter and position by a trigger (`word_phonemes`), so phoneme/position filters are plain SQL.
- Filters live in the URL (`/search?ph=ש&pos=start&age=4`) — shareable, back-button friendly, used for "recent searches".

## Known limitations / next steps

- Phonemes are approximated by Hebrew letters (e.g. ק and כּ are different letters, not merged by sound).
- Seed images are emoji placeholders (the image-type filter works on them); real images come through uploads.
- "Recent searches" are stored per device (localStorage), not in the account.
- Guests can't open word pages, but image URLs of the 5 visible results are public — Storage is a public bucket.
- Roadmap (spec v2): AI search, worksheets, shared sets, voice search, PWA/offline.

## Scripts

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm run seed:generate`
(regenerates `data/seed-words.json` and `supabase/seed.sql` from `supabase/seed/words.txt`).
