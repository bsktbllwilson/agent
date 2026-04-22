-- 0012_notification_preferences.sql
-- Per-user channel preferences. One row per user; defaults applied in code
-- when a user has no row yet.

create table if not exists public.notification_preferences (
  user_id                          uuid primary key references auth.users(id) on delete cascade,
  listing_approved_in_app          boolean not null default true,
  listing_approved_email           boolean not null default true,
  listing_rejected_in_app          boolean not null default true,
  listing_rejected_email           boolean not null default true,
  inquiry_received_in_app          boolean not null default true,
  inquiry_received_email           boolean not null default true,
  inquiry_status_changed_in_app    boolean not null default true,
  inquiry_status_changed_email     boolean not null default false,
  updated_at                       timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "user reads own prefs"   on public.notification_preferences;
drop policy if exists "user upserts own prefs" on public.notification_preferences;
drop policy if exists "user updates own prefs" on public.notification_preferences;

create policy "user reads own prefs"
  on public.notification_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user upserts own prefs"
  on public.notification_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user updates own prefs"
  on public.notification_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
