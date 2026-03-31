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

const hurdles = [
  { challenge: "Visa & Entity Formation", difficulty: "High", timeWeeks: "8–16", cost: "$5,000–$15,000" },
  { challenge: "DOH Food Service Permit", difficulty: "High", timeWeeks: "4–8", cost: "$280" },
  { challenge: "Food Protection Certificate", difficulty: "Medium", timeWeeks: "1–2", cost: "$24" },
  { challenge: "SLA Liquor License", difficulty: "High", timeWeeks: "16–24", cost: "$4,500+" },
  { challenge: "Commercial Lease", difficulty: "Medium", timeWeeks: "4–12", cost: "Varies" },
  { challenge: "Build-Out & Inspection", difficulty: "Medium", timeWeeks: "8–16", cost: "$50,000–$300,000" },
  { challenge: "Staff Hiring & Training", difficulty: "Low", timeWeeks: "2–4", cost: "Varies" },
  { challenge: "Brand Localization", difficulty: "Low", timeWeeks: "2–6", cost: "$2,000–$10,000" },
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
      <Card className="mt-12">
        <h2 className="font-display text-xl font-semibold">
          Neighborhood Map
        </h2>
        <p className="mt-1 mb-4 text-sm text-gray-500">
          Circle size reflects Asian dining demand. Opacity reflects rent level. Hover for details.
        </p>
        <NeighborhoodMap neighborhoods={neighborhoods} />
      </Card>

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
          Estimated timelines and costs for common hurdles
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200">
                <th className="pb-3 text-left font-semibold">Challenge</th>
                <th className="pb-3 text-left font-semibold">Difficulty</th>
                <th className="pb-3 text-left font-semibold">Timeline</th>
                <th className="pb-3 text-left font-semibold">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {hurdles.map((h, i) => (
                <tr
                  key={h.challenge}
                  className={`border-b border-sand-100 ${
                    i % 2 === 0 ? "" : "bg-sand-50/50"
                  }`}
                >
                  <td className="py-3 font-medium">{h.challenge}</td>
                  <td className="py-3">
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
                  <td className="py-3 text-gray-600">{h.timeWeeks} weeks</td>
                  <td className="py-3 text-gray-600">{h.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
