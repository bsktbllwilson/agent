import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSignedIn } from "@/lib/auth";
import { getInquiriesForSeller } from "@/lib/inquiries";
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
  const t = await getTranslations({ locale, namespace: "sellInquiries" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function SellerInquiriesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSignedIn();
  const t = await getTranslations("sellInquiries");
  const home = getHomepage(locale);
  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";
  const rows = await getInquiriesForSeller();

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      <section className="container-px py-12 sm:py-20">
        <div className="mx-auto max-w-[1080px]">
          <Link
            href="/sell/listings"
            className="inline-flex items-center gap-2 text-sm text-ink/70 underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {t("yourListings")}
          </Link>

          <h1 className="mt-8 font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95]">
            {t("headingBefore")}
            {t("headingItalic")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink/70 sm:text-lg">
            {t("subhead")}
          </p>

          {rows.length === 0 ? (
            <div className="mt-12 rounded-[40px] bg-white p-12 text-center sm:rounded-[60px] sm:p-16">
              <h2 className="font-display text-3xl text-ink sm:text-4xl">
                {t("emptyHeading")}
              </h2>
              <p className="mt-3 text-ink/70">{t("emptyBody")}</p>
              <Link
                href="/sell/listings"
                className="mt-8 inline-flex items-center gap-2 rounded-[25px] border border-ink bg-orange px-7 py-4 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                {t("yourListings")}
              </Link>
            </div>
          ) : (
            <ul className="mt-10 flex flex-col gap-4">
              {rows.map((r) => (
                <li key={r.id}>
                  <article className="rounded-[24px] border border-ink/10 bg-white p-7 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl leading-tight text-ink sm:text-3xl">
                        {r.listing?.name ?? t("listingFallback")}
                      </h2>
                      <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium uppercase tracking-wide text-ink/70">
                        {r.status}
                      </span>
                      <span className="text-sm text-ink/50">
                        {new Date(r.created_at).toLocaleDateString(dateLocale, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <blockquote className="mt-4 whitespace-pre-line rounded-[20px] bg-cream p-5 text-base leading-relaxed text-ink/90 sm:text-lg">
                      {r.message}
                    </blockquote>
                    <p className="mt-3 text-xs text-ink/50">{t("buyerHidden")}</p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <SiteFooter data={home.footer} />
    </main>
  );
}
