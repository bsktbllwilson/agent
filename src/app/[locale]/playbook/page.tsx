import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BottomCtaStrip } from "@/components/sections/BottomCtaStrip";
import { FindYourNextBigDeal } from "@/components/sections/FindYourNextBigDeal";
import { PlaybookSubscribeCard } from "./SubscribeCard";
import { getHomepage } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "playbook" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const HERO_IMG =
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=2200&q=80";

type Category =
  | "buying"
  | "selling"
  | "legal"
  | "visa"
  | "marketEntry"
  | "operations"
  | "finance";

type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  categories: Category[];
};

// Seed content. Move to Airtable / CMS later.
const GUIDES: Guide[] = [
  {
    slug: "asian-fb-market-entry-guide-us",
    title: "The Asian F&B Market Entry Guide to US",
    excerpt:
      "Everything you need to know before opening or acquiring an Asian F&B operation in the United States — visa, capital, real estate, and team.",
    image:
      "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1400&q=80",
    categories: ["marketEntry"],
  },
  {
    slug: "which-visa-eb5-e2-l1",
    title: "Which Visa Works for Me? EB-5, E-2, or L-1?",
    excerpt:
      "A side-by-side comparison of the three most common investor visas, with capital thresholds, timelines, and family considerations.",
    image:
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=80",
    categories: ["legal", "visa"],
  },
  {
    slug: "sba-7a-loans-restaurant",
    title: "How to Use SBA 7(a) Loans to Buy Your First Restaurant",
    excerpt:
      "An operator's guide to the SBA 7(a) program: who qualifies, how to package financials, and which lenders specialize in F&B deals.",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80",
    categories: ["finance"],
  },
  {
    slug: "30-point-due-diligence",
    title: "30-Point Due Diligence",
    excerpt:
      "The checklist we run on every restaurant deal before signing — leases, payroll, vendors, permits, and the questions sellers don't volunteer.",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=80",
    categories: ["buying"],
  },
  {
    slug: "value-restaurant-before-selling",
    title: "How To Value Your Restaurant Before Selling",
    excerpt:
      "Three valuation methods (SDE multiple, DCF, asset-based), plus the tweaks specific to ethnic and immigrant-owned operations.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80",
    categories: ["selling"],
  },
  {
    slug: "lease-negotiation-asian-restaurants",
    title: "Lease Negotiation for Asian-Owned Restaurants",
    excerpt:
      "Translation issues, percentage rent, hood-system clauses, and the kitchen build-out terms that landlords routinely push back on.",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80",
    categories: ["operations", "legal"],
  },
];

type SearchParams = { category?: Category | "all" };

export default async function PlaybookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("playbook");
  const home = getHomepage(locale);
  const sp = await searchParams;
  const active: Category | "all" = sp.category ?? "all";

  const filtered =
    active === "all"
      ? GUIDES
      : GUIDES.filter((g) => g.categories.includes(active));

  const filterKeys: (Category | "all")[] = [
    "all",
    "buying",
    "selling",
    "legal",
    "visa",
    "marketEntry",
    "operations",
    "finance",
  ];

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      {/* Hero */}
      <section className="relative isolate flex min-h-[440px] items-center justify-center overflow-hidden text-cream">
        <Image
          src={HERO_IMG}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/35 via-ink/30 to-ink/55" />
        <h1 className="relative z-10 text-center font-display text-[clamp(4rem,18vw,16rem)] leading-[0.85]">
          {t("heroTitle")}
        </h1>
      </section>

      {/* Filter chips */}
      <section className="container-px pt-14 sm:pt-20">
        <div className="mx-auto flex max-w-[1440px] flex-wrap gap-3">
          {filterKeys.map((key) => {
            const isActive = key === active;
            const label =
              key === "all"
                ? t("filterAll")
                : t(`filters.${key as Category}`);
            const href =
              key === "all"
                ? "/playbook"
                : `/playbook?category=${encodeURIComponent(key)}`;
            return (
              <Link
                key={key}
                href={href}
                className={[
                  "inline-flex items-center justify-center rounded-full border border-ink px-5 py-2 text-sm font-medium uppercase tracking-wide transition-colors",
                  isActive
                    ? "bg-yellow text-ink"
                    : "bg-transparent text-ink hover:bg-ink/5",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Guide grid (with embedded subscribe card after the 2nd item) */}
      <section className="container-px pb-12 pt-10 sm:pt-14">
        <div className="mx-auto grid max-w-[1440px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.flatMap((guide, i) => {
            const card = (
              <GuideCard
                key={guide.slug}
                guide={guide}
                readGuide={t("readGuide")}
                categoryLabels={{
                  buying: t("filters.buying"),
                  selling: t("filters.selling"),
                  legal: t("filters.legal"),
                  visa: t("filters.visa"),
                  marketEntry: t("filters.marketEntry"),
                  operations: t("filters.operations"),
                  finance: t("filters.finance"),
                }}
              />
            );
            if (i === 1) {
              return [
                card,
                <PlaybookSubscribeCard
                  key="subscribe-card"
                  title={t("subscribeCardTitle")}
                  body={t("subscribeCardBody")}
                  emailPlaceholder={t("subscribeEmail")}
                  cta={t("subscribeCta")}
                  successMsg={t("subscribed")}
                />,
              ];
            }
            return [card];
          })}
        </div>
      </section>

      <FindYourNextBigDeal />
      <BottomCtaStrip />
      <SiteFooter data={home.footer} />
    </main>
  );
}

function GuideCard({
  guide,
  readGuide,
  categoryLabels,
}: {
  guide: Guide;
  readGuide: string;
  categoryLabels: Record<Category, string>;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[40px] bg-white">
      <div className="relative aspect-[5/3] w-full overflow-hidden">
        <Image
          src={guide.image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute right-5 top-5 flex flex-wrap gap-2">
          {guide.categories.map((c) => (
            <span
              key={c}
              className="rounded-full border border-ink bg-yellow px-3 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-ink"
            >
              {categoryLabels[c]}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-7 sm:p-8">
        <h3 className="font-display text-[clamp(1.5rem,2.4vw,2.25rem)] leading-[1.1]">
          {guide.title}
        </h3>
        <p className="text-base leading-relaxed text-ink/55">{guide.excerpt}</p>
        <Link
          href={`/playbook/${guide.slug}`}
          className="mt-auto inline-flex w-fit items-center gap-2 text-base font-medium underline underline-offset-4 hover:text-orange"
        >
          {readGuide}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </article>
  );
}
