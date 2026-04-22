-- 0006_listings_bucket.sql
-- Storage bucket for listing images. Upload paths are scoped by user id
-- (`<user_id>/<filename>`) so the RLS policies below can enforce ownership
-- without needing the app to carry a foreign key around.
--
-- Public read so <img src="..."> works without a signed URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listings',
  'listings',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public              = excluded.public,
  file_size_limit     = excluded.file_size_limit,
  allowed_mime_types  = excluded.allowed_mime_types;

-- Wipe prior versions so this is idempotent.
drop policy if exists "listings bucket public read"   on storage.objects;
drop policy if exists "listings bucket owner insert"  on storage.objects;
drop policy if exists "listings bucket owner update"  on storage.objects;
drop policy if exists "listings bucket owner delete"  on storage.objects;

-- Anyone can read (images render on public pages).
create policy "listings bucket public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'listings');

-- Authenticated users can upload to their own folder: <user_id>/<filename>.
create policy "listings bucket owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "listings bucket owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "listings bucket owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
