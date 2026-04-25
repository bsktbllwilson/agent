import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BottomCtaStrip } from "@/components/sections/BottomCtaStrip";
import { getCurrentUser } from "@/lib/auth";
import { getHomepage } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sell" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export const dynamic = "force-dynamic";

const HERO_IMG =
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=2000&q=80";
// Static map placeholder. Real interactive map can come later via the
// existing react-leaflet components or a tile provider.
const MAP_IMG =
  "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=2200&q=80";

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sell");
  const home = getHomepage(locale);
  const user = await getCurrentUser();
  const startHref = user ? "/sell/new" : "/signin?next=/sell/new";

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      {/* Hero with photo background */}
      <section className="relative isolate min-h-[640px] overflow-hidden text-cream">
        <Image
          src={HERO_IMG}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/35 to-ink/70" />
        <div className="container-px relative z-10 flex min-h-[640px] flex-col items-center justify-center py-24 text-center">
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95]">
            {t("hero.line1")}
            <br />
            {t("hero.line2")}
          </h1>
          <p className="mt-8 max-w-2xl text-[clamp(1.125rem,1.6vw,1.5rem)] leading-snug text-cream/95">
            {t("hero.sub1")}
            <br />
            {t("hero.sub2")}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={startHref}
              className="inline-flex items-center justify-center gap-2 rounded-[25px] border border-ink bg-orange px-10 py-5 text-lg font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              {t("hero.listCta")}
              <ArrowRight aria-hidden className="size-5" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center gap-2 rounded-[25px] border border-ink bg-orange px-10 py-5 text-lg font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              {t("hero.valuationCta")}
              <ArrowRight aria-hidden className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works — 4 cards */}
      <section className="container-px py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            title={t("cards.bilingualTitle")}
            body={t("cards.bilingualBody")}
            cta={t("cards.bilingualCta")}
            href="/sell/new"
          />
          <FeatureCard
            title={t("cards.dataTitle")}
            body={t("cards.dataBody")}
            cta={t("cards.dataCta")}
            href="/tools"
          />
          <FeatureCard
            title={t("cards.demandTitle")}
            body={t("cards.demandBody")}
            cta={t("cards.demandCta")}
            href="/playbook"
          />
          <FeatureCard
            title={t("cards.curatedTitle")}
            body={t("cards.curatedBody")}
            cta={t("cards.curatedCta")}
            href="/playbook"
          />
        </div>
      </section>

      {/* Listing Hotspots — yellow band with search + map */}
      <section className="bg-yellow py-16 sm:py-20">
        <div className="container-px">
          <div className="mx-auto max-w-[1440px]">
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none text-ink">
              {t("hotspots.heading")}
            </h2>

            <form
              action="/listings"
              method="get"
              className="mt-8 flex flex-col gap-2 rounded-[25px] border border-ink bg-white p-2 sm:flex-row sm:items-stretch"
            >
              <label className="flex flex-1 items-center px-4 sm:px-6">
                <span className="sr-only">{t("hotspots.cityPlaceholder")}</span>
                <input
                  name="q"
                  type="text"
                  placeholder={t("hotspots.cityPlaceholder")}
                  className="w-full bg-transparent py-4 text-lg text-ink outline-none placeholder:text-ink/50"
                />
              </label>
              <div className="hidden w-px self-stretch bg-ink/20 sm:block" />
              <label className="relative flex flex-1 items-center px-4 sm:px-6">
                <span className="sr-only">
                  {t("hotspots.industryPlaceholder")}
                </span>
                <select
                  name="subtype"
                  defaultValue=""
                  className="w-full appearance-none bg-transparent py-4 pr-8 text-lg text-ink outline-none"
                >
                  <option value="">{t("hotspots.industryPlaceholder")}</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Grocery">Grocery</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Manufacturing">Manufacturing</option>
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-5 size-5 text-ink/60"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-orange px-8 py-4 text-lg font-semibold uppercase text-cream transition-colors hover:bg-[rgb(210,68,28)]"
              >
                {t("hotspots.search")}
                <ArrowRight aria-hidden className="size-5" />
              </button>
            </form>

            <div className="relative mt-8 h-[440px] w-full overflow-hidden rounded-[24px] border border-ink/10">
              <Image
                src={MAP_IMG}
                alt=""
                fill
                sizes="(max-width: 1440px) 100vw, 1440px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-yellow/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band — yellow continuation */}
      <section className="bg-yellow pb-20 sm:pb-28">
        <div className="container-px">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <Stat value={t("stats.stat1Value")} body={t("stats.stat1Body")} />
            <Stat value={t("stats.stat2Value")} body={t("stats.stat2Body")} />
            <Stat value={t("stats.stat3Value")} body={t("stats.stat3Body")} />
            <Stat value={t("stats.stat4Value")} body={t("stats.stat4Body")} />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-px py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] rounded-[47px] bg-white/30 p-10 sm:p-16">
          <h2 className="font-display text-[clamp(2.5rem,4vw,3.75rem)] leading-none text-ink">
            {t("testimonials.heading")}
          </h2>
          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <Testimonial
              quote={t("testimonials.quote1")}
              name={t("testimonials.name1")}
              role={t("testimonials.role1")}
              city={t("testimonials.city1")}
            />
            <Testimonial
              quote={t("testimonials.quote2")}
              name={t("testimonials.name2")}
              role={t("testimonials.role2")}
              city={t("testimonials.city2")}
            />
          </div>
        </div>
      </section>

      <BottomCtaStrip />
      <SiteFooter data={home.footer} />
    </main>
  );
}

function FeatureCard({
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

function Stat({ value, body }: { value: string; body: string }) {
  return (
    <div className="flex flex-col gap-3 text-ink">
      <div className="font-display text-[clamp(2.25rem,3.5vw,3.5rem)] leading-none">
        {value}
      </div>
      <p className="text-base leading-relaxed text-ink/90 sm:text-lg">{body}</p>
    </div>
  );
}

function Testimonial({
  quote,
  name,
  role,
  city,
}: {
  quote: string;
  name: string;
  role: string;
  city: string;
}) {
  return (
    <figure className="flex flex-col gap-6">
      <blockquote className="text-xl leading-relaxed text-ink sm:text-2xl">
        “{quote}”
      </blockquote>
      <figcaption className="flex flex-col gap-1">
        <div className="font-display text-[clamp(2rem,3vw,3.25rem)] leading-none text-ink">
          {name}
        </div>
        <div className="text-base text-ink/60 sm:text-lg">
          {role}
          <br />
          {city}
        </div>
      </figcaption>
    </figure>
  );
}
