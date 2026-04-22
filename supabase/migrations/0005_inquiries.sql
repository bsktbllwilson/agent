-- 0005_inquiries.sql
-- Buyer → seller inquiries on published listings. Admin moderates the pipeline.

create table if not exists public.inquiries (
  id         uuid        primary key default gen_random_uuid(),
  listing_id uuid        not null references public.listings(id) on delete cascade,
  buyer_id   uuid        not null references auth.users(id)       on delete cascade,
  message    text        not null,
  status     text        not null default 'new'
             check (status in ('new','reviewed','introduced','closed','spam')),
  created_at timestamptz not null default now()
);

create index if not exists inquiries_listing_idx
  on public.inquiries (listing_id, created_at desc);
create index if not exists inquiries_buyer_idx
  on public.inquiries (buyer_id, created_at desc);
create index if not exists inquiries_status_created_idx
  on public.inquiries (status, created_at desc);

alter table public.inquiries enable row level security;

drop policy if exists "buyer creates own inquiry"          on public.inquiries;
drop policy if exists "buyer reads own inquiries"          on public.inquiries;
drop policy if exists "seller reads own listing inquiries" on public.inquiries;
drop policy if exists "admin reads all inquiries"          on public.inquiries;
drop policy if exists "admin updates inquiries"            on public.inquiries;

-- INSERT — buyer must own the row; listing must be published.
create policy "buyer creates own inquiry"
  on public.inquiries for insert
  to authenticated
  with check (
    auth.uid() = buyer_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.status = 'published'
    )
  );

-- SELECT
create policy "buyer reads own inquiries"
  on public.inquiries for select
  to authenticated
  using (auth.uid() = buyer_id);

create policy "seller reads own listing inquiries"
  on public.inquiries for select
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = auth.uid()
    )
  );

create policy "admin reads all inquiries"
  on public.inquiries for select
  to authenticated
  using (public.is_admin());

-- UPDATE — admin only (for status pipeline).
create policy "admin updates inquiries"
  on public.inquiries for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
