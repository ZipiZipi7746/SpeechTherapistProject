-- 0002 — clinicians can flag an uploaded image for cultural sensitivity; category names must be unique.
-- Run in the Supabase SQL editor after 0001_init.sql.

alter table pending_uploads add column if not exists cultural_warning boolean not null default false;

-- Category names are managed by admins in the UI; keep them unique.
do $$ begin
  alter table phonological_categories add constraint phonological_categories_name_key unique (name_he);
exception when duplicate_object or duplicate_table then null; end $$;

-- Approval now carries the flag over to the image.
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

  insert into word_images (word_id, kind, url, cultural_warning) values (new_word, u.image_kind, u.image_url, u.cultural_warning);

  update pending_uploads set status = 'approved', rejection_reason = null, reviewed_by = auth.uid(), reviewed_at = now() where id = p_id;
  return new_word;
end $$;
