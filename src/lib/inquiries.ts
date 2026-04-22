import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type InquiryStatus =
  | "new"
  | "reviewed"
  | "introduced"
  | "closed"
  | "spam";

export type InquiryRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
  listing?: {
    id: string;
    name: string | null;
    slug: string | null;
    seller_id: string | null;
    neighborhood: string | null;
  } | null;
};

const LIST_COLUMNS =
  "id, listing_id, buyer_id, message, status, created_at, listing:listings(id, name, slug, seller_id, neighborhood)";

/** Admin view — all inquiries, optionally filtered by status. */
export async function getAllInquiries(
  status?: InquiryStatus,
): Promise<InquiryRow[]> {
  const sb = await getServerSupabase();
  if (!sb) return [];
  let q = sb
    .from("inquiries")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) {
    console.error("[inquiries] getAllInquiries:", error.message);
    return [];
  }
  return (data ?? []) as unknown as InquiryRow[];
}

/** Seller view — RLS filters to inquiries on listings they own. */
export async function getInquiriesForSeller(): Promise<InquiryRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const sb = await getServerSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inquiries")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[inquiries] getInquiriesForSeller:", error.message);
    return [];
  }
  return (data ?? []) as unknown as InquiryRow[];
}
