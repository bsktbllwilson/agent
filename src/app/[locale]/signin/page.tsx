"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { routing, type Locale } from "@/i18n/routing";

function defaultNext(locale: Locale): string {
  return locale === routing.defaultLocale ? "/account" : `/${locale}/account`;
}

function sanitizeNext(raw: string | null, locale: Locale): string {
  const fallback = defaultNext(locale);
  if (!raw) return fallback;
  // Only allow same-origin, root-relative paths — prevents open-redirect.
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const t = useTranslations("signin");
  const locale = useLocale() as Locale;
  const params = useSearchParams();
  const next = sanitizeNext(params.get("next"), locale);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      toast.error(t("errorInvalid"));
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
      toast.success(t("successToast"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] container-px flex flex-col items-center justify-center py-20">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-block">
            <Wordmark tone="ink" className="text-2xl" />
          </Link>
          <LanguageSwitcher />
        </div>
        <h1 className="mt-8 font-display text-4xl leading-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-ink/70">{t("subhead")}</p>

        {sent ? (
          <div className="mt-8 rounded-[1.5rem] border border-ink/10 bg-cream/60 p-6">
            <p className="text-ink">
              {t.rich("sentBody", {
                email,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-ink/70">{t("emailLabel")}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="rounded-full border border-ink/15 bg-white px-5 py-4 text-base outline-none focus:border-ink"
                placeholder={t("emailPlaceholder")}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-orange px-8 py-4 font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)] disabled:opacity-60"
            >
              {busy ? t("submitting") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

