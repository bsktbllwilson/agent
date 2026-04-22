import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, lookupUserEmail } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/emails/send";
import { digestEmail } from "@/lib/emails/templates";

// Vercel Cron hits us over HTTPS with an `Authorization: Bearer <CRON_SECRET>`
// header. We also accept Vercel's own header (`x-vercel-cron: 1`) in case the
// env var isn't set yet.
export const maxDuration = 60;

type UnreadRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  href: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (secret && auth !== `Bearer ${secret}` && !isVercelCron) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY missing" },
      { status: 500 },
    );
  }

  // Pull the last 24 hours of unread notifications. Admin client bypasses
  // RLS; we group by user_id in-app.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await admin
    .from("notifications")
    .select("id, user_id, title, body, href, created_at")
    .is("read_at", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  const byUser = new Map<string, UnreadRow[]>();
  for (const row of (rows ?? []) as UnreadRow[]) {
    const bucket = byUser.get(row.user_id) ?? [];
    bucket.push(row);
    byUser.set(row.user_id, bucket);
  }
  if (byUser.size === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no unread" });
  }

  // Pull digest_email prefs for the affected users. Default true when missing.
  const userIds = Array.from(byUser.keys());
  const { data: prefRows } = await admin
    .from("notification_preferences")
    .select("user_id, digest_email")
    .in("user_id", userIds);
  const wants = new Map<string, boolean>();
  for (const id of userIds) wants.set(id, true);
  for (const p of (prefRows ?? []) as {
    user_id: string;
    digest_email: boolean;
  }[]) {
    wants.set(p.user_id, p.digest_email);
  }

  let sent = 0;
  let skipped = 0;
  for (const [userId, items] of byUser) {
    if (!wants.get(userId)) {
      skipped += 1;
      continue;
    }
    const email = await lookupUserEmail(userId);
    if (!email) {
      skipped += 1;
      continue;
    }
    await sendEmail({
      to: email,
      ...digestEmail({
        items: items.slice(0, 8).map((i) => ({
          title: i.title,
          body: i.body,
          href: i.href,
        })),
        unreadCount: items.length,
      }),
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent, skipped });
}
