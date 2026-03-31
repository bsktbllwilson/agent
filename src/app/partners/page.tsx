"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { partners } from "@/lib/seed-data";
import { Globe, Mail } from "lucide-react";

const categories = [
  "All",
  "Real Estate Brokers",
  "Immigration Attorneys",
  "Ingredient Distributors",
  "PR & Localization",
  "Accountants & Tax",
];

const allLanguages = Array.from(
  new Set(partners.flatMap((p) => p.languages))
).sort();

export default function PartnersPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLang, setActiveLang] = useState("All");

  const filtered = partners.filter((p) => {
    const catMatch =
      activeCategory === "All" || p.category === activeCategory;
    const langMatch =
      activeLang === "All" || p.languages.includes(activeLang);
    return catMatch && langMatch;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
          Local Experts
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">
          Partner Directory
        </h1>
        <p className="mt-4 text-gray-600">
          Vetted specialists who understand the unique needs of Asian F&B brands
          entering the NYC market.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-10 space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-terracotta text-white"
                    : "bg-sand-100 text-gray-600 hover:bg-sand-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500">Language</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveLang("All")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeLang === "All"
                  ? "bg-terracotta text-white"
                  : "bg-sand-100 text-gray-600 hover:bg-sand-200"
              }`}
            >
              All
            </button>
            {allLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeLang === lang
                    ? "bg-terracotta text-white"
                    : "bg-sand-100 text-gray-600 hover:bg-sand-200"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Partner Cards */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((partner) => (
          <Card key={partner.name} className="flex flex-col">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta-100 font-display text-lg font-bold text-terracotta">
                {partner.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{partner.name}</h3>
                <p className="text-sm text-gray-500">{partner.firm}</p>
              </div>
            </div>

            <Badge className="mt-4 w-fit">{partner.category}</Badge>
            <p className="mt-3 flex-1 text-sm text-gray-600">
              {partner.specialty}
            </p>

            <div className="mt-4 flex flex-wrap gap-1">
              {partner.languages.map((lang) => (
                <Badge key={lang} variant="outline">
                  {lang}
                </Badge>
              ))}
            </div>

            <div className="mt-4 flex gap-2 border-t border-sand-200 pt-4">
              <a href={`mailto:${partner.email}`}>
                <Button size="sm" variant="outline">
                  <Mail className="mr-1 h-3.5 w-3.5" /> Email
                </Button>
              </a>
              <a href={partner.website} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost">
                  <Globe className="mr-1 h-3.5 w-3.5" /> Website
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-gray-500">
          No partners found matching your filters.
        </p>
      )}
    </div>
  );
}
