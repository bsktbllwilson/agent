-- 0003_listing_rls.sql
-- Lock down public.listings with RLS:
--   - public: can only SELECT status = 'published'
--   - seller: can INSERT drafts for themselves; UPDATE own drafts/pending
--             (cannot self-publish); SELECT their own regardless of status
--   - admin:  SELECT / UPDATE anything
--
-- Assumes public.is_admin() exists (see 0001_admin_role.sql).

alter table public.listings enable row level security;

-- Wipe any prior versions of these policies so the migration is idempotent.
drop policy if exists "public reads published listings"   on public.listings;
drop policy if exists "seller reads own listings"         on public.listings;
drop policy if exists "admin reads all listings"          on public.listings;
drop policy if exists "seller inserts own drafts"         on public.listings;
drop policy if exists "seller updates own editable"       on public.listings;
drop policy if exists "admin updates any listing"         on public.listings;
drop policy if exists "seller deletes own drafts"         on public.listings;

---------- SELECT ----------
create policy "public reads published listings"
  on public.listings for select
  to anon, authenticated
  using (status = 'published');

create policy "seller reads own listings"
  on public.listings for select
  to authenticated
  using (auth.uid() = seller_id);

create policy "admin reads all listings"
  on public.listings for select
  to authenticated
  using (public.is_admin());

---------- INSERT ----------
-- Seller must own the row and may only create drafts.
create policy "seller inserts own drafts"
  on public.listings for insert
  to authenticated
  with check (
    auth.uid() = seller_id
    and status = 'draft'
  );

---------- UPDATE ----------
-- Seller can modify their own listing while it's a draft or pending review.
-- The with-check prevents them from flipping status to published/rejected.
create policy "seller updates own editable"
  on public.listings for update
  to authenticated
  using (
    auth.uid() = seller_id
    and status in ('draft', 'pending')
  )
  with check (
    auth.uid() = seller_id
    and status in ('draft', 'pending')
  );

create policy "admin updates any listing"
  on public.listings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

---------- DELETE ----------
-- Sellers may delete only their own drafts (safe undo before submission).
create policy "seller deletes own drafts"
  on public.listings for delete
  to authenticated
  using (
    auth.uid() = seller_id
    and status = 'draft'
  );
