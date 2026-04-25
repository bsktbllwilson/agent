import type { Metadata } from "next";
import { Plus, Eye, Heart, Mail } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSignedIn } from "@/lib/auth";
import { getOwnListings } from "@/lib/seller-listings";
import { getStatsForListings } from "@/lib/listing-stats";
import { formatPrice, formatStatus } from "@/lib/format";
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
  const t = await getTranslations({ locale, namespace: "sellListings" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function SellerListingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSignedIn();
  const t = await getTranslations("sellListings");
  const home = getHomepage(locale);
  const listings = await getOwnListings();
  const stats = await getStatsForListings(listings.map((l) => l.id));
  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      <section className="container-px py-12 sm:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95]">
                {t("heading")}
              </h1>
              <p className="mt-4 max-w-xl text-base text-ink/70 sm:text-lg">
                {t("subhead")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/sell/inquiries"
                className="rounded-full border border-ink/15 bg-cream px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                {t("inquiries")}
              </Link>
              <Link
                href="/account"
                className="rounded-full border border-ink/15 bg-cream px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                {t("account")}
              </Link>
              <Link
                href="/sell/new"
                className="inline-flex items-center gap-2 rounded-[25px] border border-ink bg-orange px-6 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                <Plus aria-hidden className="size-4" />
                {t("newListing")}
              </Link>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="mt-12 rounded-[40px] bg-white p-12 text-center sm:rounded-[60px] sm:p-16">
              <h2 className="font-display text-3xl text-ink sm:text-4xl">
                {t("emptyHeading")}
              </h2>
              <p className="mt-3 text-ink/70">{t("emptyBody")}</p>
              <Link
                href="/sell/new"
                className="mt-8 inline-flex items-center gap-2 rounded-[25px] border border-ink bg-orange px-7 py-4 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                {t("startListing")}
              </Link>
            </div>
          ) : (
            <ul className="mt-10 flex flex-col gap-3">
              {listings.map((l) => {
                const s = formatStatus(l.status);
                const st = stats[l.id] ?? { views: 0, saves: 0, inquiries: 0 };
                return (
                  <li key={l.id}>
                    <Link
                      href={`/sell/listings/${l.id}`}
                      className="flex flex-col gap-4 rounded-[24px] border border-ink/10 bg-white px-6 py-5 transition-colors hover:border-ink lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-5">
                        <StatusDot tone={s.tone} />
                        <div className="min-w-0">
                          <div className="truncate font-display text-2xl leading-[1.05] text-ink sm:text-3xl">
                            {l.name || t("untitled")}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
                            <span className="rounded-full border border-ink/10 bg-cream px-2.5 py-0.5 text-xs uppercase tracking-wide">
                              {s.label}
                            </span>
                            {l.neighborhood && <span>{l.neighborhood}</span>}
                            {l.cuisine && <span>· {l.cuisine}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 lg:gap-10">
                        {s.tone === "published" && (
                          <div className="flex gap-5 text-sm text-ink/70">
                            <Stat
                              icon={<Eye className="size-4" />}
                              value={st.views}
                              locale={dateLocale}
                            />
                            <Stat
                              icon={<Heart className="size-4" />}
                              value={st.saves}
                              locale={dateLocale}
                            />
                            <Stat
                              icon={<Mail className="size-4" />}
                              value={st.inquiries}
                              locale={dateLocale}
                            />
                          </div>
                        )}
                        <div className="hidden text-right sm:block">
                          <div className="font-display text-xl text-ink">
                            {formatPrice(l.price)}
                          </div>
                          <div className="mt-0.5 text-xs text-ink/50">
                            {t("updatedShort")}{" "}
                            {new Date(l.updated_at).toLocaleDateString(
                              dateLocale,
                              { month: "short", day: "numeric" },
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <SiteFooter data={home.footer} />
    </main>
  );
}

function Stat({
  icon,
  value,
  locale,
}: {
  icon: React.ReactNode;
  value: number;
  locale: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 tabular-nums"
      title={`${value}`}
    >
      {icon}
      {value.toLocaleString(locale)}
    </span>
  );
}

function StatusDot({
  tone,
}: {
  tone: ReturnType<typeof formatStatus>["tone"];
}) {
  const color =
    tone === "published"
      ? "bg-green-500"
      : tone === "pending"
        ? "bg-yellow"
        : tone === "rejected"
          ? "bg-orange"
          : "bg-ink/30";
  return <span className={`size-3 shrink-0 rounded-full ${color}`} aria-hidden />;
}
