import type { Metadata } from "next";
import { Plus, Eye, Heart, Mail } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSignedIn } from "@/lib/auth";
import { getOwnListings } from "@/lib/seller-listings";
import { getStatsForListings } from "@/lib/listing-stats";
import { formatPrice, formatStatus } from "@/lib/format";
import { Wordmark } from "@/components/Wordmark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
  const tHeader = await getTranslations("header");
  const listings = await getOwnListings();
  const stats = await getStatsForListings(listings.map((l) => l.id));
  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";

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
              href="/sell/inquiries"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {t("inquiries")}
            </Link>
            <Link
              href="/account"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {t("account")}
            </Link>
          </div>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-section text-ink">{t("heading")}</h1>
              <p className="mt-2 text-ink/70">{t("subhead")}</p>
            </div>
            <Link
              href="/sell/new"
              className="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              <Plus aria-hidden className="size-4" />
              {t("newListing")}
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="mt-10 rounded-[1.5rem] border border-ink/10 bg-white p-12 text-center">
              <h2 className="font-display text-3xl text-ink">
                {t("emptyHeading")}
              </h2>
              <p className="mt-2 text-ink/70">{t("emptyBody")}</p>
              <Link
                href="/sell/new"
                className="mt-6 inline-flex rounded-full bg-orange px-7 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                {t("startListing")}
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-4">
              {listings.map((l) => {
                const s = formatStatus(l.status);
                const st = stats[l.id] ?? { views: 0, saves: 0, inquiries: 0 };
                return (
                  <Link
                    key={l.id}
                    href={`/sell/listings/${l.id}`}
                    className="flex flex-col gap-4 rounded-[1.25rem] border border-ink/10 bg-white px-6 py-5 transition-colors hover:border-ink lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-center gap-5 min-w-0">
                      <StatusDot tone={s.tone} />
                      <div className="min-w-0">
                        <div className="truncate font-display text-xl text-ink">
                          {l.name || t("untitled")}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
                          <span>{s.label}</span>
                          {l.neighborhood && <span>· {l.neighborhood}</span>}
                          {l.cuisine && <span>· {l.cuisine}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 lg:gap-8">
                      {s.tone === "published" && (
                        <div className="flex gap-4 text-sm text-ink/70">
                          <Stat icon={<Eye className="size-4" />} value={st.views} locale={dateLocale} />
                          <Stat icon={<Heart className="size-4" />} value={st.saves} locale={dateLocale} />
                          <Stat icon={<Mail className="size-4" />} value={st.inquiries} locale={dateLocale} />
                        </div>
                      )}
                      <div className="hidden text-right sm:block">
                        <div className="font-medium text-ink">
                          {formatPrice(l.price)}
                        </div>
                        <div className="mt-0.5 text-xs text-ink/50">
                          {t("updatedShort")}{" "}
                          {new Date(l.updated_at).toLocaleDateString(dateLocale, {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
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
        ? "bg-yellow text-ink"
        : tone === "rejected"
          ? "bg-orange"
          : tone === "draft"
            ? "bg-ink/30"
            : "bg-ink/30";
  return <span className={`size-2.5 rounded-full ${color}`} aria-hidden />;
}
