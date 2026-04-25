import type { Metadata } from "next";
import { ArrowRight, Handshake, ShieldCheck, Users } from "lucide-react";
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

      <section className="container-px mt-16 sm:mt-24">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
          <span className="w-fit rounded-full border border-ink/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-ink/70">
            {t("eyebrow")}
          </span>
          <h1 className="text-hero text-ink">
            {t("headingBefore")}
            <span className="italic">{t("headingItalic")}</span>
            {t("headingAfter")}
          </h1>
          <p className="max-w-2xl text-xl text-ink/70">{t("subhead")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={startHref}
              className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-4 text-base font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              {t("startListing")}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              href="/sell/listings"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-7 py-4 text-base font-medium text-ink transition-colors hover:border-ink"
            >
              {t("yourListings")}
            </Link>
          </div>
          <p className="text-sm text-ink/60">{t("freeNote")}</p>
        </div>
      </section>

      <section className="container-px mt-24">
        <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-3">
          <FeatureCard
            Icon={ShieldCheck}
            title={t("feature1Title")}
            body={t("feature1Body")}
          />
          <FeatureCard
            Icon={Handshake}
            title={t("feature2Title")}
            body={t("feature2Body")}
          />
          <FeatureCard
            Icon={Users}
            title={t("feature3Title")}
            body={t("feature3Body")}
          />
        </div>
      </section>

      <section className="container-px mt-24">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-section text-ink">{t("howItWorks")}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            <Step n={1} title={t("step1Title")} body={t("step1Body")} />
            <Step n={2} title={t("step2Title")} body={t("step2Body")} />
            <Step n={3} title={t("step3Title")} body={t("step3Body")} />
            <Step n={4} title={t("step4Title")} body={t("step4Body")} />
          </ol>

          <div className="mt-12 flex justify-center">
            <Link
              href={startHref}
              className="inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-lg font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
            >
              {t("startListing")}
              <ArrowRight aria-hidden className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-24">
        <BottomCtaStrip />
      </div>
      <SiteFooter data={home.footer} />
    </main>
  );
}

function FeatureCard({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-8">
      <Icon aria-hidden className="size-6 text-orange" />
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="text-ink/70">{body}</p>
    </article>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex flex-col gap-2 rounded-[1.5rem] border border-ink/10 bg-white p-6">
      <span className="font-display text-5xl text-orange">{n}</span>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="text-sm text-ink/70">{body}</p>
    </li>
  );
}
