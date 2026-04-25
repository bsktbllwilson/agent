import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSignedIn } from "@/lib/auth";
import { createDraftListing } from "@/lib/seller-actions";
import { Wordmark } from "@/components/Wordmark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ImageUpload } from "@/components/primitives/ImageUpload";
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
  const tHeader = await getTranslations("header");
  const tSell = await getTranslations("sellListings");

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label={tHeader("ariaHome")}>
            <Wordmark tone="ink" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/sell/listings"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {tSell("heading")}
            </Link>
          </div>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto max-w-[720px]">
          <h1 className="text-section text-ink">
            {t("headingBefore")}
            <span className="italic">{t("headingItalic")}</span>
          </h1>
          <p className="mt-3 text-lg text-ink/70">{t("subhead")}</p>

          <form
            action={createDraftListing}
            className="mt-10 flex flex-col gap-6 rounded-[1.5rem] border border-ink/10 bg-white p-8"
          >
            <Field label={t("businessName")} name="name" required autoFocus />
            <div className="grid gap-6 sm:grid-cols-2">
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
            <ImageUpload
              name="hero_url"
              label={t("heroImage")}
              helpText={t("heroImageHelp")}
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <Link
                href="/sell"
                className="text-sm text-ink/60 underline-offset-4 hover:underline"
              >
                {t("cancel")}
              </Link>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-orange px-7 py-3 text-base font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                {t("createDraft")}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            {t("draftPrivate")}
          </p>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  hint,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        {...rest}
        className="rounded-full border border-ink/15 bg-white px-5 py-3 text-base text-ink outline-none focus:border-ink"
      />
      {hint && <span className="text-xs text-ink/60">{hint}</span>}
    </label>
  );
}
