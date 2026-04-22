import type { MetadataRoute } from "next";
import { getPublishedListings } from "@/lib/listings";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://passtheplate.store";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${BASE}/listings`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE}/sell`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const listings = await getPublishedListings({}, { limit: 1000 });
  const dynamicRoutes: MetadataRoute.Sitemap = listings
    .filter((l) => !!l.slug)
    .map((l) => ({
      url: `${BASE}/listings/${l.slug}`,
      lastModified: l.published_at
        ? new Date(l.published_at)
        : new Date(l.updated_at ?? l.created_at ?? now),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticRoutes, ...dynamicRoutes];
}
