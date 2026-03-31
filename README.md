# BridgeEast

A platform helping Asian F&B brands navigate their first NYC location. Built with Next.js 14, Tailwind CSS, and Supabase.

## Features

- **Market Data Dashboard** — Neighborhood-level rent benchmarks, foot traffic scores, and Asian dining demand indicators with interactive charts
- **Curated Guides** — Step-by-step playbooks covering visas, permits, lease negotiation, hiring, sourcing, and brand localization
- **Partner Directory** — Searchable, filterable directory of vetted local specialists (brokers, attorneys, distributors, agencies)
- **Waitlist** — Email capture with brand details, stored in Supabase
- **Admin Panel** — Protected panel to manage partners, guides, and view waitlist signups

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** Custom components inspired by shadcn/ui
- **Database & Auth:** Supabase
- **Charts:** Recharts
- **Icons:** Lucide React
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([create one free](https://supabase.com))

### 1. Clone and install

```bash
git clone https://github.com/bsktbllwilson/agent.git
cd agent
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key from **Settings > API** in your Supabase dashboard.

### 3. Set up the database

Open the Supabase SQL Editor and run the contents of `supabase/migration.sql`. This will:

- Create all tables (`partners`, `guides`, `waitlist`, `neighborhoods`)
- Set up Row Level Security policies
- Seed the database with sample data (5 neighborhoods, 8 partners, 6 guides)

### 4. Create an admin user

In Supabase **Authentication > Users**, create a new user with email/password. This account is used to access the `/admin` panel.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with hero, stats, pillars, data preview, partner grid, and waitlist CTA |
| `/data` | Interactive market data dashboard with charts and comparison tables |
| `/guides` | Guide library with category filtering |
| `/guides/[slug]` | Individual guide detail page |
| `/partners` | Searchable, filterable partner directory |
| `/waitlist` | Waitlist signup form |
| `/admin` | Protected admin panel (Supabase auth) |

## Database Schema

- **partners** — id, name, firm, category, specialty, languages[], email, website, verified, created_at
- **guides** — id, title, slug, category, phase, content, published, created_at
- **waitlist** — id, email, brand_name, origin_country, target_open_date, created_at
- **neighborhoods** — id, name, avg_rent_sqft, foot_traffic_score, asian_dining_score, competitor_count

## Design System

- **Fonts:** Playfair Display (headings) + DM Sans (body)
- **Primary accent:** `#D85A30` (terracotta/coral)
- **Aesthetic:** Editorial, clean, minimal — like a premium research publication
