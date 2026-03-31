import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, BookOpen, Users, MapPin, TrendingUp, Shield } from "lucide-react";
import { neighborhoods, partners } from "@/lib/seed-data";

const stats = [
  { label: "NYC Neighborhoods Tracked", value: "25+" },
  { label: "Vetted Local Partners", value: "40+" },
  { label: "Step-by-Step Guides", value: "12" },
  { label: "Brands Launched", value: "50+" },
];

const pillars = [
  {
    icon: BarChart3,
    title: "Market Data",
    description:
      "Neighborhood-level rent benchmarks, foot traffic scores, and Asian dining demand heatmaps to find your ideal location.",
    href: "/data",
  },
  {
    icon: BookOpen,
    title: "Curated Guides",
    description:
      "Step-by-step playbooks covering visas, permits, lease negotiation, hiring, sourcing, and brand localization.",
    href: "/guides",
  },
  {
    icon: Users,
    title: "Partner Directory",
    description:
      "Vetted brokers, attorneys, distributors, and agencies who specialize in helping Asian F&B brands succeed in NYC.",
    href: "/partners",
  },
];

const hurdles = [
  { name: "Visa & Entity Setup", difficulty: "High", icon: Shield },
  { name: "Health Permits (DOH)", difficulty: "High", icon: Shield },
  { name: "Lease Negotiation", difficulty: "Medium", icon: TrendingUp },
  { name: "Ingredient Sourcing", difficulty: "Medium", icon: MapPin },
  { name: "Brand Localization", difficulty: "Low", icon: TrendingUp },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
              New York City Market Entry
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Your bridge from
              <br />
              <span className="text-terracotta">Asia to New York</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-gray-600">
              BridgeEast helps Asian food &amp; beverage brands navigate the
              complexity of opening their first location in New York City — with
              data, guides, and vetted local partners.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/waitlist">
                <Button size="lg">Join the Waitlist</Button>
              </Link>
              <Link href="/data">
                <Button variant="outline" size="lg">
                  Explore Market Data
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-sand-200 bg-sand-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold text-terracotta">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Three Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Everything you need to launch in NYC
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            From market research to opening day — we provide the data, knowledge,
            and connections to de-risk your expansion.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Link key={pillar.title} href={pillar.href}>
              <Card className="group h-full transition-shadow hover:shadow-md">
                <pillar.icon className="h-10 w-10 text-terracotta" />
                <h3 className="mt-4 font-display text-xl font-semibold group-hover:text-terracotta">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {pillar.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Data Preview */}
      <section className="border-y border-sand-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold">
                Rent benchmarks at a glance
              </h2>
              <p className="mt-4 text-gray-600">
                Average commercial rent per square foot across key NYC neighborhoods
                for F&B operators.
              </p>
              <div className="mt-8 space-y-4">
                {neighborhoods.map((n) => (
                  <div key={n.name} className="flex items-center gap-4">
                    <span className="w-32 text-sm font-medium">{n.name}</span>
                    <div className="flex-1">
                      <div className="h-6 rounded bg-sand-100">
                        <div
                          className="flex h-6 items-center rounded bg-terracotta px-2 text-xs font-medium text-white"
                          style={{
                            width: `${(n.avg_rent_sqft / 1050) * 100}%`,
                          }}
                        >
                          ${n.avg_rent_sqft}/sqft
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/data" className="mt-6 inline-block">
                <Button variant="link" className="px-0">
                  View full dashboard →
                </Button>
              </Link>
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold">
                Common hurdles, ranked
              </h2>
              <p className="mt-4 text-gray-600">
                Key challenges Asian F&B brands face when entering the NYC market.
              </p>
              <div className="mt-8 overflow-hidden rounded-lg border border-sand-200">
                <table className="w-full text-sm">
                  <thead className="bg-sand-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Challenge
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Difficulty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hurdles.map((h, i) => (
                      <tr
                        key={h.name}
                        className={i % 2 === 0 ? "bg-white" : "bg-sand-50/50"}
                      >
                        <td className="px-4 py-3">{h.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              h.difficulty === "High"
                                ? "bg-red-100 text-red-700"
                                : h.difficulty === "Medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {h.difficulty}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Grid Preview */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Vetted local partners
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            We connect you with specialists who understand both the NYC market and
            the unique needs of Asian F&B brands.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {partners.slice(0, 4).map((partner) => (
            <Card key={partner.name} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-100 font-display text-xl font-bold text-terracotta">
                {partner.name.charAt(0)}
              </div>
              <h3 className="mt-4 font-semibold">{partner.name}</h3>
              <p className="text-sm text-gray-500">{partner.firm}</p>
              <p className="mt-2 text-xs text-terracotta">{partner.category}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/partners">
            <Button variant="outline">View All Partners</Button>
          </Link>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="border-t border-sand-200 bg-terracotta">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to bring your brand to New York?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-terracotta-100">
            Join our waitlist to get early access to market data, guides, and
            partner introductions tailored to your brand.
          </p>
          <Link href="/waitlist" className="mt-8 inline-block">
            <Button
              size="lg"
              className="bg-white text-terracotta hover:bg-sand-50"
            >
              Join the Waitlist
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
