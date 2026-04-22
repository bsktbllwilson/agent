import { getServerSupabase } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

const LIST_COLUMNS =
  "id, slug, status, name, neighborhood, cuisine, subtype, price, revenue, hero_url, featured, created_at, updated_at, published_at, approved_at, rejection_reason, seller_id";

export type AdminStatus = "pending" | "published" | "rejected" | "draft";

export async function getListingsByStatus(
  status: AdminStatus,
  limit = 100,
): Promise<Listing[]> {
  const sb = await getServerSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("listings")
    .select(LIST_COLUMNS)
    .eq("status", status)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[admin] getListingsByStatus:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Listing[];
}

export async function getListingStatusCounts(): Promise<
  Record<AdminStatus, number>
> {
  const empty = { pending: 0, published: 0, rejected: 0, draft: 0 };
  const sb = await getServerSupabase();
  if (!sb) return empty;

  const { data, error } = await sb
    .from("listings")
    .select("status");
  if (error || !data) return empty;

  const counts: Record<AdminStatus, number> = { ...empty };
  for (const row of data) {
    const s = (row as { status: string }).status as AdminStatus;
    if (s in counts) counts[s] += 1;
  }
  return counts;
}
