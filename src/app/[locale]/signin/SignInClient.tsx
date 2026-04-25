"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { routing, type Locale } from "@/i18n/routing";

type Labels = {
  title: string;
  subhead: string;
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  submitting: string;
  sentHeading: string;
  errorInvalid: string;
  errorGeneric: string;
  successToast: string;
};

function defaultNext(locale: Locale): string {
  return locale === routing.defaultLocale ? "/account" : `/${locale}/account`;
}

function sanitizeNext(raw: string | null, locale: Locale): string {
  const fallback = defaultNext(locale);
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

export function SignInClient({
  labels,
  sentBodyTemplate,
}: {
  labels: Labels;
  sentBodyTemplate: string;
}) {
  return (
    <Suspense fallback={null}>
      <Inner labels={labels} sentBodyTemplate={sentBodyTemplate} />
    </Suspense>
  );
}

function Inner({
  labels,
  sentBodyTemplate,
}: {
  labels: Labels;
  sentBodyTemplate: string;
}) {
  const locale = useLocale() as Locale;
  const params = useSearchParams();
  const next = sanitizeNext(params.get("next"), locale);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      toast.error(labels.errorInvalid);
      return;
    }
    setBusy(true);
    try {
      const sb = getBrowserSupabase();
      const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirect },
      });
      if (error) throw error;
      setSent(true);
      toast.success(labels.successToast);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    const sentBody = sentBodyTemplate
      .replace("<strong>{email}</strong>", `<strong>${escapeHtml(email)}</strong>`)
      .replace("{email}", escapeHtml(email));
    return (
      <div className="mt-10 rounded-[24px] border border-ink/10 bg-cream p-6 text-center">
        <h2 className="font-display text-2xl text-ink">{labels.sentHeading}</h2>
        <p
          className="mt-3 text-base text-ink/70"
          dangerouslySetInnerHTML={{ __html: sentBody }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-6">
      <label className="flex flex-col gap-3 md:grid md:grid-cols-[140px_1fr] md:items-center md:gap-6">
        <span className="font-display text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.1]">
          {labels.emailLabel}
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          placeholder={labels.emailPlaceholder}
          className="rounded-full border border-ink/15 bg-cream px-5 py-4 text-base text-ink outline-none focus:border-ink"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[25px] border border-ink bg-orange py-5 text-base font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)] disabled:opacity-60"
      >
        {busy ? labels.submitting : labels.submit}
        <ArrowRight aria-hidden className="size-5" />
      </button>
    </form>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
