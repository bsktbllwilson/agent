"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";

async function requireAdminUser() {
  const [user, admin] = await Promise.all([getCurrentUser(), isAdmin()]);
  if (!user || !admin) redirect("/");
  return user;
}

export async function approveListing(formData: FormData): Promise<void> {
  const user = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing listing id.");
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const now = new Date().toISOString();
  const { error } = await sb
    .from("listings")
    .update({
      status: "published",
      approved_by: user.id,
      approved_at: now,
      published_at: now,
      rejection_reason: null,
    })
    .eq("id", id);
  if (error) {
    console.error("[admin] approveListing:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/admin/listings");
  revalidatePath("/listings");
  revalidatePath("/");
}

export async function rejectListing(formData: FormData): Promise<void> {
  const user = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) throw new Error("Missing listing id.");
  if (!reason) throw new Error("Rejection reason is required.");
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const { error } = await sb
    .from("listings")
    .update({
      status: "rejected",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", id);
  if (error) {
    console.error("[admin] rejectListing:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/admin/listings");
  revalidatePath("/listings");
}

export async function reopenListing(formData: FormData): Promise<void> {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing listing id.");
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const { error } = await sb
    .from("listings")
    .update({
      status: "pending",
      approved_by: null,
      approved_at: null,
      published_at: null,
    })
    .eq("id", id);
  if (error) {
    console.error("[admin] reopenListing:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/admin/listings");
  revalidatePath("/listings");
}

export async function toggleFeatured(formData: FormData): Promise<void> {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) throw new Error("Missing listing id.");
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const { error } = await sb
    .from("listings")
    .update({ featured: next })
    .eq("id", id);
  if (error) {
    console.error("[admin] toggleFeatured:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/admin/listings");
  revalidatePath("/listings");
  revalidatePath("/");
}
