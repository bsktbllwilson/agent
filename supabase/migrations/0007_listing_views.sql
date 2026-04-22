-- 0007_listing_views.sql
-- Per-listing view log. Anonymous writes allowed (everyone views);
-- reads scoped to listing owner + admin.

create table if not exists public.listing_views (
  id         bigserial  primary key,
  listing_id uuid       not null references public.listings(id) on delete cascade,
  viewer_id  uuid       references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists listing_views_listing_idx
  on public.listing_views (listing_id, created_at desc);
create index if not exists listing_views_viewer_idx
  on public.listing_views (viewer_id, created_at desc);

alter table public.listing_views enable row level security;

drop policy if exists "public insert listing view"        on public.listing_views;
drop policy if exists "seller reads views on own"         on public.listing_views;
drop policy if exists "admin reads all views"             on public.listing_views;

-- Anyone — including anon — can insert a view for a published listing.
-- No self-auth required; we never read this from the client, only aggregate.
create policy "public insert listing view"
  on public.listing_views for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.status = 'published'
    )
  );

create policy "seller reads views on own"
  on public.listing_views for select
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = auth.uid()
    )
  );

create policy "admin reads all views"
  on public.listing_views for select
  to authenticated
  using (public.is_admin());
