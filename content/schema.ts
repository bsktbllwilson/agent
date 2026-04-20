import { z } from "zod";

export const HeroSchema = z.object({
  headline: z.string(),
  italicWord: z.string(),
  subhead: z.string(),
  searchPlaceholders: z.object({
    location: z.string(),
    industry: z.string(),
  }),
  locationOptions: z.array(z.string()),
  industryOptions: z.array(z.string()),
});

export const ListingSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  state: z.string(),
  price: z.string(),
  category: z.string(),
  image: z.string(),
});

export const CategorySchema = z.object({
  slug: z.string(),
  label: z.string(),
  image: z.string(),
  tagline: z.string(),
});

export const BuySellPanelSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  italicWord: z.string().optional(),
  body: z.string(),
  cta: z.object({ label: z.string(), href: z.string() }),
  image: z.string(),
});

export const StatSchema = z.object({
  value: z.number(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  label: z.string(),
});

export const PartnerSchema = z.object({
  name: z.string(),
  href: z.string(),
});

export const FooterColumnSchema = z.object({
  heading: z.string(),
  links: z.array(
    z.object({ label: z.string(), href: z.string() }),
  ),
});

export const NavItemSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const HomepageSchema = z.object({
  nav: z.array(NavItemSchema),
  hero: HeroSchema,
  trendingHotspots: z.object({
    heading: z.string(),
    cta: z.object({ label: z.string(), href: z.string() }),
    items: z.array(ListingSchema),
  }),
  categories: z.object({
    heading: z.string(),
    italicWord: z.string().optional(),
    subhead: z.string(),
    items: z.array(CategorySchema),
  }),
  buySell: z.object({
    buy: BuySellPanelSchema,
    sell: BuySellPanelSchema,
  }),
  stats: z.object({
    heading: z.string(),
    italicWord: z.string().optional(),
    items: z.array(StatSchema),
  }),
  partners: z.object({
    heading: z.string(),
    italicWord: z.string().optional(),
    items: z.array(PartnerSchema),
  }),
  subscribe: z.object({
    heading: z.string(),
    italicWord: z.string().optional(),
    body: z.string(),
    placeholder: z.string(),
    cta: z.string(),
    success: z.string(),
  }),
  footer: z.object({
    tagline: z.string(),
    columns: z.array(FooterColumnSchema),
    legal: z.string(),
  }),
});

export type Homepage = z.infer<typeof HomepageSchema>;
export type Listing = z.infer<typeof ListingSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Stat = z.infer<typeof StatSchema>;
export type FooterColumn = z.infer<typeof FooterColumnSchema>;
export type BuySellPanel = z.infer<typeof BuySellPanelSchema>;
