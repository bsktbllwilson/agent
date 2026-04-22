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
