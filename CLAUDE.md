# SpeechSearch — project guide for AI coding agents

Hebrew (RTL) Next.js 15 / Tailwind 3 / Supabase app for speech-language pathologists. Spec: `docs/` and README.

## Rules
- UI text is Hebrew, addressed in feminine ("את", "נסי"). Use Tailwind **logical** utilities (`ms-`, `pe-`, `start-`, `end-`), never `left/right`.
- All data access goes through `lib/data` (`repo`) — never call Supabase directly from components. Every new repo method needs a **Supabase** and a **demo** implementation.
- Security lives in Postgres RLS (`supabase/migrations`). Client guards are UX only. New table ⇒ enable RLS + policies in a new numbered migration (never edit applied migrations).
- Never use `NEXT_PUBLIC_` for secrets. Service-role / Resend keys exist only in server code (`app/api/*`).
- Never render HTML from data (`dangerouslySetInnerHTML`); validate redirects with `lib/safeRedirect.ts`.
- UX principles from the spec: one strong primary action per card/screen, secondary actions as quiet icons, destructive actions behind a confirm modal, toasts 3 s, zero-results = friendly state with removal chips.
- Cancel buttons sit to the left of the primary button (in RTL DOM order: primary first).

## Checks before finishing
`npm run typecheck && npm run lint && npm run build`
