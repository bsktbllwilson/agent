import en from "../../content/homepage.en.json";
import zh from "../../content/homepage.zh.json";
import { HomepageSchema, type Homepage } from "../../content/schema";
import type { Locale } from "@/i18n/routing";

const RAW: Record<Locale, unknown> = { en, zh };
const cache = new Map<Locale, Homepage>();

export function getHomepage(locale: Locale = "en"): Homepage {
  const cached = cache.get(locale);
  if (cached) return cached;
  const parsed = HomepageSchema.safeParse(RAW[locale]);
  if (!parsed.success) {
    throw new Error(
      `homepage.${locale}.json failed schema validation:\n${parsed.error.toString()}`,
    );
  }
  cache.set(locale, parsed.data);
  return parsed.data;
}
