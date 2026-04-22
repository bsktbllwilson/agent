"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { sendEmail, adminEmail } from "@/lib/emails/send";
import { listingSubmittedEmail } from "@/lib/emails/templates";

function toIntOrNull(raw: FormDataEntryValue | null): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function toStr(raw: FormDataEntryValue | null): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  base: string,
  excludeId?: string,
): Promise<string> {
  if (!supabase) return base;
  let candidate = base || "listing";
  for (let i = 0; i < 6; i++) {
    const q = supabase.from("listings").select("id").eq("slug", candidate);
    const { data, error } = await q;
    if (error) break;
    const clash = (data ?? []).find((r) => r.id !== excludeId);
    if (!clash) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createDraftListing(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/sell/new");
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const name = toStr(formData.get("name"));
  if (!name) throw new Error("Business name is required.");

  const slugBase = slugify(name);
  const slug = await uniqueSlug(sb, slugBase);

  const payload = {
    seller_id: user.id,
    status: "draft",
    name,
    slug,
    cuisine: toStr(formData.get("cuisine")),
    subtype: toStr(formData.get("subtype")),
    neighborhood: toStr(formData.get("neighborhood")),
    price: toIntOrNull(formData.get("price")),
    hero_url: toStr(formData.get("hero_url")),
    featured: false,
  };

  const { data, error } = await sb
    .from("listings")
    .insert(payload)
    .select("id")
    .single();
  if (error) {
    console.error("[seller] createDraftListing:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/sell/listings");
  redirect(`/sell/listings/${data!.id}`);
}

export async function updateListing(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const id = toStr(formData.get("id"));
  if (!id) throw new Error("Missing listing id.");

  const name = toStr(formData.get("name"));
  const patch: Record<string, unknown> = {
    name,
    cuisine: toStr(formData.get("cuisine")),
    subtype: toStr(formData.get("subtype")),
    neighborhood: toStr(formData.get("neighborhood")),
    serves: toStr(formData.get("serves")),
    established: toIntOrNull(formData.get("established")),
    sqft: toIntOrNull(formData.get("sqft")),
    staff: toIntOrNull(formData.get("staff")),
    price: toIntOrNull(formData.get("price")),
    revenue: toIntOrNull(formData.get("revenue")),
    sde: toIntOrNull(formData.get("sde")),
    rent: toIntOrNull(formData.get("rent")),
    lease_years: toIntOrNull(formData.get("lease_years")),
    secret_sauce: toStr(formData.get("secret_sauce")),
    reason: toStr(formData.get("reason")),
    lease_terms: toStr(formData.get("lease_terms")),
    staff_retention: toStr(formData.get("staff_retention")),
    vendor_contracts: toStr(formData.get("vendor_contracts")),
    handoff_notes: toStr(formData.get("handoff_notes")),
    owner_name: toStr(formData.get("owner_name")),
    owner_years: toIntOrNull(formData.get("owner_years")),
    owner_story: toStr(formData.get("owner_story")),
    owner_photo_url: toStr(formData.get("owner_photo_url")),
    hero_url: toStr(formData.get("hero_url")),
    p_and_l_url: toStr(formData.get("p_and_l_url")),
  };

  // If name changed, refresh slug (unique across table).
  if (name) {
    const { data: current } = await sb
      .from("listings")
      .select("slug, name")
      .eq("id", id)
      .maybeSingle();
    if (current && current.name !== name) {
      patch.slug = await uniqueSlug(sb, slugify(name), id);
    }
  }

  const { error } = await sb
    .from("listings")
    .update(patch)
    .eq("id", id)
    .eq("seller_id", user.id);
  if (error) {
    console.error("[seller] updateListing:", error.message);
    throw new Error(error.message);
  }
  revalidatePath(`/sell/listings/${id}`);
  revalidatePath("/sell/listings");
}

export async function submitListingForReview(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  // Basic readiness check — add more as you tighten review criteria.
  const { data: listing } = await sb
    .from("listings")
    .select("name, cuisine, neighborhood, price, hero_url, reason")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!listing) throw new Error("Listing not found.");
  const missing: string[] = [];
  if (!listing.name) missing.push("name");
  if (!listing.cuisine) missing.push("cuisine");
  if (!listing.neighborhood) missing.push("neighborhood");
  if (!listing.price) missing.push("price");
  if (!listing.hero_url) missing.push("hero image");
  if (!listing.reason) missing.push("reason for selling");
  if (missing.length) {
    throw new Error(`Fill in before submitting: ${missing.join(", ")}.`);
  }

  const { error } = await sb
    .from("listings")
    .update({ status: "pending" })
    .eq("id", id)
    .eq("seller_id", user.id);
  if (error) {
    console.error("[seller] submitListingForReview:", error.message);
    throw new Error(error.message);
  }

  const admin = adminEmail();
  if (admin && listing.name) {
    await sendEmail({
      to: admin,
      ...listingSubmittedEmail({ listingName: listing.name, listingId: id }),
    });
  }

  revalidatePath(`/sell/listings/${id}`);
  revalidatePath("/sell/listings");
}

export async function deleteDraftListing(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  // Clean up any uploaded hero/owner photos before we drop the row. Files
  // live at listings/<user_id>/<listing_id>/*. RLS on the bucket limits
  // writes to the owner's folder so this list+remove is safe.
  const folder = `${user.id}/${id}`;
  const { data: files } = await sb.storage.from("listings").list(folder, {
    limit: 100,
  });
  if (files && files.length > 0) {
    const paths = files.map((f) => `${folder}/${f.name}`);
    const { error: rmErr } = await sb.storage.from("listings").remove(paths);
    if (rmErr) {
      console.warn(
        "[seller] orphan-file cleanup failed (non-fatal):",
        rmErr.message,
      );
    }
  }

  const { error } = await sb
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id)
    .eq("status", "draft");
  if (error) {
    console.error("[seller] deleteDraftListing:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/sell/listings");
  redirect("/sell/listings");
}
