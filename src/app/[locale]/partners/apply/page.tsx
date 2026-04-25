import type { Metadata } from "next";
import { Briefcase, Gavel, Banknote } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BottomCtaStrip } from "@/components/sections/BottomCtaStrip";
import { getHomepage } from "@/lib/content";
import { PartnerApplicationForm } from "./Form";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partner" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PartnerApplyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("partner");
  const home = getHomepage(locale);

  // Pre-resolve label/placeholder strings once on the server so the client
  // form doesn't need to re-fetch translations.
  const labels = {
    fullName: t("fields.fullName"),
    jobTitle: t("fields.jobTitle"),
    phone: t("fields.phone"),
    email: t("fields.email"),
    company: t("fields.company"),
    website: t("fields.website"),
    address: t("fields.address"),
    specialty: t("fields.specialty"),
    specialtyPlaceholder: t("fields.specialtyPlaceholder"),
    referral: t("fields.referral"),
    referralPlaceholder: t("fields.referralPlaceholder"),
    bio: t("fields.bio"),
    bioPlaceholder: t("fields.bioPlaceholder"),
    submit: t("submit"),
    submitting: t("submitting"),
    success: t("success"),
  };

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      {/* Form card */}
      <section className="container-px pt-12 sm:pt-20">
        <div className="mx-auto max-w-[1476px] rounded-[40px] bg-white p-8 sm:rounded-[60px] sm:p-12 lg:rounded-[80px] lg:p-16">
          <h1 className="text-center font-display text-[clamp(3rem,6vw,5rem)] leading-[0.95]">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-base text-ink/70 sm:text-lg">
            {t("intro")}
          </p>
          <PartnerApplicationForm labels={labels} />
        </div>
      </section>

      {/* Who We're Looking For */}
      <section className="container-px py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center font-display text-[clamp(3rem,6vw,5rem)] leading-[0.95]">
            {t("lookingForHeading")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base text-ink/70 sm:text-lg">
            {t("lookingForBody")}
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <SpecCard
              Icon={Briefcase}
              title={t("spec1Title")}
              body={t("spec1Body")}
            />
            <SpecCard
              Icon={Gavel}
              title={t("spec2Title")}
              body={t("spec2Body")}
            />
            <SpecCard
              Icon={Banknote}
              title={t("spec3Title")}
              body={t("spec3Body")}
            />
          </div>
        </div>
      </section>

      <BottomCtaStrip />
      <SiteFooter data={home.footer} />
    </main>
  );
}

function SpecCard({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-[30px] border border-ink/10 bg-white p-8">
      <Icon aria-hidden className="size-6 text-orange" />
      <h3 className="font-display text-[clamp(1.75rem,2.5vw,2.25rem)] leading-[1.05]">
        {title}
      </h3>
      <p className="text-base text-ink/70 sm:text-lg">{body}</p>
    </article>
  );
}
