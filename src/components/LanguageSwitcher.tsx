"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  tone = "ink",
}: {
  tone?: "ink" | "cream";
}) {
  const t = useTranslations("header");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale || pending) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  const isCream = tone === "cream";
  return (
    <div
      role="group"
      aria-label={t("switchLanguage")}
      className={cn(
        "inline-flex items-center rounded-full border p-0.5 text-xs font-medium",
        isCream ? "border-cream/30 bg-cream/10 text-cream" : "border-ink/15 bg-white text-ink",
      )}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        const label = code === "zh" ? t("languageZh") : t("languageEn");
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            disabled={pending}
            aria-pressed={active}
            className={cn(
              "rounded-full px-2.5 py-1 leading-none transition-colors",
              active
                ? isCream
                  ? "bg-cream text-ink"
                  : "bg-ink text-cream"
                : "opacity-70 hover:opacity-100",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
