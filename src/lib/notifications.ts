import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export type NotificationType =
  | "listing_approved"
  | "listing_rejected"
  | "inquiry_received"
  | "inquiry_status_changed";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

/** Server-side insertion via service-role key so one user can notify another.
 *  Silently no-ops when the admin client isn't configured. */
export async function createNotification(args: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) {
    console.warn(
      "[notify] SUPABASE_SERVICE_ROLE_KEY missing — skipping in-app notify:",
      args.type,
    );
    return;
  }
  const { error } = await admin.from("notifications").insert({
    user_id: args.userId,
    type: args.type,
    title: args.title,
    body: args.body ?? null,
    href: args.href ?? null,
  });
  if (error) console.error("[notify] insert failed:", error.message);
}

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const sb = await getServerSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[notify] getNotifications:", error.message);
    return [];
  }
  return (data ?? []) as Notification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  const sb = await getServerSupabase();
  if (!sb) return 0;
  const { count, error } = await sb
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  if (error) {
    console.error("[notify] unread count:", error.message);
    return 0;
  }
  return count ?? 0;
}
