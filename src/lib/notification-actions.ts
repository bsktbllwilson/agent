"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function markNotificationRead(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const sb = await getServerSupabase();
  if (!sb) return;
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) console.error("[notify] mark read:", error.message);
  revalidatePath("/account");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const sb = await getServerSupabase();
  if (!sb) return;
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) console.error("[notify] mark all read:", error.message);
  revalidatePath("/account");
}
