import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedListings, getFilterFacets } from "@/lib/listings";
import { getSavedListingIds } from "@/lib/saved-listings";
import { getCurrentUser } from "@/lib/auth";
import { getHomepage } from "@/lib/content";
import { ListingPreviewCard } from "@/components/primitives/ListingPreviewCard";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { BottomCtaStrip } from "@/components/sections/BottomCtaStrip";
import type { ListingFilters } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

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
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("listings");
  const home = getHomepage(locale);
  const filters: ListingFilters = {
    cuisine: sp.cuisine,
    subtype: sp.subtype,
    neighborhood: sp.neighborhood,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    search: sp.q,
  };

  const [listings, facets, user] = await Promise.all([
    getPublishedListings(filters, { orderBy: "featured", limit: 48 }),
    getFilterFacets(),
    getCurrentUser(),
  ]);
  const savedIds = user ? await getSavedListingIds() : new Set<string>();

  const hasFilters = Object.values(sp).some((v) => v != null && v !== "");

  return (
    <main className="min-h-[100dvh]">
      <SiteHeader nav={home.nav} />

      <section className="container-px mt-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
          <h1 className="text-section text-ink">
            {t("headingPrefix")}{" "}
            <span className="italic">{t("headingItalic")}</span>
          </h1>
          <p className="max-w-2xl text-lg text-ink/70">{t("subhead")}</p>
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
                {t("count", { count: listings.length })}
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((l) => (
                  <ListingPreviewCard
                    key={l.id}
                    listing={l}
                    saved={savedIds.has(l.id)}
                    showSaveButton={!!user}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <div className="mt-24">
        <BottomCtaStrip />
      </div>
      <SiteFooter data={home.footer} />
    </main>
  );
}

async function FilterBar({
  facets,
  current,
}: {
  facets: Awaited<ReturnType<typeof getFilterFacets>>;
  current: SearchParams;
}) {
  const t = await getTranslations("listings.filters");
  return (
    <form
      method="get"
      className="flex flex-col gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <input
        type="search"
        name="q"
        defaultValue={current.q ?? ""}
        placeholder={t("searchPlaceholder")}
        className="w-full min-w-[200px] flex-1 rounded-full border border-ink/15 px-4 py-2 text-sm outline-none focus:border-ink sm:w-auto"
      />
      <SelectFilter
        name="cuisine"
        label={t("cuisine")}
        anyLabel={t("anySuffix")}
        value={current.cuisine}
        options={facets.cuisines}
      />
      <SelectFilter
        name="subtype"
        label={t("type")}
        anyLabel={t("anySuffix")}
        value={current.subtype}
        options={facets.subtypes}
      />
      <SelectFilter
        name="neighborhood"
        label={t("neighborhood")}
        anyLabel={t("anySuffix")}
        value={current.neighborhood}
        options={facets.neighborhoods}
      />
      <div className="flex gap-2">
        <NumberInput name="min" label={t("minPrice")} value={current.min} />
        <NumberInput name="max" label={t("maxPrice")} value={current.max} />
      </div>
      <div className="flex gap-2 sm:ml-auto">
        <button
          type="submit"
          className="rounded-full bg-orange px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
        >
          {t("apply")}
        </button>
        <Link
          href="/listings"
          className="rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
        >
          {t("reset")}
        </Link>
      </div>
    </form>
  );
}

function SelectFilter({
  name,
  label,
  anyLabel,
  value,
  options,
}: {
  name: string;
  label: string;
  anyLabel: string;
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
        <option value="">
          {label}: {anyLabel}
        </option>
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

async function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const t = await getTranslations("listings.empty");
  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-white p-12 text-center">
      <h2 className="font-display text-3xl text-ink">
        {hasFilters ? t("noMatchesHeading") : t("emptyHeading")}
      </h2>
      <p className="mt-2 text-ink/70">
        {hasFilters ? t("noMatchesBody") : t("emptyBody")}
      </p>
      {hasFilters && (
        <Link
          href="/listings"
          className="mt-6 inline-flex rounded-full bg-orange px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
        >
          {t("resetCta")}
        </Link>
      )}
    </div>
  );
}
