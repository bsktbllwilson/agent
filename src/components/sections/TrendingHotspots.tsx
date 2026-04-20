import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/primitives/FadeIn";
import { ListingCard } from "@/components/primitives/ListingCard";
import type { Homepage } from "../../../content/schema";

type Data = Homepage["trendingHotspots"];

export function TrendingHotspots({ data }: { data: Data }) {
  return (
    <section id="listings" className="section-y container-px">
      <div className="mx-auto max-w-[1440px]">
        <FadeIn>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="text-section text-ink">{data.heading}</h2>
            <a
              href={data.cta.href}
              className="inline-flex items-center gap-2 text-base font-medium text-ink underline-offset-4 hover:underline"
            >
              {data.cta.label}
              <ArrowRight aria-hidden className="size-4" />
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          {/* Mobile: horizontal snap row */}
          <div className="no-scrollbar mt-10 flex gap-5 overflow-x-auto scroll-smooth pb-2 sm:hidden">
            {data.items.map((l) => (
              <div
                key={l.id}
                className="w-[80%] shrink-0 snap-start"
                style={{ scrollSnapAlign: "start" }}
              >
                <ListingCard listing={l} />
              </div>
            ))}
          </div>

          {/* Tablet+: grid */}
          <div className="mt-10 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
