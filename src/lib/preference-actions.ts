"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_PREFS, type Preferences } from "@/lib/notification-preferences";

const ALL_KEYS = Object.keys(DEFAULT_PREFS) as (keyof Preferences)[];

export async function updatePreferences(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/account/settings");
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  // Checkboxes are only present in the form when checked. Build a full row
  // so missing keys become false.
  const row: Record<string, unknown> = { user_id: user.id };
  for (const key of ALL_KEYS) {
    row[key] = formData.get(key) === "on";
  }
  row.updated_at = new Date().toISOString();

  const { error } = await sb
    .from("notification_preferences")
    .upsert(row, { onConflict: "user_id" });
  if (error) {
    console.error("[prefs] update:", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/account/settings");
}
