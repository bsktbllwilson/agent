import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh"] as const,
  defaultLocale: "en",
  // English URLs stay at /, /listings, etc. Chinese gets the /zh prefix.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
