"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { sendEmail, adminEmail } from "@/lib/emails/send";
import { newInquiryAdminEmail } from "@/lib/emails/templates";
import type { InquiryStatus } from "@/lib/inquiries";

export async function submitInquiry(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const listingId = String(formData.get("listing_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!listingId) throw new Error("Missing listing.");

  if (!user) {
    redirect(
      `/signin?next=${encodeURIComponent(`/listings/${slug}?intent=inquire`)}`,
    );
  }

  const message = String(formData.get("message") ?? "").trim();
  if (!message) throw new Error("Please tell the seller a bit about yourself.");
  if (message.length > 2000)
    throw new Error("Keep your first message under 2,000 characters.");

  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const { error } = await sb.from("inquiries").insert({
    buyer_id: user.id,
    listing_id: listingId,
    message,
  });
  if (error) {
    console.error("[inquiry] submitInquiry:", error.message);
    throw new Error(error.message);
  }

  const { data: listing } = await sb
    .from("listings")
    .select("name")
    .eq("id", listingId)
    .maybeSingle();
  const listingName = listing?.name ?? "A listing";

  // Notify admin — seller notification goes through admin intro flow for now
  // (emailing the seller directly requires a service-role lookup of
  // auth.users or a profiles.email column we haven't confirmed exists).
  const admin = adminEmail();
  if (admin) {
    await sendEmail({
      to: admin,
      ...newInquiryAdminEmail({
        listingName,
        listingId,
        buyerEmail: user.email ?? "unknown",
        message,
      }),
      replyTo: user.email,
    });
  }

  revalidatePath(`/listings/${slug}`);
  revalidatePath("/account");
  revalidatePath("/admin/inquiries");
  revalidatePath("/sell/inquiries");
}

export async function updateInquiryStatus(formData: FormData): Promise<void> {
  const admin = await isAdmin();
  if (!admin) redirect("/");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as InquiryStatus;
  if (!id || !status) throw new Error("Missing inquiry id or status.");

  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const { error } = await sb
    .from("inquiries")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error("[inquiry] updateInquiryStatus:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/admin/inquiries");
  revalidatePath("/sell/inquiries");
}
