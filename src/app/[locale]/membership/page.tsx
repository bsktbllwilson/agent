import type { Metadata } from "next";
import { ArrowRight, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BottomCtaStrip } from "@/components/sections/BottomCtaStrip";
import { getHomepage } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "membership" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

type Tier = {
  name: string;
  price: string;
  cadence: string;
  body: string;
  bullets: string[];
  cta: string;
  featured?: boolean;
};

type Faq = { q: string; a: string };

export default async function MembershipPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("membership");
  const home = getHomepage(locale);

  const tiers: Tier[] = [
    {
      name: t("tiers.freeName"),
      price: t("tiers.freePrice"),
      cadence: t("tiers.freeCadence"),
      body: t("tiers.freeBody"),
      bullets: [
        t("tiers.freeBullet1"),
        t("tiers.freeBullet2"),
        t("tiers.freeBullet3"),
      ],
      cta: t("tiers.freeCta"),
    },
    {
      name: t("tiers.midName"),
      price: t("tiers.midPrice"),
      cadence: t("tiers.midCadence"),
      body: t("tiers.midBody"),
      bullets: [
        t("tiers.midBullet1"),
        t("tiers.midBullet2"),
        t("tiers.midBullet3"),
        t("tiers.midBullet4"),
        t("tiers.midBullet5"),
      ],
      cta: t("tiers.midCta"),
      featured: true,
    },
    {
      name: t("tiers.topName"),
      price: t("tiers.topPrice"),
      cadence: t("tiers.topCadence"),
      body: t("tiers.topBody"),
      bullets: [
        t("tiers.topBullet1"),
        t("tiers.topBullet2"),
        t("tiers.topBullet3"),
        t("tiers.topBullet4"),
        t("tiers.topBullet5"),
      ],
      cta: t("tiers.topCta"),
    },
  ];

  // Pull array via raw — t.raw returns the underlying value (typed as unknown).
  const faqs = (t.raw("faqs") as Faq[]) ?? [];

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      {/* Hero intro */}
      <section className="container-px pt-16 pb-8 sm:pt-24 text-center">
        <h1 className="font-display text-[clamp(3rem,6vw,5rem)] leading-[0.95]">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
          {t("heroBody")}
        </p>
      </section>

      {/* Tiers */}
      <section className="container-px pb-16">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className="flex flex-col gap-6 rounded-[40px] border-[3px] border-ink bg-yellow p-8 sm:p-10"
            >
              <header className="text-center">
                <h2 className="font-display text-[clamp(2rem,3vw,3rem)] leading-none text-ink">
                  {tier.name}
                </h2>
                <div className="mt-3 font-display text-[clamp(2rem,3vw,3rem)] leading-none text-ink">
                  {tier.price}
                  <span className="text-ink/60"> {tier.cadence}</span>
                </div>
              </header>
              <p className="text-center text-base text-ink/80">{tier.body}</p>
              <ul className="flex flex-col gap-2 border-y border-ink/15 py-5 text-center text-base text-ink">
                {tier.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <Link
                href="/signin?next=/account"
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 text-base font-semibold text-cream transition-colors hover:bg-ink/85"
              >
                {tier.cta}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="container-px py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center font-display text-[clamp(3rem,6vw,5rem)] leading-none">
            {t("faqsHeading")}
          </h2>
          <div className="mx-auto mt-12 flex max-w-[1280px] flex-col gap-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-[25px] border border-ink bg-white/50 px-6 py-5 transition-colors open:bg-white sm:px-8"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium text-ink sm:text-lg">
                  <span>{faq.q}</span>
                  <Plus
                    aria-hidden
                    className="size-5 shrink-0 transition-transform group-open:rotate-45"
                  />
                </summary>
                <p className="mt-4 max-w-[64ch] text-base leading-relaxed text-ink/70 sm:text-lg">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <BottomCtaStrip />
      <SiteFooter data={home.footer} />
    </main>
  );
}
