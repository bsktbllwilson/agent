"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { guides } from "@/lib/seed-data";
import { BookOpen } from "lucide-react";

const categories = [
  "All",
  "Visa & Legal",
  "Permits & Licensing",
  "Real Estate",
  "Operations",
  "Marketing",
];

export default function GuidesPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? guides
      : guides.filter((g) => g.category === activeCategory);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
          Knowledge Base
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">Curated Guides</h1>
        <p className="mt-4 text-gray-600">
          Step-by-step playbooks organized by phase of opening — from visa
          applications to launch-day marketing.
        </p>
      </div>

      {/* Category Filters */}
      <div className="mt-10 flex flex-wrap gap-2">
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

      {/* Guide Cards */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`}>
            <Card className="group h-full transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <BookOpen className="h-8 w-8 text-terracotta" />
                <Badge>{guide.category}</Badge>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold group-hover:text-terracotta">
                {guide.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Phase {guide.phase} &middot; {Math.ceil(guide.content.length / 1000)} min read
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-gray-500">
          No guides found for this category. Check back soon.
        </p>
      )}
    </div>
  );
}
