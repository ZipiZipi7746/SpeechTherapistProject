-- 0003 — bookkeeping so each submission / review sends at most one e-mail.
-- Run in the Supabase SQL editor after 0001 and 0002.
alter table pending_uploads add column if not exists admin_notified_at timestamptz;
alter table pending_uploads add column if not exists result_notified_at timestamptz;
