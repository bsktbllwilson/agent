"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function saveListing(
  listingId: string,
  redirectPath: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/signin?next=${encodeURIComponent(redirectPath)}`);
  }
  const sb = await getServerSupabase();
  if (!sb) return;

  const { error } = await sb
    .from("saved_listings")
    .insert({ user_id: user.id, listing_id: listingId });
  if (error && !/duplicate|unique/i.test(error.message)) {
    console.error("[actions] saveListing:", error.message);
    throw new Error("Could not save listing.");
  }
  revalidatePath(redirectPath);
  revalidatePath("/account");
}

export async function unsaveListing(
  listingId: string,
  redirectPath: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const sb = await getServerSupabase();
  if (!sb) return;

  const { error } = await sb
    .from("saved_listings")
    .delete()
    .eq("user_id", user.id)
    .eq("listing_id", listingId);
  if (error) {
    console.error("[actions] unsaveListing:", error.message);
    throw new Error("Could not remove saved listing.");
  }
  revalidatePath(redirectPath);
  revalidatePath("/account");
}

export async function signOut(): Promise<void> {
  const sb = await getServerSupabase();
  if (sb) await sb.auth.signOut();
  redirect("/");
}
