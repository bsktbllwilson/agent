import { getServerSupabase } from "@/lib/supabase/server";

export type ListingStats = {
  views: number;
  saves: number;
  inquiries: number;
};

const EMPTY: ListingStats = { views: 0, saves: 0, inquiries: 0 };

async function countRows(
  table: "listing_views" | "saved_listings" | "inquiries",
  ids: string[],
): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const sb = await getServerSupabase();
  if (!sb) return {};
  const { data, error } = await sb
    .from(table)
    .select("listing_id")
    .in("listing_id", ids);
  if (error) {
    console.error(`[stats] ${table}:`, error.message);
    return {};
  }
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { listing_id: string }).listing_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

/** Bulk-load stats for a set of listing IDs (use on list pages). */
export async function getStatsForListings(
  ids: string[],
): Promise<Record<string, ListingStats>> {
  if (ids.length === 0) return {};
  const [views, saves, inquiries] = await Promise.all([
    countRows("listing_views", ids),
    countRows("saved_listings", ids),
    countRows("inquiries", ids),
  ]);
  const out: Record<string, ListingStats> = {};
  for (const id of ids) {
    out[id] = {
      views: views[id] ?? 0,
      saves: saves[id] ?? 0,
      inquiries: inquiries[id] ?? 0,
    };
  }
  return out;
}

/** Single-listing stats (used on edit page). */
export async function getStatsForListing(id: string): Promise<ListingStats> {
  const all = await getStatsForListings([id]);
  return all[id] ?? EMPTY;
}

export type WeekBucket = { week: string; views: number };

/** 8 weeks of view counts for a listing, with zero-fill so the sparkline
 *  stays continuous. Oldest week first. */
export async function getWeeklyViews(listingId: string): Promise<WeekBucket[]> {
  const sb = await getServerSupabase();
  if (!sb) return [];

  const { data, error } = await sb.rpc("listing_views_by_week", {
    p_listing_id: listingId,
  });
  if (error) {
    console.error("[stats] getWeeklyViews:", error.message);
    return [];
  }

  // Build a dense 8-bucket series ending at this week.
  const byWeek = new Map<string, number>();
  for (const row of (data ?? []) as { week_start: string; views: number }[]) {
    const key = new Date(row.week_start).toISOString().slice(0, 10);
    byWeek.set(key, Number(row.views));
  }

  const now = new Date();
  // Postgres date_trunc('week', …) uses Monday. Find the Monday of this week
  // in UTC to keep keys aligned.
  const day = now.getUTCDay(); // 0 = Sun
  const offsetToMonday = (day + 6) % 7;
  const thisMonday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - offsetToMonday,
    ),
  );

  const out: WeekBucket[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setUTCDate(thisMonday.getUTCDate() - i * 7);
    const key = d.toISOString().slice(0, 10);
    out.push({ week: key, views: byWeek.get(key) ?? 0 });
  }
  return out;
}
