# Pass The Plate

Marketplace for the $240B+ Asian F&B business transition (buying and selling
Asian-owned restaurants, grocery, manufacturing, and more).

Includes:
- Marketing homepage (dynamic — featured listings pulled from Supabase)
- `/listings` browse with filters (cuisine / type / neighborhood / price)
- `/listings/[slug]` detail page with deal mechanics and owner story
- Magic-link auth + admin gating (from earlier phases)

Deployable to Vercel.

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

## Routes

| Route | Notes |
|---|---|
| `/` | Marketing home. Static with 60s revalidate. Trending Hotspots auto-pulls top 4 featured published listings from Supabase (falls back to seed data if env vars missing). |
| `/listings` | SSR listings grid. Filters via URL params: `?cuisine=&subtype=&neighborhood=&min=&max=&q=`. Reads facet options from the DB. |
| `/listings/[slug]` | SSR detail page with At-a-Glance rail, deal mechanics, owner story. "Request intro" CTA routes unsigned users to `/signin?next=…`. |
| `/sell` | Public seller landing. CTA flips between "Sign in" and "Start a listing" based on auth. |
| `/sell/new` | `requireSignedIn` — minimal create form (name, cuisine, type, neighborhood, price, hero URL) → creates draft, redirects to edit. |
| `/sell/listings` | `requireSignedIn` — your listings dashboard (status + quick stats). |
| `/sell/listings/[id]` | `requireSignedIn` — full edit form with status banner. Can **Save** while draft/pending. **Submit for review** flips draft → pending (enforced in the server action + RLS). **Delete draft** hard-deletes own drafts only. Fields lock when status is `published` / `rejected`. |
| `/account` | `requireSignedIn` — profile + saved listings grid + sign-out. |
| `/signin` | Magic-link (Supabase OTP). Respects `?next=` for post-login redirect (validated same-origin). |
| `/auth/callback` | PKCE code exchange. |
| `/admin` | `requireAdmin` gate + quick-link cards with live pending count. |
| `/admin/listings` | Tabbed approval queue: Pending / Approved / Rejected / Drafts. Per-row actions: **Approve & publish**, **Reject with feedback**, **Feature / Unfeature**, **Un-publish**, **Reopen for review**, **Preview**. |
| `/admin/inquiries` | Inquiry pipeline (new → reviewed → introduced → closed → spam). Admins change status per row. |
| `/sell/inquiries` | Seller's inquiries across their listings (identity withheld until verified). |

## Transactional email (Resend)

Emails fire from server actions — admin submissions go out regardless, seller
emails need `SUPABASE_SERVICE_ROLE_KEY` set so we can look up the seller's
email from `auth.users` without exposing it to the client.

| Trigger | Template | To |
|---|---|---|
| Seller hits "Submit for review" | `listingSubmittedEmail` | `ADMIN_EMAIL` |
| Admin approves | `listingApprovedEmail` | seller (needs service-role key) |
| Admin rejects with reason | `listingRejectedEmail` | seller (needs service-role key) |
| Buyer submits an inquiry | `newInquiryAdminEmail` | `ADMIN_EMAIL` (with `Reply-To` = buyer) |

Templates live in `src/lib/emails/templates.ts` (plain HTML, no extra deps).
The top-level helper `sendEmail` in `src/lib/emails/send.ts` is a no-op and
logs a warning when `RESEND_API_KEY` is missing, so dev still works without
email credentials.

## Env vars

See `.env.local.example`. Vercel → Settings → Environment Variables
(Production + Preview):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon / public key.
- `SUPABASE_SERVICE_ROLE_KEY` — enables emailing sellers on approve / reject.
- `RESEND_API_KEY` — Resend API key.
- `EMAIL_FROM` — e.g. `Pass The Plate <deals@passtheplate.store>` (verified sender).
- `ADMIN_EMAIL` — inbox for new-submission / new-inquiry alerts.
- `NEXT_PUBLIC_SITE_URL` — used in email CTA links.

## Image uploads

Hero and owner photos are uploaded directly to **Supabase Storage** from the
browser. Migration `0006_listings_bucket.sql` creates the `listings` bucket
(public read, 10 MB limit, jpg/png/webp/gif) and RLS policies that only let
authenticated users write to their own folder:

```
listings/
  <user_id>/
    <listing_id>/
      <timestamp>-<nonce>.jpg
```

The `ImageUpload` client component (used in `/sell/new` and
`/sell/listings/[id]`) uploads, fetches the public URL, and writes it into a
hidden form field — so the existing server actions keep working unchanged.

Remote image hosts are allowlisted in `next.config.mjs` (`*.supabase.co`)
so `next/image` renders uploaded images without transformation errors.

## Seller flow & RLS

Migration `supabase/migrations/0003_listing_rls.sql` enables RLS on
`public.listings` with this policy matrix (assumes `public.is_admin()`
from `0001`):

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| anon | `status = 'published'` | — | — | — |
| signed-in user | `status = 'published'` OR own rows | only as `seller_id = auth.uid()` **and** `status = 'draft'` | own rows while `status in ('draft','pending')` (can't flip to `published`) | own rows while `status = 'draft'` |
| admin | all | — | any | — |

Server actions live in `src/lib/seller-actions.ts`:
- `createDraftListing(form)` — auto-slugs from name with collision suffix.
- `updateListing(form)` — partial update; re-slug if name changed.
- `submitListingForReview(id)` — enforces required-fields check in app + RLS
  (status moves draft → pending).
- `deleteDraftListing(id)` — hard delete, drafts only.

Because the server actions use the **anon** Supabase client with RLS, a
compromised client can't bypass the lifecycle even if it mimics the
endpoints.

## Saved listings

Per-user favorites with heart buttons on every listing card (index + detail).

- Table: `public.saved_listings (user_id, listing_id, created_at)` — composite PK, RLS-locked to the owner.
- Migration: `supabase/migrations/0002_saved_listings.sql`.
- Server actions: `saveListing` / `unsaveListing` / `signOut` in `src/lib/actions.ts` — use Next.js `revalidatePath`.
- UI: `SaveListingButton` uses `useOptimistic` + `useTransition` so taps feel instant.
- Hearts hidden for signed-out users (prevents silent failures); "Request intro" CTA still prompts sign-in via `next=`.

## Data layer

`src/lib/listings.ts` exposes:

- `getPublishedListings(filters, opts)` — filtered list, ordered featured-first.
- `getListingBySlug(slug)` — single listing by slug, only if `status = 'published'`.
- `getFeaturedListings(limit)` — landing "Trending Hotspots".
- `getFilterFacets()` — unique cuisine / subtype / neighborhood values for filter dropdowns.

All reads are filtered by `status = 'published'` server-side — so the anon
key + RLS can't leak drafts. Price / area / year formatting helpers live in
`src/lib/format.ts`.

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

## Admin auth (Supabase)

Magic-link sign-in with role-based admin gating via Supabase `app_metadata`.

### 1. Set env vars

Copy `.env.local.example` → `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Also add these to Vercel → Project → Settings → Environment Variables
(Production + Preview).

### 2. Run the migration

Apply `supabase/migrations/0001_admin_role.sql` in the Supabase SQL Editor.
It installs:

- `handle_new_user_role()` — trigger that writes `app_metadata.role` at
  signup. Users can request `buyer` / `seller` / `broker`; everything else
  (including `admin`) is forced to `buyer`. Never trust
  `user_metadata.role` for auth.
- `is_admin()` — use inside RLS policies: `using (public.is_admin())`.

### 3. Promote an admin

Dashboard → **Authentication → Users** → select user → **Raw App Meta
Data** → add `"role": "admin"`. User must sign out + back in for the JWT
to refresh. SQL form:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
where email = 'you@example.com';
```

### 4. Routes

| Route | Purpose |
|---|---|
| `/signin` | Magic-link email form (no password) |
| `/auth/callback` | PKCE code exchange → sets session, redirects to `next` |
| `/admin` | Gated via `requireAdmin()`; non-admins redirect to `/` |

Helpers live in `src/lib/auth.ts` (`getCurrentUser`, `getRole`, `isAdmin`,
`requireAdmin`, `requireSignedIn`) and `src/lib/use-role.ts` (client hook
for conditional UI). Middleware in `src/middleware.ts` refreshes the
Supabase session cookie on every request.

### 5. Supabase dashboard config

- **Authentication → URL Configuration**
  - Site URL: `https://passtheplate.store`
  - Redirect URLs: add `https://passtheplate.store/**` and your Vercel
    preview URL pattern (`https://*-yourteam.vercel.app/**`)
- **Authentication → SMTP Settings:** enable custom SMTP → Resend
  (`smtp.resend.com:465`, user `resend`, password = Resend API key,
  sender = a verified address on a verified domain).

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
