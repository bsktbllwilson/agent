import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedListings, getFilterFacets } from "@/lib/listings";
import { ListingPreviewCard } from "@/components/primitives/ListingPreviewCard";
import { Wordmark } from "@/components/Wordmark";
import type { ListingFilters } from "@/lib/types";

export const metadata: Metadata = {
  title: "Browse Listings — Pass The Plate",
  description:
    "Asian F&B businesses for sale — restaurants, grocery, manufacturing. Verified listings from operators ready to pass the plate.",
};

export const dynamic = "force-dynamic";

type SearchParams = {
  cuisine?: string;
  subtype?: string;
  neighborhood?: string;
  min?: string;
  max?: string;
  q?: string;
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters: ListingFilters = {
    cuisine: sp.cuisine,
    subtype: sp.subtype,
    neighborhood: sp.neighborhood,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    search: sp.q,
  };

  const [listings, facets] = await Promise.all([
    getPublishedListings(filters, { orderBy: "featured", limit: 48 }),
    getFilterFacets(),
  ]);

  const hasFilters = Object.values(sp).some((v) => v != null && v !== "");

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label="Pass The Plate home">
            <Wordmark tone="ink" />
          </Link>
          <Link
            href="/signin"
            className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            Sign In
          </Link>
        </div>
      </div>

      <section className="container-px mt-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
          <h1 className="text-section text-ink">
            Browse <span className="italic">Listings</span>
          </h1>
          <p className="max-w-2xl text-lg text-ink/70">
            Verified Asian F&amp;B businesses on the market today — vetted by
            our team, delivered straight to you.
          </p>
        </div>
      </section>

      <section className="container-px mt-8">
        <div className="mx-auto max-w-[1440px]">
          <FilterBar facets={facets} current={sp} />
        </div>
      </section>

      <section className="container-px mt-10">
        <div className="mx-auto max-w-[1440px]">
          {listings.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <>
              <p className="text-sm text-ink/60">
                {listings.length} {listings.length === 1 ? "listing" : "listings"}
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((l) => (
                  <ListingPreviewCard key={l.id} listing={l} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function FilterBar({
  facets,
  current,
}: {
  facets: Awaited<ReturnType<typeof getFilterFacets>>;
  current: SearchParams;
}) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <input
        type="search"
        name="q"
        defaultValue={current.q ?? ""}
        placeholder="Search by name"
        className="w-full min-w-[200px] flex-1 rounded-full border border-ink/15 px-4 py-2 text-sm outline-none focus:border-ink sm:w-auto"
      />
      <SelectFilter
        name="cuisine"
        label="Cuisine"
        value={current.cuisine}
        options={facets.cuisines}
      />
      <SelectFilter
        name="subtype"
        label="Type"
        value={current.subtype}
        options={facets.subtypes}
      />
      <SelectFilter
        name="neighborhood"
        label="Neighborhood"
        value={current.neighborhood}
        options={facets.neighborhoods}
      />
      <div className="flex gap-2">
        <NumberInput name="min" label="Min $" value={current.min} />
        <NumberInput name="max" label="Max $" value={current.max} />
      </div>
      <div className="flex gap-2 sm:ml-auto">
        <button
          type="submit"
          className="rounded-full bg-orange px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
        >
          Apply
        </button>
        <Link
          href="/listings"
          className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}

function SelectFilter({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string | undefined;
  options: string[];
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="appearance-none rounded-full border border-ink/15 bg-white px-4 py-2 pr-8 text-sm text-ink outline-none focus:border-ink"
      >
        <option value="">{label}: Any</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/50"
      >
        ▾
      </span>
    </label>
  );
}

function NumberInput({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string | undefined;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={value ?? ""}
        placeholder={label}
        min="0"
        step="10000"
        className="w-28 rounded-full border border-ink/15 px-4 py-2 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-white p-12 text-center">
      <h2 className="font-display text-3xl text-ink">
        {hasFilters ? "No matches" : "No published listings yet"}
      </h2>
      <p className="mt-2 text-ink/70">
        {hasFilters
          ? "Try removing a filter, or reset to see everything."
          : "Check back soon — sellers are adding listings every week."}
      </p>
      {hasFilters && (
        <Link
          href="/listings"
          className="mt-6 inline-flex rounded-full bg-orange px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
        >
          Reset filters
        </Link>
      )}
    </div>
  );
}
