// Shape of public.listings rows (plus optional join fields).
export type ListingStatus = "draft" | "pending" | "published" | "rejected";

export type Listing = {
  id: string;
  seller_id: string;
  slug: string | null;
  status: ListingStatus | string;
  name: string;
  neighborhood: string | null;
  cuisine: string | null;
  subtype: string | null;
  established: number | null;
  serves: string | null;
  sqft: number | null;
  staff: number | null;
  price: number | null;
  revenue: number | null;
  rent: number | null;
  lease_years: number | null;
  ingredients: Record<string, unknown> | unknown[] | null;
  secret_sauce: string | null;
  reason: string | null;
  financing: Record<string, unknown> | null;
  sde: number | null;
  p_and_l_url: string | null;
  lease_terms: string | null;
  staff_retention: string | null;
  vendor_contracts: string | null;
  handoff_notes: string | null;
  owner_name: string | null;
  owner_years: number | null;
  owner_story: string | null;
  owner_photo_url: string | null;
  hero_url: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type ListingFilters = {
  cuisine?: string;
  subtype?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};
