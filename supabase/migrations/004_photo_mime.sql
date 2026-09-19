-- Store the upload mime type so moderation knows what it's fetching
alter table public.profile_photos
  add column mime_type text not null default 'image/jpeg';

-- Allow clients to set it on insert
grant insert (mime_type) on public.profile_photos to authenticated;