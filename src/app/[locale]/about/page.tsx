import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BottomCtaStrip } from "@/components/sections/BottomCtaStrip";
import { getHomepage } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = { title: "Who We Are — Pass The Plate" };

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const home = getHomepage(locale);
  const isZh = locale === "zh";

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />
      <section className="container-px py-24 text-center">
        <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-none">
          {isZh ? "关于我们" : "Who We Are"}
        </h1>
        <p className="mt-6 text-lg text-ink/60">
          {isZh ? "敬请期待 — 即将上线。" : "Coming soon."}
        </p>
      </section>
      <div className="mt-12">
        <BottomCtaStrip />
      </div>
      <SiteFooter data={home.footer} />
    </main>
  );
}
