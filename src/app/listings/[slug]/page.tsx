import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getListingBySlug } from "@/lib/listings";
import { getSavedListingIds } from "@/lib/saved-listings";
import { getCurrentUser } from "@/lib/auth";
import {
  formatPrice,
  formatRevenue,
  formatArea,
  formatYears,
  formatEstablished,
} from "@/lib/format";
import { Wordmark } from "@/components/Wordmark";
import { SaveListingButton } from "@/components/primitives/SaveListingButton";
import { ContactSellerForm } from "@/components/primitives/ContactSellerForm";
import { ViewTracker } from "@/components/primitives/ViewTracker";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Listing not found — Pass The Plate" };
  return {
    title: `${listing.name} — Pass The Plate`,
    description: listing.reason ?? `${listing.name} in ${listing.neighborhood ?? ""}`,
    openGraph: {
      title: listing.name,
      description: listing.reason ?? undefined,
      images: listing.hero_url ? [listing.hero_url] : [],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const [listing, user] = await Promise.all([
    getListingBySlug(slug),
    getCurrentUser(),
  ]);
  if (!listing) notFound();
  const savedIds = user ? await getSavedListingIds() : new Set<string>();
  const isSaved = savedIds.has(listing.id);

  const specs: { label: string; value: string }[] = [
    { label: "Asking price", value: formatPrice(listing.price) },
    { label: "Annual revenue", value: formatRevenue(listing.revenue) },
    { label: "SDE", value: formatRevenue(listing.sde) },
    { label: "Square feet", value: formatArea(listing.sqft) },
    { label: "Monthly rent", value: formatRevenue(listing.rent) },
    { label: "Lease remaining", value: formatYears(listing.lease_years) },
    { label: "Staff", value: listing.staff != null ? String(listing.staff) : "—" },
    { label: "Established", value: formatEstablished(listing.established) },
  ];

  const hasFinancials =
    listing.lease_terms ||
    listing.staff_retention ||
    listing.vendor_contracts ||
    listing.handoff_notes ||
    listing.p_and_l_url;

  return (
    <main className="min-h-[100dvh] pb-24">
      <ViewTracker listingId={listing.id} />
      <div className="container-px pt-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" aria-label="Pass The Plate home">
            <Wordmark tone="ink" />
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            All listings
          </Link>
        </div>
      </div>

      <div className="container-px mt-10">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] bg-ink/5">
              {listing.hero_url ? (
                <Image
                  src={listing.hero_url}
                  alt={listing.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-orange/10 font-display text-8xl text-ink/40">
                  {listing.name.slice(0, 1)}
                </div>
              )}
            </div>

            <header className="mt-8 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.12em] text-ink/60">
                {listing.cuisine && <Chip>{listing.cuisine}</Chip>}
                {listing.subtype && <Chip>{listing.subtype}</Chip>}
                {listing.neighborhood && <Chip>{listing.neighborhood}</Chip>}
                {listing.featured && (
                  <span className="rounded-full bg-orange px-3 py-1 uppercase tracking-[0.12em] text-cream">
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-6">
                <h1 className="text-hero text-ink">{listing.name}</h1>
                {user && listing.slug && (
                  <SaveListingButton
                    listingId={listing.id}
                    initialSaved={isSaved}
                    redirectPath={`/listings/${listing.slug}`}
                    variant="inline"
                  />
                )}
              </div>
              <div className="text-3xl font-medium text-ink">
                {formatPrice(listing.price)}
              </div>
            </header>

            {listing.reason && (
              <Section title="Why the owner is selling" body={listing.reason} />
            )}
            {listing.owner_story && (
              <Section title="The story" body={listing.owner_story} />
            )}
            {listing.secret_sauce && (
              <Section title="Secret sauce" body={listing.secret_sauce} />
            )}

            {hasFinancials && (
              <section className="mt-12">
                <h2 className="font-display text-3xl text-ink">
                  Deal mechanics
                </h2>
                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                  {listing.lease_terms && (
                    <DlRow label="Lease terms" value={listing.lease_terms} />
                  )}
                  {listing.staff_retention && (
                    <DlRow
                      label="Staff retention"
                      value={listing.staff_retention}
                    />
                  )}
                  {listing.vendor_contracts && (
                    <DlRow
                      label="Vendor contracts"
                      value={listing.vendor_contracts}
                    />
                  )}
                  {listing.handoff_notes && (
                    <DlRow label="Handoff" value={listing.handoff_notes} />
                  )}
                </dl>
                {listing.p_and_l_url && (
                  <a
                    href={listing.p_and_l_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
                  >
                    Download P&amp;L
                  </a>
                )}
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.5rem] border border-ink/10 bg-white p-6">
              <h2 className="font-display text-2xl text-ink">At a glance</h2>
              <dl className="mt-4 divide-y divide-ink/10">
                {specs.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-baseline justify-between py-3"
                  >
                    <dt className="text-sm text-ink/60">{s.label}</dt>
                    <dd className="text-sm font-medium text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>

              {user ? (
                <div className="mt-6">
                  <ContactSellerForm
                    listingId={listing.id}
                    slug={listing.slug ?? ""}
                    listingName={listing.name}
                  />
                </div>
              ) : (
                <>
                  <Link
                    href={`/signin?next=${encodeURIComponent(`/listings/${listing.slug ?? ""}`)}`}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-orange px-6 py-3 text-base font-medium text-cream transition-colors hover:bg-[rgb(210,68,28)]"
                  >
                    Sign in to request intro
                  </Link>
                  <p className="mt-3 text-center text-xs text-ink/50">
                    We verify every buyer before connecting them with sellers.
                  </p>
                </>
              )}
            </div>

            {listing.owner_name && (
              <div className="mt-6 flex items-center gap-4 rounded-[1.5rem] border border-ink/10 bg-white p-6">
                {listing.owner_photo_url ? (
                  <Image
                    src={listing.owner_photo_url}
                    alt={listing.owner_name}
                    width={64}
                    height={64}
                    className="size-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid size-16 place-items-center rounded-full bg-orange/15 font-display text-2xl text-ink">
                    {listing.owner_name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <div className="font-display text-xl text-ink">
                    {listing.owner_name}
                  </div>
                  <div className="text-sm text-ink/60">
                    {listing.owner_years
                      ? `${formatYears(listing.owner_years)} as owner`
                      : "Owner-operator"}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <p className="mt-4 max-w-[70ch] whitespace-pre-line text-lg leading-relaxed text-ink/80">
        {body}
      </p>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-ink/15 px-3 py-1 text-ink/80">
      {children}
    </span>
  );
}

function DlRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-ink/50">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line text-base text-ink/90">
        {value}
      </dd>
    </div>
  );
}
