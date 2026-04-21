import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/primitives/FadeIn";
import { ListingCard } from "@/components/primitives/ListingCard";
import { ListingPreviewCard } from "@/components/primitives/ListingPreviewCard";
import { getFeaturedListings } from "@/lib/listings";
import type { Homepage } from "../../../content/schema";

type Data = Homepage["trendingHotspots"];

export async function TrendingHotspots({ data }: { data: Data }) {
  const liveListings = await getFeaturedListings(4);
  const useLive = liveListings.length > 0;

  return (
    <section id="listings" className="section-y container-px">
      <div className="mx-auto max-w-[1440px]">
        <FadeIn>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="text-section text-ink">{data.heading}</h2>
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-base font-medium text-ink underline-offset-4 hover:underline"
            >
              {data.cta.label}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          {useLive ? (
            <>
              <div className="no-scrollbar mt-10 flex gap-5 overflow-x-auto scroll-smooth pb-2 sm:hidden">
                {liveListings.map((l) => (
                  <div
                    key={l.id}
                    className="w-[80%] shrink-0 snap-start"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <ListingPreviewCard listing={l} />
                  </div>
                ))}
              </div>
              <div className="mt-10 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                {liveListings.map((l) => (
                  <ListingPreviewCard key={l.id} listing={l} />
                ))}
              </div>
            </>
          ) : (
            <>
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
              <div className="mt-10 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                {data.items.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </>
          )}
        </FadeIn>
      </div>
    </section>
  );
}
