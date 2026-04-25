import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSignedIn } from "@/lib/auth";
import { createDraftListing } from "@/lib/seller-actions";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { ImageUpload } from "@/components/primitives/ImageUpload";
import { getHomepage } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sellNew" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function NewListingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSignedIn();
  const t = await getTranslations("sellNew");
  const tSell = await getTranslations("sellListings");
  const home = getHomepage(locale);

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      <section className="container-px py-12 sm:py-20">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex items-center justify-between">
            <Link
              href="/sell/listings"
              className="text-sm text-ink/70 underline-offset-4 hover:underline"
            >
              ← {tSell("heading")}
            </Link>
          </div>

          <div className="mt-6 rounded-[40px] bg-white p-8 sm:rounded-[60px] sm:p-12 lg:rounded-[80px] lg:p-16">
            <h1 className="text-center font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95]">
              {t("headingBefore")}
              {t("headingItalic")}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-center text-base text-ink/70 sm:text-lg">
              {t("subhead")}
            </p>

            <form
              action={createDraftListing}
              className="mt-12 flex flex-col gap-6"
            >
              <Field
                label={t("businessName")}
                name="name"
                required
                autoFocus
              />
              <div className="grid gap-6 md:grid-cols-2">
                <Field
                  label={t("cuisine")}
                  name="cuisine"
                  placeholder={t("cuisinePlaceholder")}
                />
                <Field
                  label={t("type")}
                  name="subtype"
                  placeholder={t("typePlaceholder")}
                />
              </div>
              <Field
                label={t("neighborhood")}
                name="neighborhood"
                placeholder={t("neighborhoodPlaceholder")}
              />
              <Field
                label={t("askingPrice")}
                name="price"
                type="number"
                min="0"
                step="1000"
                placeholder="1200000"
              />

              <div className="grid gap-3 md:grid-cols-[197px_1fr] md:items-start md:gap-6">
                <span className="font-display text-[clamp(1.5rem,2.2vw,2.25rem)] leading-[1.1]">
                  {t("heroImage")}
                </span>
                <ImageUpload
                  name="hero_url"
                  label=""
                  helpText={t("heroImageHelp")}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <Link
                  href="/sell"
                  className="text-sm text-ink/60 underline-offset-4 hover:underline"
                >
                  {t("cancel")}
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-[25px] border border-ink bg-orange px-8 py-4 text-base font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)]"
                >
                  {t("createDraft")}
                  <ArrowRight aria-hidden className="size-5" />
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-ink/60">
              {t("draftPrivate")}
            </p>
          </div>
        </div>
      </section>

      <SiteFooter data={home.footer} />
    </main>
  );
}

function Field({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <label className="flex flex-col gap-3 md:grid md:grid-cols-[197px_1fr] md:items-center md:gap-6">
      <span className="font-display text-[clamp(1.5rem,2.2vw,2.25rem)] leading-[1.1]">
        {label}
      </span>
      <input
        {...rest}
        className="rounded-full border border-ink/15 bg-cream px-5 py-4 text-base text-ink outline-none focus:border-ink"
      />
    </label>
  );
}
