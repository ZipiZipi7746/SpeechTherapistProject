# Going live — checklist (GitHub → Vercel → Supabase → Resend)

Follows the course's "העלאת אפליקציה לאוויר" flow. Tick each box.

## 1. Code on GitHub
- [ ] Repo contains the project (no `.env.local` — it is git-ignored; never commit keys).
- [ ] Work happens on branches; merge to `main` when it works.

## 2. Supabase (production data)
- [ ] SQL run in order: `0001_init.sql`, `seed.sql`, `0002…`, `0003…`, `0004_security_hardening.sql`.
- [ ] Authentication → URL Configuration: **Site URL** = your Vercel/production URL; **Redirect URLs** include `<url>/reset-password`.
- [ ] Authentication → Providers → Email: keep **Confirm email ON** in production.
- [ ] You are admin: `update profiles set role = 'admin' where email = '…';`
- [ ] Storage bucket `word-images` exists (created by 0001).

## 3. Vercel
- [ ] Vercel → Add New Project → import the GitHub repo (Framework: Next.js, no build settings to change).
- [ ] **Settings → Environment Variables** (Production **and** Preview):

| Variable | Value | Public? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | project URL | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key | **NO — secret** |
| `RESEND_API_KEY` | Resend key | **NO — secret** |
| `RESEND_FROM` | `SpeechSearch <noreply@your-domain>` (after domain verification) | no |
| `ADMIN_NOTIFY_EMAIL` | where admin alerts go | no |
| `NEXT_PUBLIC_SITE_URL` | `https://your-site` | yes |
| `NEXT_PUBLIC_CONTACT_EMAIL` | contact address shown in privacy / accessibility pages | yes |

- [ ] After changing variables: **Redeploy** (variables are read at build time).
- [ ] If the site shows "האתר עדיין לא מוגדר", the two Supabase variables are missing. (Demo mode is intentionally disabled in production.)
- [ ] Preview vs Production: every branch/PR gets a Preview URL; `main` is Production. Add the preview URL to Supabase Redirect URLs if you test login there.

## 4. E-mail (Resend)
- [ ] Domain added in Resend and verified (TXT/MX/DKIM records at your DNS provider).
- [ ] `RESEND_FROM` uses that domain. Test: Admin → Users → "שלחי מייל בדיקה".

## 5. Before announcing
- [ ] Privacy policy, terms and accessibility statement read and adjusted (they are drafts/templates); contact e-mail set.
- [ ] Sign up with a fresh e-mail, search, save a set, print, upload a word, approve it as admin.
- [ ] Mobile check (phone): filters sheet, bottom nav, selection button.
- [ ] Optional: custom domain (Vercel → Domains) + update `NEXT_PUBLIC_SITE_URL` and Supabase Site URL.
- [ ] Security: secrets only in Vercel (never in chat / GitHub); rotate any key that was ever pasted somewhere public.
