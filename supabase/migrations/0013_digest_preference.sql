-- 0013_digest_preference.sql
-- Separate opt-out for the daily digest email. On by default — the digest
-- is opt-out friendly because it's a single daily touchpoint, unlike the
-- per-event emails that can fire many times a day.

alter table public.notification_preferences
  add column if not exists digest_email boolean not null default true;

comment on column public.notification_preferences.digest_email is
  'When true, the daily cron sends a summary of the user''s unread notifications. Separate from per-event email flags.';
