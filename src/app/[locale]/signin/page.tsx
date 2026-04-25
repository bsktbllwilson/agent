import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { getHomepage } from "@/lib/content";
import { SignInClient } from "./SignInClient";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "signin" });
  return { title: t("title") + " — Pass The Plate" };
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("signin");
  const home = getHomepage(locale);

  const labels = {
    title: t("title"),
    subhead: t("subhead"),
    emailLabel: t("emailLabel"),
    emailPlaceholder: t("emailPlaceholder"),
    submit: t("submit"),
    submitting: t("submitting"),
    sentHeading: t("sentHeading"),
    errorInvalid: t("errorInvalid"),
    errorGeneric: t("errorGeneric"),
    successToast: t("successToast"),
  };

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      <section className="container-px py-16 sm:py-24">
        <div className="mx-auto max-w-[640px] rounded-[40px] bg-white p-8 sm:rounded-[60px] sm:p-12 lg:rounded-[80px] lg:p-16">
          <h1 className="text-center font-display text-[clamp(3rem,6vw,5rem)] leading-[0.95]">
            {t("title")}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-center text-base text-ink/70 sm:text-lg">
            {t("subhead")}
          </p>
          <SignInClient labels={labels} sentBodyTemplate={t("sentBody")} />
        </div>
      </section>

      <SiteFooter data={home.footer} />
    </main>
  );
}
