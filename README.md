# BridgeEast

A platform helping Asian F&B brands navigate their first NYC location. Built with Next.js 14, Tailwind CSS, and TypeScript.

## Features

- **Market Data Dashboard** — Neighborhood-level rent benchmarks, foot traffic scores, and Asian dining demand indicators with interactive charts
- **Curated Guides** — Step-by-step playbooks covering visas, permits, lease negotiation, hiring, sourcing, and brand localization
- **Partner Directory** — Searchable, filterable directory of vetted local specialists (brokers, attorneys, distributors, agencies)
- **Waitlist** — Email capture with brand details, stored in localStorage
- **Admin Panel** — Password-protected panel to manage partners, guides, and view waitlist signups

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** Custom components inspired by shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide React
- **Language:** TypeScript
- **Storage:** localStorage (no database required)

## Getting Started

### Prerequisites

- Node.js 18+

### 1. Clone and install

```bash
git clone https://github.com/bsktbllwilson/agent.git
cd agent
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables or database setup required. The app ships with seed data and uses localStorage for persistence.

### Admin Panel

Visit `/admin` and log in with the default password: `bridgeeast2024`

From the admin panel you can:
- Add and remove partners
- Add and remove guides
- View waitlist signups

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with hero, stats, pillars, data preview, partner grid, and waitlist CTA |
| `/data` | Interactive market data dashboard with charts and comparison tables |
| `/guides` | Guide library with category filtering |
| `/guides/[slug]` | Individual guide detail page |
| `/partners` | Searchable, filterable partner directory |
| `/waitlist` | Waitlist signup form |
| `/admin` | Password-protected admin panel |

## Data

All data is stored in the browser via localStorage. Seed data (5 neighborhoods, 8 partners, 6 guides) is loaded automatically on first visit.

The Supabase migration SQL is still available at `supabase/migration.sql` if you want to upgrade to a database later.

## Design System

- **Fonts:** Playfair Display (headings) + DM Sans (body)
- **Primary accent:** `#D85A30` (terracotta/coral)
- **Aesthetic:** Editorial, clean, minimal — like a premium research publication
