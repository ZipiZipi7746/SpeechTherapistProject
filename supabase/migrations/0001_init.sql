-- SpeechSearch — initial schema, RLS, RPCs and storage
-- Run in the Supabase SQL editor (or `supabase db push`), then run supabase/seed.sql.

create extension if not exists "pgcrypto";

-- ───────────────────────── Enums ─────────────────────────
create type user_role as enum ('clinician', 'admin');
create type difficulty_level as enum ('easy', 'medium', 'hard');
create type abstractness_level as enum ('concrete', 'abstract');
create type image_kind as enum ('color', 'bw', 'illustration');
create type word_position as enum ('start', 'middle', 'end');
create type upload_status as enum ('pending', 'approved', 'rejected');

-- ───────────────────────── Helpers ─────────────────────────
create or replace function strip_nikud(t text) returns text
language sql immutable as $$
  select regexp_replace(t, '[֑-ׇ׳]', '', 'g')
$$;

create or replace function norm_letter(c text) returns text
language sql immutable as $$
  select case c when 'ך' then 'כ' when 'ם' then 'מ' when 'ן' then 'נ' when 'ף' then 'פ' when 'ץ' then 'צ' else c end
$$;

create or replace function touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ───────────────────────── Profiles ─────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default '',
  role user_role not null default 'clinician',
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, display_name)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ───────────────────────── Categories ─────────────────────────
create table phonological_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_he text not null,
  description_he text not null default ''
);

-- ───────────────────────── Words ─────────────────────────
create table words (
  id uuid primary key default gen_random_uuid(),
  text text not null,                       -- with nikud
  plain_text text not null default '',      -- derived
  syllable_count smallint not null check (syllable_count between 1 and 8),
  letter_count smallint not null default 0, -- derived
  vowels text[] not null default '{}',      -- subset of a,e,i,o,u
  primary_phoneme text,
  category_id uuid references phonological_categories (id) on delete set null,
  age_min smallint not null default 3 check (age_min between 2 and 12),
  age_max smallint not null default 7 check (age_max between 2 and 12),
  difficulty difficulty_level not null default 'easy',
  abstractness abstractness_level not null default 'concrete',
  emoji text,                               -- fallback visual when no image exists
  cultural_warning boolean not null default false,
  submitted_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (age_min <= age_max)
);
create index words_plain_text_idx on words (plain_text);
create index words_category_idx on words (category_id);

-- One row per (word, letter, position) — powers phoneme/position filters.
create table word_phonemes (
  word_id uuid not null references words (id) on delete cascade,
  phoneme text not null,
  position word_position not null,
  primary key (word_id, phoneme, position)
);
create index word_phonemes_lookup_idx on word_phonemes (phoneme, position);

create or replace function words_derive() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.plain_text := strip_nikud(new.text);
  new.letter_count := char_length(new.plain_text);
  if new.primary_phoneme is null and new.letter_count > 0 then
    new.primary_phoneme := norm_letter(substr(new.plain_text, 1, 1));
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger words_derive_biu before insert or update of text on words
  for each row execute function words_derive();

create or replace function words_rebuild_phonemes() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n int := char_length(new.plain_text);
  i int;
  pos word_position;
begin
  delete from word_phonemes where word_id = new.id;
  for i in 1 .. n loop
    pos := case when i = 1 then 'start' when i = n then 'end' else 'middle' end;
    insert into word_phonemes (word_id, phoneme, position)
    values (new.id, norm_letter(substr(new.plain_text, i, 1)), pos)
    on conflict do nothing;
  end loop;
  return null;
end $$;

create trigger words_phonemes_aiu after insert or update of text on words
  for each row execute function words_rebuild_phonemes();

create table word_images (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references words (id) on delete cascade,
  kind image_kind not null default 'illustration',
  url text,                                  -- public storage URL; null => emoji placeholder
  cultural_warning boolean not null default false,
  created_at timestamptz not null default now()
);
create index word_images_word_idx on word_images (word_id);

-- ───────────────────────── Sets ─────────────────────────
create table sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  child_name text,
  color text not null default 'purple',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sets_owner_idx on sets (owner_id, updated_at desc);
create trigger sets_touch before update on sets for each row execute function touch_updated_at();

create table set_items (
  set_id uuid not null references sets (id) on delete cascade,
  word_id uuid not null references words (id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now(),
  primary key (set_id, word_id)
);

-- ───────────────────────── Community submissions ─────────────────────────
create table pending_uploads (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references profiles (id) on delete cascade default auth.uid(),
  text text not null,
  syllable_count smallint not null check (syllable_count between 1 and 8),
  vowels text[] not null default '{}',
  primary_phoneme text,
  category_id uuid references phonological_categories (id) on delete set null,
  age_min smallint not null default 3,
  age_max smallint not null default 7,
  difficulty difficulty_level not null default 'easy',
  abstractness abstractness_level not null default 'concrete',
  image_path text,                           -- path inside bucket word-images
  image_url text,
  image_kind image_kind not null default 'illustration',
  status upload_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (age_min <= age_max)
);
create index pending_uploads_status_idx on pending_uploads (status, created_at);
create trigger pending_touch before update on pending_uploads for each row execute function touch_updated_at();

-- ───────────────────────── Search ─────────────────────────
-- Clinician search. SECURITY INVOKER so RLS applies. Syllables bucket 4 means 4+, letters bucket 7 means 7+.
create or replace function search_words(
  p_q text default null,
  p_phonemes text[] default null,
  p_position word_position default null,
  p_forbidden text[] default null,
  p_syllables int[] default null,
  p_letters int[] default null,
  p_vowels text[] default null,
  p_categories uuid[] default null,
  p_age int default null,
  p_difficulty difficulty_level[] default null,
  p_abstractness abstractness_level[] default null,
  p_image_kinds image_kind[] default null
) returns setof words
language sql stable as $$
  select w.* from words w
  where (p_q is null or p_q = '' or w.plain_text ilike '%' || replace(replace(strip_nikud(p_q), '%', ''), '_', '') || '%'
         or exists (select 1 from phonological_categories c where c.id = w.category_id and c.name_he ilike '%' || replace(replace(p_q, '%', ''), '_', '') || '%'))
    and (p_phonemes is null or exists (
          select 1 from word_phonemes wp
          where wp.word_id = w.id and wp.phoneme = any (p_phonemes) and (p_position is null or wp.position = p_position)))
    and (p_forbidden is null or not exists (
          select 1 from word_phonemes wp where wp.word_id = w.id and wp.phoneme = any (p_forbidden)))
    and (p_syllables is null or w.syllable_count = any (p_syllables) or (4 = any (p_syllables) and w.syllable_count >= 4))
    and (p_letters is null or w.letter_count = any (p_letters) or (7 = any (p_letters) and w.letter_count >= 7))
    and (p_vowels is null or w.vowels && p_vowels)
    and (p_categories is null or w.category_id = any (p_categories))
    and (p_age is null or (w.age_min <= p_age and w.age_max >= p_age))
    and (p_difficulty is null or w.difficulty = any (p_difficulty))
    and (p_abstractness is null or w.abstractness = any (p_abstractness))
    and (p_image_kinds is null or exists (select 1 from word_images i where i.word_id = w.id and i.kind = any (p_image_kinds)))
$$;

-- Guests: plain text search only, hard limit of 5 rows, no filters.
create or replace function guest_search(p_q text default null)
returns table (id uuid, text text, plain_text text, syllable_count smallint, emoji text, category_name text, image_url text)
language sql stable security definer set search_path = public as $$
  select w.id, w.text, w.plain_text, w.syllable_count, w.emoji, c.name_he,
         (select i.url from word_images i where i.word_id = w.id and i.url is not null order by i.created_at limit 1)
  from words w left join phonological_categories c on c.id = w.category_id
  where p_q is null or p_q = '' or w.plain_text ilike '%' || replace(replace(strip_nikud(p_q), '%', ''), '_', '') || '%'
  order by w.plain_text
  limit 5
$$;

create or replace function guest_total() returns bigint
language sql stable security definer set search_path = public as $$ select count(*) from words $$;

-- ───────────────────────── Moderation RPCs ─────────────────────────
create or replace function approve_upload(p_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare u pending_uploads; new_word uuid;
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into u from pending_uploads where id = p_id for update;
  if not found then raise exception 'not found'; end if;
  if u.status = 'approved' then raise exception 'already approved'; end if;

  insert into words (text, syllable_count, vowels, primary_phoneme, category_id, age_min, age_max, difficulty, abstractness, submitted_by)
  values (u.text, u.syllable_count, u.vowels, u.primary_phoneme, u.category_id, u.age_min, u.age_max, u.difficulty, u.abstractness, u.submitted_by)
  returning id into new_word;

  insert into word_images (word_id, kind, url) values (new_word, u.image_kind, u.image_url);

  update pending_uploads set status = 'approved', rejection_reason = null, reviewed_by = auth.uid(), reviewed_at = now() where id = p_id;
  return new_word;
end $$;

create or replace function reject_upload(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_reason is null or char_length(trim(p_reason)) = 0 then raise exception 'reason required'; end if;
  update pending_uploads set status = 'rejected', rejection_reason = trim(p_reason), reviewed_by = auth.uid(), reviewed_at = now() where id = p_id;
end $$;

create or replace function set_user_role(p_user uuid, p_role user_role) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'cannot change own role'; end if;
  update profiles set role = p_role where id = p_user;
end $$;

-- ───────────────────────── Row Level Security ─────────────────────────
alter table profiles enable row level security;
alter table phonological_categories enable row level security;
alter table words enable row level security;
alter table word_phonemes enable row level security;
alter table word_images enable row level security;
alter table sets enable row level security;
alter table set_items enable row level security;
alter table pending_uploads enable row level security;

-- profiles: own row or admin. Users may only edit display_name (column grant below).
create policy profiles_select on profiles for select to authenticated using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on profiles from authenticated;
grant update (display_name) on profiles to authenticated;

-- categories: public read, admin write
create policy categories_read on phonological_categories for select using (true);
create policy categories_admin on phonological_categories for all to authenticated using (is_admin()) with check (is_admin());

-- words / phonemes / images: full library for signed-in users only; admins edit master DB
create policy words_read on words for select to authenticated using (true);
create policy words_admin on words for all to authenticated using (is_admin()) with check (is_admin());
create policy phonemes_read on word_phonemes for select to authenticated using (true);
create policy images_read on word_images for select to authenticated using (true);
create policy images_admin on word_images for all to authenticated using (is_admin()) with check (is_admin());

-- sets: strictly private to the owner — admins get no special access
create policy sets_owner on sets for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy set_items_owner on set_items for all to authenticated
  using (exists (select 1 from sets s where s.id = set_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from sets s where s.id = set_id and s.owner_id = auth.uid()));

-- pending uploads: submit as yourself; read own (admin reads all); re-submit own rejected items; delete own non-approved
create policy uploads_insert on pending_uploads for insert to authenticated
  with check (submitted_by = auth.uid() and status = 'pending');
create policy uploads_select on pending_uploads for select to authenticated
  using (submitted_by = auth.uid() or is_admin());
create policy uploads_resubmit on pending_uploads for update to authenticated
  using (submitted_by = auth.uid() and status = 'rejected')
  with check (submitted_by = auth.uid() and status = 'pending');
create policy uploads_delete on pending_uploads for delete to authenticated
  using ((submitted_by = auth.uid() and status <> 'approved') or is_admin());

-- Function execution: guests may only call guest_search / guest_total
revoke execute on function approve_upload(uuid), reject_upload(uuid, text), set_user_role(uuid, user_role) from public, anon;
grant execute on function approve_upload(uuid), reject_upload(uuid, text), set_user_role(uuid, user_role) to authenticated;
revoke execute on function search_words from public, anon;
grant execute on function search_words to authenticated;
grant execute on function guest_search(text), guest_total() to anon, authenticated;

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('word-images', 'word-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Anyone may read (public bucket). Signed-in users upload only into their own folder: <uid>/<file>
create policy "word-images upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'word-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "word-images delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'word-images' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- To make an admin: update profiles set role = 'admin' where email = 'you@example.com';
