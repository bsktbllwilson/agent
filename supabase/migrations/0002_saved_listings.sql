-- 0002_saved_listings.sql
-- Per-user saved/favorite listings with RLS.

create table if not exists public.saved_listings (
  user_id    uuid        not null references auth.users(id)     on delete cascade,
  listing_id uuid        not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists saved_listings_listing_id_idx
  on public.saved_listings (listing_id);

create index if not exists saved_listings_user_created_idx
  on public.saved_listings (user_id, created_at desc);

alter table public.saved_listings enable row level security;

drop policy if exists "users read own saved"   on public.saved_listings;
drop policy if exists "users insert own saved" on public.saved_listings;
drop policy if exists "users delete own saved" on public.saved_listings;

create policy "users read own saved"
  on public.saved_listings for select
  using (auth.uid() = user_id);

create policy "users insert own saved"
  on public.saved_listings for insert
  with check (auth.uid() = user_id);

create policy "users delete own saved"
  on public.saved_listings for delete
  using (auth.uid() = user_id);
