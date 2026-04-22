"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
};

/** Global listener — mounted once in the root layout. Subscribes to inserts
 *  on public.notifications for the signed-in user and pops a sonner toast
 *  with an optional CTA. RLS ensures users only receive their own rows. */
export function RealtimeNotifier() {
  const router = useRouter();
  const channelRef = useRef<ReturnType<
    ReturnType<typeof getBrowserSupabase>["channel"]
  > | null>(null);

  useEffect(() => {
    let sb: ReturnType<typeof getBrowserSupabase>;
    try {
      sb = getBrowserSupabase();
    } catch {
      return; // env vars missing — silent no-op
    }

    let cancelled = false;

    async function start() {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user || cancelled) return;

      const channel = sb
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const row = payload.new as NotificationRow;
            toast(row.title, {
              description: row.body ?? undefined,
              action: row.href
                ? {
                    label: "Open",
                    onClick: () => router.push(row.href!),
                  }
                : undefined,
            });
          },
        )
        .subscribe();
      channelRef.current = channel;
    }

    start();

    const { data: authSub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && channelRef.current) {
        sb.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (event === "SIGNED_IN" && !channelRef.current) start();
    });

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      if (channelRef.current) {
        sb.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [router]);

  return null;
}
