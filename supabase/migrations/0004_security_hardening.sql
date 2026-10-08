-- 0004 — security hardening. Run after 0001-0003.

-- Uploaded image URLs must point into our own public storage bucket (not an arbitrary external site that could
-- track the admins who review submissions). NOT VALID = existing rows are not re-checked, new/updated rows are.
do $$ begin
  alter table pending_uploads add constraint pending_uploads_image_url_check
    check (image_url is null or image_url ~ '^https://[^/]+/storage/v1/object/public/word-images/[A-Za-z0-9_./-]+$') not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table word_images add constraint word_images_url_check
    check (url is null or url ~ '^https://[^/]+/storage/v1/object/public/word-images/[A-Za-z0-9_./-]+$') not valid;
exception when duplicate_object then null; end $$;
