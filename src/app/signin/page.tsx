"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      toast.error("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      const sb = getBrowserSupabase();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Magic link sent — check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] container-px flex flex-col items-center justify-center py-20">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block">
          <Wordmark tone="ink" className="text-2xl" />
        </Link>
        <h1 className="mt-8 font-display text-4xl leading-tight">Sign in</h1>
        <p className="mt-2 text-ink/70">
          We&apos;ll email you a one-time link — no password required.
        </p>

        {sent ? (
          <div className="mt-8 rounded-[1.5rem] border border-ink/10 bg-cream/60 p-6">
            <p className="text-ink">
              Magic link sent to <strong>{email}</strong>. Open it on this
              device.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-ink/70">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="rounded-full border border-ink/15 bg-white px-5 py-4 text-base outline-none focus:border-ink"
                placeholder="you@example.com"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-orange px-8 py-4 font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)] disabled:opacity-60"
            >
              {busy ? "Sending…" : "Email me a link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
