import type { MetadataRoute } from "next";
import { getPublishedListings } from "@/lib/listings";
import { routing } from "@/i18n/routing";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://passtheplate.store";

export const revalidate = 3600;

// `as-needed` prefix mode: default locale is at /, others under /<locale>.
function localizedUrl(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return `${BASE}${path}`;
  return `${BASE}/${locale}${path === "/" ? "" : path}`;
}

function alternates(path: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = localizedUrl(path, locale);
  }
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = ["/", "/listings", "/sell"];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(path, locale),
      lastModified: now,
      changeFrequency:
        path === "/" ? "daily" : path === "/listings" ? "hourly" : "weekly",
      priority: path === "/" ? 1 : path === "/listings" ? 0.9 : 0.7,
      alternates: alternates(path),
    })),
  );

  const listings = await getPublishedListings({}, { limit: 1000 });
  const dynamicRoutes: MetadataRoute.Sitemap = listings
    .filter((l) => !!l.slug)
    .flatMap((l) => {
      const path = `/listings/${l.slug}`;
      const lastModified = l.published_at
        ? new Date(l.published_at)
        : new Date(l.updated_at ?? l.created_at ?? now);
      return routing.locales.map((locale) => ({
        url: localizedUrl(path, locale),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: alternates(path),
      }));
    });

  return [...staticRoutes, ...dynamicRoutes];
}
