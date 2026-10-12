-- 0005 — professional verification: clinicians register with their Ministry of Health license number,
-- an admin verifies it, and only verified clinicians can contribute (upload) words.
-- Run after 0001-0004. Existing users start as "none"; promote the ones you trust with review_license() or the admin screen.

do $$ begin create type verification_status as enum ('none', 'pending', 'verified', 'rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type professional_type as enum ('slp', 'student', 'other'); exception when duplicate_object then null; end $$;

alter table profiles add column if not exists professional_type professional_type not null default 'other';
alter table profiles add column if not exists license_number text;
alter table profiles add column if not exists verification_status verification_status not null default 'none';
alter table profiles add column if not exists verification_note text;
alter table profiles add column if not exists verified_at timestamptz;

-- Users can read their own row (and admins all rows) via the existing policy, but can only UPDATE display_name
-- (column grant from 0001) — so nobody can verify themselves. Changes go through the two functions below.

create or replace function clean_license(t text) returns text
language sql immutable as $$
  select case when t ~ '^[0-9A-Za-z/-]{3,20}$' then t else null end
$$;

-- New sign-ups: store the professional type and license number given at registration.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ptype professional_type := case when new.raw_user_meta_data ->> 'professional_type' in ('slp', 'student', 'other')
                                   then (new.raw_user_meta_data ->> 'professional_type')::professional_type else 'other' end;
  lic text := clean_license(trim(coalesce(new.raw_user_meta_data ->> 'license_number', '')));
begin
  insert into profiles (id, email, display_name, professional_type, license_number, verification_status)
  values (
    new.id, new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    ptype,
    case when ptype = 'slp' then lic else null end,
    case when ptype = 'slp' and lic is not null then 'pending'::verification_status else 'none'::verification_status end
  );
  return new;
end $$;

-- A signed-in user submits / changes their own license; it goes (back) to "pending".
create or replace function submit_license(p_license text, p_type professional_type) returns void
language plpgsql security definer set search_path = public as $$
declare lic text := clean_license(trim(coalesce(p_license, '')));
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_type = 'slp' and lic is null then raise exception 'invalid license number'; end if;
  update profiles set
    professional_type = p_type,
    license_number = case when p_type = 'slp' then lic else null end,
    verification_status = case when p_type = 'slp' then 'pending'::verification_status else 'none'::verification_status end,
    verification_note = null, verified_at = null
  where id = auth.uid();
end $$;

-- Admin decision. A rejection needs a short reason that the user will see.
create or replace function review_license(p_user uuid, p_status verification_status, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_status not in ('verified', 'rejected', 'pending') then raise exception 'bad status'; end if;
  if p_status = 'rejected' and (p_note is null or char_length(trim(p_note)) = 0) then raise exception 'reason required'; end if;
  update profiles set
    verification_status = p_status,
    verification_note = case when p_status = 'rejected' then trim(p_note) else null end,
    verified_at = case when p_status = 'verified' then now() else null end
  where id = p_user;
end $$;

revoke execute on function submit_license(text, professional_type), review_license(uuid, verification_status, text) from public, anon;
grant execute on function submit_license(text, professional_type), review_license(uuid, verification_status, text) to authenticated;

-- Only verified clinicians (or admins) may submit new words to the community library.
drop policy if exists uploads_insert on pending_uploads;
create policy uploads_insert on pending_uploads for insert to authenticated
  with check (
    submitted_by = auth.uid() and status = 'pending'
    and (is_admin() or exists (select 1 from profiles p where p.id = auth.uid() and p.verification_status = 'verified'))
  );
