import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Listing } from "@/lib/types";

const LIST_COLUMNS =
  "id, slug, status, name, neighborhood, cuisine, subtype, price, revenue, sqft, hero_url, featured, published_at";

/** IDs of listings saved by the current user. Empty set if not signed in. */
export async function getSavedListingIds(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const sb = await getServerSupabase();
  if (!sb) return new Set();

  const { data, error } = await sb
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", user.id);
  if (error) {
    console.error("[saved] getSavedListingIds:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.listing_id as string));
}

/** Full saved-listing rows for the current user, newest saves first. */
export async function getSavedListings(): Promise<Listing[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const sb = await getServerSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("saved_listings")
    .select(`created_at, listing:listings(${LIST_COLUMNS})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[saved] getSavedListings:", error.message);
    return [];
  }
  return ((data ?? [])
    .map((r: { listing: unknown }) => r.listing)
    .filter(Boolean) as unknown as Listing[]).filter(
    (l) => l.status === "published",
  );
}
