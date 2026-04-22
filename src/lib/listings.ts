import { getServerSupabase } from "@/lib/supabase/server";
import type { Listing, ListingFilters } from "@/lib/types";

const LIST_COLUMNS =
  "id, slug, status, name, neighborhood, cuisine, subtype, price, revenue, sqft, hero_url, featured, published_at, created_at";

export async function getPublishedListings(
  filters: ListingFilters = {},
  opts: { limit?: number; orderBy?: "newest" | "featured" } = {},
): Promise<Listing[]> {
  const sb = await getServerSupabase();
  if (!sb) return [];

  let q = sb
    .from("listings")
    .select(LIST_COLUMNS)
    .eq("status", "published");

  if (filters.cuisine) q = q.eq("cuisine", filters.cuisine);
  if (filters.subtype) q = q.eq("subtype", filters.subtype);
  if (filters.neighborhood) q = q.eq("neighborhood", filters.neighborhood);
  if (filters.minPrice != null) q = q.gte("price", filters.minPrice);
  if (filters.maxPrice != null) q = q.lte("price", filters.maxPrice);
  if (filters.search) {
    // websearch_to_tsquery handles user input safely — quoted phrases,
    // OR, -exclude. No escaping required.
    q = q.textSearch("search_tsv", filters.search, {
      type: "websearch",
      config: "english",
    });
  }

  if (opts.orderBy === "featured") {
    q = q.order("featured", { ascending: false }).order("published_at", {
      ascending: false,
      nullsFirst: false,
    });
  } else {
    q = q.order("published_at", { ascending: false, nullsFirst: false });
  }

  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) {
    console.error("[listings] getPublishedListings:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Listing[];
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const sb = await getServerSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    console.error("[listings] getListingBySlug:", error.message);
    return null;
  }
  return (data as unknown as Listing) ?? null;
}

export async function getFeaturedListings(limit = 4): Promise<Listing[]> {
  return getPublishedListings({}, { limit, orderBy: "featured" });
}

export async function getFilterFacets(): Promise<{
  cuisines: string[];
  subtypes: string[];
  neighborhoods: string[];
}> {
  const sb = await getServerSupabase();
  if (!sb) return { cuisines: [], subtypes: [], neighborhoods: [] };

  const { data, error } = await sb
    .from("listings")
    .select("cuisine, subtype, neighborhood")
    .eq("status", "published");
  if (error || !data) {
    return { cuisines: [], subtypes: [], neighborhoods: [] };
  }
  const uniq = (xs: (string | null)[]) =>
    Array.from(new Set(xs.filter((x): x is string => !!x))).sort((a, b) =>
      a.localeCompare(b),
    );
  return {
    cuisines: uniq(data.map((r) => r.cuisine)),
    subtypes: uniq(data.map((r) => r.subtype)),
    neighborhoods: uniq(data.map((r) => r.neighborhood)),
  };
}
