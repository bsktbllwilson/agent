import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export const EVENT_TYPES = [
  "listing_approved",
  "listing_rejected",
  "inquiry_received",
  "inquiry_status_changed",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type Channel = "in_app" | "email";

export type Preferences = Record<`${EventType}_${Channel}`, boolean> & {
  digest_email: boolean;
};

export const DEFAULT_PREFS: Preferences = {
  listing_approved_in_app: true,
  listing_approved_email: true,
  listing_rejected_in_app: true,
  listing_rejected_email: true,
  inquiry_received_in_app: true,
  inquiry_received_email: true,
  inquiry_status_changed_in_app: true,
  inquiry_status_changed_email: false,
  digest_email: true,
};

export const EVENT_LABELS: Record<EventType, { title: string; body: string }> = {
  listing_approved: {
    title: "Listing approved",
    body: "When we approve a listing you submitted.",
  },
  listing_rejected: {
    title: "Reviewer feedback",
    body: "When we send back edits on a submitted listing.",
  },
  inquiry_received: {
    title: "New buyer interest",
    body: "When a buyer sends an inquiry on your listing.",
  },
  inquiry_status_changed: {
    title: "Inquiry update",
    body: "When an inquiry you sent moves through the pipeline.",
  },
};

function merge(row: Partial<Preferences> | null | undefined): Preferences {
  return { ...DEFAULT_PREFS, ...(row ?? {}) };
}

/** Current user's prefs (RLS-scoped). Defaults merged for unset fields. */
export async function getOwnPreferences(): Promise<Preferences> {
  const user = await getCurrentUser();
  if (!user) return DEFAULT_PREFS;
  const sb = await getServerSupabase();
  if (!sb) return DEFAULT_PREFS;
  const { data } = await sb
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return merge(data);
}

/** Another user's prefs — requires the service-role client. Used by
 *  server actions that notify a user other than the caller. */
export async function getPreferencesFor(
  userId: string,
): Promise<Preferences> {
  const admin = getAdminSupabase();
  if (!admin) return DEFAULT_PREFS;
  const { data } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return merge(data);
}

export function wantsChannel(
  prefs: Preferences,
  event: EventType,
  channel: Channel,
): boolean {
  return prefs[`${event}_${channel}`] ?? true;
}
