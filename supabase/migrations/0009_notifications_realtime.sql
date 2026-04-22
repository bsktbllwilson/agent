-- 0009_notifications_realtime.sql
-- Opt public.notifications into Supabase Realtime so clients can subscribe
-- to INSERTs. RLS still applies to the stream — subscribers only receive
-- rows they can SELECT.

-- supabase_realtime is the default publication created by Supabase.
alter publication supabase_realtime add table public.notifications;
