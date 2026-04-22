-- 0010_listing_views_by_week.sql
-- RPC that returns per-week view counts for a listing over the last 8 weeks.
-- SECURITY INVOKER so the caller's RLS applies — only the listing owner or
-- an admin will receive rows.

create or replace function public.listing_views_by_week(p_listing_id uuid)
returns table(week_start timestamptz, views bigint)
language sql stable
as $$
  select date_trunc('week', created_at) as week_start,
         count(*)::bigint              as views
  from public.listing_views
  where listing_id  = p_listing_id
    and created_at >= now() - interval '8 weeks'
  group by week_start
  order by week_start;
$$;

comment on function public.listing_views_by_week(uuid) is
  'Weekly view counts for a listing over the last 8 weeks. SECURITY INVOKER — RLS on listing_views applies.';
