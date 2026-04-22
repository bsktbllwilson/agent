-- 0008_notifications.sql
-- Per-user in-app notifications. Inserted from server actions using the
-- service-role client; read + marked-read by the owner via RLS.

create table if not exists public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  type       text        not null check (type in (
                'listing_approved',
                'listing_rejected',
                'inquiry_received',
                'inquiry_status_changed'
              )),
  title      text        not null,
  body       text,
  href       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "user reads own notifications"      on public.notifications;
drop policy if exists "user marks own read"               on public.notifications;

create policy "user reads own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

-- Let the owner clear the read_at flag (and only that) on their own rows.
-- The service-role client bypasses RLS for INSERTs; no INSERT policy needed.
create policy "user marks own read"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
