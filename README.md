# Pass The Plate — Landing Page

The marketing homepage for **Pass The Plate**, the first marketplace for the
$240B+ Asian F&B business transition (buying and selling Asian-owned
restaurants, grocery, manufacturing, and more).

This is a single-page build — production-ready, deployable to Vercel.

## Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first `@theme` config in `globals.css`)
- **Content:** `content/homepage.json`, strongly typed & validated at build
  time with Zod (`content/schema.ts`)
- **Animation:** framer-motion (respects `prefers-reduced-motion`)
- **Toasts:** sonner
- **Icons:** lucide-react
- **Package manager:** pnpm (Node 20+)

## Scripts

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
pnpm start
pnpm lint
```

## Editing content

All copy, listing cards, categories, stats, partner names, and footer links
live in **`content/homepage.json`**. The JSON is validated against
`content/schema.ts` at build time — invalid data fails the build early.

Swap images via the `image` fields (supports Unsplash URLs; external hosts
must be allowed in `next.config.mjs` under `images.remotePatterns`).

## Design tokens

Defined in `src/app/globals.css` under `@theme`:

| Token | Value | Use |
|---|---|---|
| `--color-cream` | `rgb(248, 243, 222)` | page background |
| `--color-orange` | `rgb(230, 78, 33)` | primary CTA, header pill |
| `--color-yellow` | `rgb(255, 239, 124)` | stats band |
| `--color-ink` | `#000` | body text, borders |
| `--font-display` | `please-display-vf` | headlines |
| `--font-body` | `proxima-nova` | body text |

Fonts are loaded from Adobe Typekit kit `cub1hgl` via a `<link>` in
`src/app/layout.tsx`.

## Page structure

`src/app/page.tsx` composes these sections top-to-bottom:

1. `SiteHeader` — sticky orange pill with nav + mobile drawer
2. `Hero` — display-serif H1 with italic span on "Seat" + pill search
3. `TrendingHotspots` — 4-up listing grid (horizontal scroll on mobile)
4. `OurPlatesAreFull` — 3 category tiles
5. `BuySellSplit` — 2-up buy / sell panels
6. `StatsBand` — full-bleed yellow band with count-up animation
7. `PartnerLogos` — 6-up grayscale logos (hover → color)
8. `Subscribe` — email capture; toast on submit
9. `SiteFooter` — wordmark + 3 link columns + legal

Section files live in `src/components/sections/`. Shared primitives
(`ListingCard`, `CategoryTile`, `StatCounter`, `PillButton`, `FadeIn`) live
in `src/components/primitives/`.

## Responsive design

Designed at 1440px. Breakpoints follow Tailwind defaults (`sm: 640`,
`md: 768`, `lg: 1024`, `xl: 1280`, `2xl: 1440`). Notable behaviors:

- Hero H1 scales via `clamp(3rem, 7vw, 6.25rem)`
- Search bar stacks vertically on mobile (3 rows)
- Trending Hotspots becomes a horizontal snap row on mobile
- Stats band becomes a 2×2 grid on mobile
- Header collapses to logo + hamburger; cream-on-orange full-screen drawer
- Footer columns stack into a single column on mobile

Tested at 390, 768, 1024, 1440, 1920.

## Deploy

Push to a GitHub repo, import into Vercel. Zero config required — Next.js
defaults apply. Bump `metadataBase` in `src/app/layout.tsx` to your
production URL before shipping.

## Assumptions & notes

- The reference HTML mock (`Pass The Plate.html`) from the design package
  was not embedded in this build because the design-package URL returned
  content larger than the fetch client could load. Copy and layout were
  built from the spec in the handoff document; fine-tune against the mock
  by editing `content/homepage.json` and section components.
- Partner logos are rendered as wordmark pills (`<span>` text). Swap to
  SVG files in `public/partners/` + `<Image>` whenever logo assets land;
  update `PartnerLogos.tsx` accordingly.
- The search "Find" button logs `{ city, industry }` to the console — no
  backend.
- The subscribe form is client-only — wire to your ESP (Customer.io,
  Klaviyo, etc.) in `src/components/sections/Subscribe.tsx#handleSubmit`.
- OG image is a placeholder SVG at `public/og.svg`. Replace with a PNG
  (`/og.png`) and update `metadata.openGraph.images` in `layout.tsx`.
