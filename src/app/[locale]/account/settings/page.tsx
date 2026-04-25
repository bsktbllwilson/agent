import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSignedIn } from "@/lib/auth";
import {
  EVENT_TYPES,
  EVENT_LABELS,
  getOwnPreferences,
} from "@/lib/notification-preferences";
import { updatePreferences } from "@/lib/preference-actions";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { getHomepage } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "accountSettings" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSignedIn();
  const t = await getTranslations("accountSettings");
  const home = getHomepage(locale);
  const prefs = await getOwnPreferences();

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      <section className="container-px py-12 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-ink/70 underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {t("backToAccount")}
          </Link>

          <div className="mt-8 rounded-[40px] bg-white p-8 sm:rounded-[60px] sm:p-12 lg:p-16">
            <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[0.95]">
              {t("headingBefore")}
              {t("headingItalic")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink/70 sm:text-lg">
              {t("subhead")}
            </p>

            <form
              action={updatePreferences}
              className="mt-10 flex flex-col gap-6"
            >
              <div className="overflow-hidden rounded-[24px] border border-ink/10 bg-cream">
                <div className="hidden grid-cols-[1fr_auto_auto] items-center gap-6 border-b border-ink/10 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink/50 sm:grid">
                  <span>{t("event")}</span>
                  <span className="text-center">{t("inApp")}</span>
                  <span className="text-center">{t("email")}</span>
                </div>
                <ul className="divide-y divide-ink/10">
                  {EVENT_TYPES.map((evt) => (
                    <li
                      key={evt}
                      className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-8"
                    >
                      <div>
                        <div className="font-display text-xl text-ink sm:text-2xl">
                          {EVENT_LABELS[evt].title}
                        </div>
                        <div className="mt-1 text-sm text-ink/60 sm:text-base">
                          {EVENT_LABELS[evt].body}
                        </div>
                      </div>
                      <Toggle
                        name={`${evt}_in_app`}
                        defaultChecked={prefs[`${evt}_in_app`]}
                        label={`${t("inApp")}: ${EVENT_LABELS[evt].title}`}
                      />
                      <Toggle
                        name={`${evt}_email`}
                        defaultChecked={prefs[`${evt}_email`]}
                        label={`${t("email")}: ${EVENT_LABELS[evt].title}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[24px] border border-ink/10 bg-cream p-6 sm:p-8">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="font-display text-xl text-ink sm:text-2xl">
                      {t("digestTitle")}
                    </div>
                    <div className="mt-1 text-sm text-ink/60 sm:text-base">
                      {t("digestBody")}
                    </div>
                  </div>
                  <Toggle
                    name="digest_email"
                    defaultChecked={prefs.digest_email}
                    label={t("digestLabel")}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-[25px] border border-ink bg-orange px-8 py-4 text-base font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)]"
                >
                  {t("savePreferences")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter data={home.footer} />
    </main>
  );
}

function Toggle({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <span className="sr-only">{label}</span>
      <span className="relative inline-block">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
        />
        <span className="block h-6 w-11 rounded-full bg-ink/15 transition-colors peer-checked:bg-orange" />
        <span className="absolute left-0.5 top-0.5 block size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
