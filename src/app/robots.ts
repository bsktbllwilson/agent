import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://passtheplate.store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep authenticated workspaces + API internals out of the index.
        disallow: [
          "/account",
          "/signin",
          "/auth/",
          "/admin",
          "/admin/",
          "/sell/listings",
          "/sell/new",
          "/sell/inquiries",
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
