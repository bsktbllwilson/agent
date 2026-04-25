import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BottomCtaStrip } from "@/components/sections/BottomCtaStrip";
import { FindYourNextBigDeal } from "@/components/sections/FindYourNextBigDeal";
import { getHomepage } from "@/lib/content";
import { getFeaturedListings } from "@/lib/listings";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

// Revalidate homepage every 60s so featured listings stay fresh.
export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = getHomepage(locale);
  const tHero = await getTranslations("hero");
  const t = await getTranslations("homepage");
  const liveListings = await getFeaturedListings(4);

  return (
    <main className="min-h-[100dvh] bg-cream">
      <SiteHeader nav={content.nav} />

      {/* Hero */}
      <section className="container-px pb-12 pt-16 sm:pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center text-center">
          <h1 className="font-display text-[clamp(3.25rem,8vw,7rem)] leading-[0.95]">
            {content.hero.headline}
          </h1>
          <p className="mt-8 max-w-3xl text-[clamp(1.125rem,2vw,2.25rem)] leading-snug text-ink">
            {content.hero.subhead}
          </p>

          {/* Search pill */}
          <form
            action="/listings"
            method="get"
            className="mt-12 w-full max-w-[1151px]"
          >
            <div className="flex flex-col gap-2 rounded-[24px] border border-ink bg-white p-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.18)] sm:flex-row sm:items-stretch">
              <label className="flex flex-1 items-center px-4 sm:px-6">
                <span className="sr-only">{tHero("cityPlaceholder")}</span>
                <input
                  name="q"
                  type="text"
                  placeholder={tHero("cityPlaceholder")}
                  className="w-full bg-transparent py-4 text-lg text-ink outline-none placeholder:text-ink/50"
                />
              </label>
              <div className="hidden w-px self-stretch bg-ink/20 sm:block" />
              <label className="relative flex flex-1 items-center px-4 sm:px-6">
                <span className="sr-only">{tHero("industryPlaceholder")}</span>
                <select
                  name="subtype"
                  defaultValue=""
                  className="w-full appearance-none bg-transparent py-4 pr-8 text-lg text-ink outline-none"
                >
                  <option value="">{tHero("industryPlaceholder")}</option>
                  {content.hero.industryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-5 size-5 text-ink/60"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-ink bg-orange px-8 py-4 text-lg font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                {tHero("find")}
                <ArrowRight aria-hidden className="size-5" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Trending Hotspots */}
      <section className="container-px py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none">
              {t("trendingHeading")}
            </h2>
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-base font-medium underline-offset-4 hover:underline sm:text-lg"
            >
              {t("moreListings")}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(liveListings.length > 0
              ? liveListings.map((l) => ({
                  id: l.id,
                  href: `/listings/${l.slug ?? ""}`,
                  name: l.name,
                  meta: [l.neighborhood, l.cuisine].filter(Boolean).join(" | "),
                  price: formatPrice(l.price),
                  image:
                    l.hero_url ??
                    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
                }))
              : content.trendingHotspots.items.map((item) => ({
                  id: item.id,
                  href: `/listings`,
                  name: item.name,
                  meta: `${item.city}, ${item.state} | ${item.category}`,
                  price: item.price,
                  image: item.image,
                }))
            ).map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="group relative isolate flex aspect-[5/7] items-end overflow-hidden rounded-[28px]"
              >
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                <div className="relative z-10 flex w-full flex-col items-center gap-1 p-6 text-center text-cream">
                  <h3 className="font-display text-[clamp(1.5rem,2.5vw,2.5rem)] leading-[1.05]">
                    {card.name}
                  </h3>
                  <p className="text-sm text-cream/85">{card.meta}</p>
                  <p className="mt-1 text-base font-semibold">{card.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Our Plates Are Full — 4 orange cards */}
      <section className="container-px py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none">
            {t("platesHeading")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <PlateCard
              title={t("platesBilingualTitle")}
              body={t("platesBilingualBody")}
              cta={t("platesGetStarted")}
              href="/sell/new"
            />
            <PlateCard
              title={t("platesDataTitle")}
              body={t("platesDataBody")}
              cta={t("platesMarketTools")}
              href="/tools"
            />
            <PlateCard
              title={t("platesDemandTitle")}
              body={t("platesDemandBody")}
              cta={t("platesViewSources")}
              href="/playbook"
            />
            <PlateCard
              title={t("platesCuratedTitle")}
              body={t("platesCuratedBody")}
              cta={t("platesAccessPlaybooks")}
              href="/playbook"
            />
          </div>
        </div>
      </section>

      <BottomCtaStrip />

      {/* Stats band */}
      <section className="bg-yellow py-20 sm:py-28">
        <div className="container-px">
          <div className="mx-auto max-w-[1440px]">
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none">
              {t("statsHeading")}
            </h2>
            <div className="mt-12 grid grid-cols-2 gap-10 md:grid-cols-4">
              {content.stats.items.map((stat, i) => {
                const labels = [
                  t("stat1"),
                  t("stat2"),
                  t("stat3"),
                  t("stat4"),
                ];
                return (
                  <div key={stat.label} className="flex flex-col gap-3">
                    <div className="font-display text-[clamp(2.75rem,4vw,4rem)] leading-none">
                      {stat.prefix}
                      {stat.value.toLocaleString()}
                      {stat.suffix}
                    </div>
                    <p className="text-base leading-relaxed text-ink/85 sm:text-lg">
                      {labels[i] ?? stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Partner logos */}
      <section className="container-px py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none">
            {t("partnersHeading")}
          </h2>
          <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {content.partners.items.map((p) => (
              <li key={p.name}>
                <a
                  href={p.href}
                  aria-label={p.name}
                  className="block rounded-full border border-ink/20 px-6 py-3 font-display text-xl text-ink/80 transition-colors hover:border-ink hover:text-ink sm:text-2xl"
                >
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FindYourNextBigDeal />
      <SiteFooter data={content.footer} />
    </main>
  );
}

function PlateCard({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <article className="flex flex-col gap-5 rounded-[40px] border-[3px] border-ink/75 bg-orange p-8 text-cream sm:rounded-[50px] sm:p-10">
      <h3 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
        {title}
      </h3>
      <p className="text-base leading-relaxed text-cream/95 sm:text-lg">
        {body}
      </p>
      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-2 text-base font-semibold underline underline-offset-4 hover:text-cream/80"
      >
        {cta}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </article>
  );
}
