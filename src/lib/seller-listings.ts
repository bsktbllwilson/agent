import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Listing } from "@/lib/types";

const LIST_COLUMNS =
  "id, slug, status, name, neighborhood, cuisine, subtype, price, hero_url, featured, created_at, updated_at, published_at";

export async function getOwnListings(): Promise<Listing[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const sb = await getServerSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("listings")
    .select(LIST_COLUMNS)
    .eq("seller_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[seller] getOwnListings:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Listing[];
}

export async function getOwnListingById(id: string): Promise<Listing | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const sb = await getServerSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[seller] getOwnListingById:", error.message);
    return null;
  }
  return (data as unknown as Listing) ?? null;
}
