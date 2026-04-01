"use client";

import { Card } from "@/components/ui/card";
import { NeighborhoodMap } from "@/components/neighborhood-map";
import { neighborhoods } from "@/lib/seed-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

const rentData = neighborhoods.map((n) => ({
  name: n.name,
  rent: n.avg_rent_sqft,
}));

const radarData = neighborhoods.map((n) => ({
  neighborhood: n.name,
  "Foot Traffic": n.foot_traffic_score,
  "Asian Dining Demand": n.asian_dining_score,
}));

// Sources: USCIS fee schedules, NYC DOHMH, NY SLA, DOB, OysterLink, REBNY
const hurdles = [
  {
    challenge: "Visa & Entity Formation",
    difficulty: "High",
    timeline: "8–24 weeks",
    timelineNote: "USCIS: 12–24 wks standard, 3 wks premium ($2,805). Consular: 2–16 wks varies by country.",
    cost: "$125,000–$230,000+",
    costNote: "Investment capital $100K–$200K (must be \"at risk\"), attorney $5K–$15K, USCIS filing $1,015, visa fee $315, entity formation $1K–$3K.",
  },
  {
    challenge: "SLA Liquor License",
    difficulty: "High",
    timeline: "22–52 weeks",
    timelineNote: "Current SLA backlog: 22–26 weeks typical, up to 12 months if 500-ft rule hearing required.",
    cost: "$7,500–$17,500",
    costNote: "License fee $4,552 (on-premises, NYC), expediter $3K–$8K, attorney $2K–$5K, 30-day posting required.",
  },
  {
    challenge: "Build-Out & DOB Permits",
    difficulty: "High",
    timeline: "12–32 weeks",
    timelineNote: "DOB plan review 2–8 wks, construction 8–20 wks. 63% of first-time DOB applications rejected in 2024.",
    cost: "$150,000–$500,000+",
    costNote: "Construction $200–$500/sqft (for ~1,000 sqft: $200K–$500K). DOB permit fees $50K+. Budget 10–15% contingency.",
  },
  {
    challenge: "Commercial Lease",
    difficulty: "Medium",
    timeline: "4–16 weeks",
    timelineNote: "Site search 2–8 wks, negotiation 2–6 wks, legal review 1–2 wks. Taking over existing restaurant space saves time.",
    cost: "$50,000–$200,000 upfront",
    costNote: "Security deposit 3–12 months rent (foreign operators: expect 6–12 months). First/last month rent. Broker fee 3–6% of lease value.",
  },
  {
    challenge: "DOH Food Service Permit",
    difficulty: "Medium",
    timeline: "3–4 weeks",
    timelineNote: "Can open 22 days after application even without inspection. Pre-operating inspection available for faster opening.",
    cost: "$280–$1,000",
    costNote: "Base fee $280, +$25 frozen desserts. Varies by seating capacity. Optional $400 consultation service.",
  },
  {
    challenge: "Staff Hiring & Training",
    difficulty: "Medium",
    timeline: "4–8 weeks",
    timelineNote: "Executive hires (chef, GM) 4–8 wks before opening. FOH/BOH staff 2–4 wks. Training 1–2 wks. Soft opening 1 wk.",
    cost: "$15,000–$40,000",
    costNote: "Recruiting $1K–$3K, training programs $2K–$5K, per-employee onboarding ~$5,864. NYC min wage $16.50/hr.",
  },
  {
    challenge: "Food Protection Certificate",
    difficulty: "Low",
    timeline: "1–2 weeks",
    timelineNote: "Free online course (self-paced, 15 lessons). In-person: 5 days × 3 hrs ($114). In-person exam required ($24).",
    cost: "$24–$138",
    costNote: "Online course free + $24.60 exam fee. In-person course $114 + $24.60 exam. Certificate valid 10 years.",
  },
  {
    challenge: "Brand Localization",
    difficulty: "Low",
    timeline: "4–10 weeks",
    timelineNote: "Name research & testing 2–4 wks, visual identity adaptation 2–3 wks, digital presence setup 1–3 wks.",
    cost: "$5,000–$25,000",
    costNote: "Naming/testing $2K–$8K, website & social $2K–$5K, food photography $1K–$3K, PR launch campaign $3K–$10K.",
  },
];

export default function DataPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
          Market Intelligence
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">NYC Market Data</h1>
        <p className="mt-4 text-gray-600">
          Neighborhood-level benchmarks and market indicators for Asian F&B
          operators evaluating New York City. Rent data sourced from REBNY, CBRE,
          and commercial listing aggregators (H2 2025).
        </p>
      </div>

      {/* Interactive Map */}
      <div className="mt-12">
        <h2 className="font-display text-2xl font-bold">
          Location Scout
        </h2>
        <p className="mt-2 mb-6 text-gray-600">
          Search any NYC address to get estimated foot traffic, Asian dining demand,
          rent benchmarks, and competitor density. Scores are interpolated from
          tracked neighborhoods.
        </p>
        <NeighborhoodMap neighborhoods={neighborhoods} />
      </div>

      {/* Rent Chart */}
      <Card className="mt-12">
        <h2 className="font-display text-xl font-semibold">
          Average Rent per Sq Ft by Neighborhood
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Commercial rent benchmarks for restaurant-suitable spaces ($/sqft/year)
        </p>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rentData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5D8BF" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5D8BF",
                  fontSize: 13,
                }}
                formatter={(value) => [`$${value}/sqft`, "Avg Rent"]}
              />
              <Bar dataKey="rent" fill="#D85A30" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Radar Chart */}
      <Card className="mt-8">
        <h2 className="font-display text-xl font-semibold">
          Foot Traffic vs. Asian Dining Demand
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Foot traffic normalized from MTA subway station ridership (2022–2025).
          Asian dining demand derived from NYC DOHMH restaurant inspection data
          and US Census Asian population figures.
        </p>
        <div className="mt-6 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5D8BF" />
              <PolarAngleAxis dataKey="neighborhood" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Foot Traffic"
                dataKey="Foot Traffic"
                stroke="#D85A30"
                fill="#D85A30"
                fillOpacity={0.3}
              />
              <Radar
                name="Asian Dining Demand"
                dataKey="Asian Dining Demand"
                stroke="#1A1A1A"
                fill="#1A1A1A"
                fillOpacity={0.1}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Neighborhood Table */}
      <Card className="mt-8">
        <h2 className="font-display text-xl font-semibold">
          Neighborhood Comparison
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Side-by-side metrics for F&B location scouting
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200">
                <th className="pb-3 text-left font-semibold">Neighborhood</th>
                <th className="pb-3 text-left font-semibold">Avg Rent ($/sqft)</th>
                <th className="pb-3 text-left font-semibold">Foot Traffic</th>
                <th className="pb-3 text-left font-semibold">Asian Dining Score</th>
                <th className="pb-3 text-left font-semibold">Competitors</th>
              </tr>
            </thead>
            <tbody>
              {neighborhoods.map((n, i) => (
                <tr
                  key={n.name}
                  className={`border-b border-sand-100 ${
                    i % 2 === 0 ? "" : "bg-sand-50/50"
                  }`}
                >
                  <td className="py-3 font-medium">{n.name}</td>
                  <td className="py-3">${n.avg_rent_sqft}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-sand-200">
                        <div
                          className="h-2 rounded-full bg-terracotta"
                          style={{ width: `${n.foot_traffic_score}%` }}
                        />
                      </div>
                      <span className="text-gray-500">{n.foot_traffic_score}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-sand-200">
                        <div
                          className="h-2 rounded-full bg-terracotta"
                          style={{ width: `${n.asian_dining_score}%` }}
                        />
                      </div>
                      <span className="text-gray-500">{n.asian_dining_score}</span>
                    </div>
                  </td>
                  <td className="py-3">{n.competitor_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Difficulty Rating Table */}
      <Card className="mt-8">
        <h2 className="font-display text-xl font-semibold">
          Market Entry Difficulty Ratings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Concrete timelines and costs for each hurdle, sourced from USCIS, NYC
          DOHMH, NY SLA, DOB, and industry benchmarks (2025).
        </p>
        <div className="mt-6 space-y-4">
          {hurdles.map((h) => (
            <div
              key={h.challenge}
              className="rounded-lg border border-sand-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-semibold">{h.challenge}</h3>
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
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Timeline
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-terracotta">
                    {h.timeline}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {h.timelineNote}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Estimated Cost
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">
                    {h.cost}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {h.costNote}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
