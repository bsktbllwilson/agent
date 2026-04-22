-- 0004_listing_approval_columns.sql
-- Adds audit columns so admin approvals/rejections are traceable.

alter table public.listings
  add column if not exists approved_by      uuid references auth.users(id) on delete set null,
  add column if not exists approved_at      timestamptz,
  add column if not exists rejection_reason text;

comment on column public.listings.approved_by is
  'auth.users.id of the admin who last approved or rejected this listing.';
comment on column public.listings.approved_at is
  'When the approval / rejection decision was made.';
comment on column public.listings.rejection_reason is
  'Plain-text feedback shown to the seller when status = rejected.';

create index if not exists listings_status_updated_idx
  on public.listings (status, updated_at desc);

-- Let sellers respond to rejections by editing + resubmitting.
-- Supersedes the policy from 0003 which only covered draft/pending.
drop policy if exists "seller updates own editable" on public.listings;
create policy "seller updates own editable"
  on public.listings for update
  to authenticated
  using (
    auth.uid() = seller_id
    and status in ('draft', 'pending', 'rejected')
  )
  with check (
    auth.uid() = seller_id
    and status in ('draft', 'pending', 'rejected')
  );
