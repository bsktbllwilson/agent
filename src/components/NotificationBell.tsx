"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";

/** Floating, fixed-position unread-notification bell. Renders nothing for
 *  signed-out users or when Supabase env vars are missing. Updates in real
 *  time via a postgres_changes subscription on public.notifications. */
export function NotificationBell() {
  const [unread, setUnread] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let sb: ReturnType<typeof getBrowserSupabase>;
    try {
      sb = getBrowserSupabase();
    } catch {
      return;
    }

    let channel: ReturnType<typeof sb.channel> | null = null;
    let cancelled = false;

    async function load(uid: string) {
      const { count } = await sb
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .is("read_at", null);
      if (!cancelled) setUnread(count ?? 0);
    }

    async function attach(uid: string) {
      setUserId(uid);
      await load(uid);
      channel = sb
        .channel(`bell-${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          () => load(uid),
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          () => load(uid),
        )
        .subscribe();
    }

    async function detach() {
      setUserId(null);
      setUnread(null);
      if (channel) {
        await sb.removeChannel(channel);
        channel = null;
      }
    }

    sb.auth.getUser().then(({ data: { user } }) => {
      if (user && !cancelled) attach(user.id);
    });

    const { data: authSub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        detach().then(() => attach(session.user.id));
      }
      if (event === "SIGNED_OUT") detach();
    });

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      detach();
    };
  }, []);

  if (!userId) return null;

  const display = unread && unread > 99 ? "99+" : unread?.toString() ?? "";

  return (
    <Link
      href="/account"
      aria-label={
        unread && unread > 0
          ? `${unread} unread notifications`
          : "Notifications"
      }
      className="fixed right-5 top-5 z-40 inline-flex size-12 items-center justify-center rounded-full bg-cream text-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] ring-1 ring-ink/10 transition-transform hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:right-8 sm:top-8"
    >
      <Bell aria-hidden className="size-5" />
      {unread !== null && unread > 0 && (
        <span
          aria-hidden
          className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-orange px-1.5 py-0.5 text-[11px] font-semibold leading-none text-cream ring-2 ring-cream"
        >
          {display}
        </span>
      )}
    </Link>
  );
}
