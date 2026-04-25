import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { SaveListingButton } from "@/components/primitives/SaveListingButton";
import type { Listing } from "@/lib/types";

type Props = {
  listing: Pick<
    Listing,
    | "id"
    | "slug"
    | "name"
    | "neighborhood"
    | "cuisine"
    | "subtype"
    | "price"
    | "hero_url"
    | "featured"
  >;
  saved?: boolean;
  showSaveButton?: boolean;
};

export function ListingPreviewCard({
  listing,
  saved = false,
  showSaveButton = false,
}: Props) {
  const href = listing.slug ? `/listings/${listing.slug}` : "#";
  const meta = [listing.neighborhood, listing.cuisine || listing.subtype]
    .filter(Boolean)
    .join(" | ");

  return (
    <Link
      href={href}
      className="group relative isolate flex aspect-[5/7] items-end overflow-hidden rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
    >
      {listing.hero_url ? (
        <Image
          src={listing.hero_url}
          alt={listing.name}
          fill
          sizes="(max-width: 768px) 85vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-orange/15 font-display text-7xl text-ink/40">
          {listing.name.slice(0, 1)}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />

      {listing.featured && (
        <span className="absolute left-4 top-4 z-20 rounded-full bg-orange px-3 py-1 text-xs font-medium uppercase tracking-wide text-cream">
          Featured
        </span>
      )}
      {showSaveButton && listing.slug && (
        <div className="absolute right-3 top-3 z-20">
          <SaveListingButton
            listingId={listing.id}
            initialSaved={saved}
            redirectPath={`/listings/${listing.slug}`}
            size="sm"
          />
        </div>
      )}

      <div className="relative z-10 flex w-full flex-col items-center gap-1 p-6 text-center text-cream">
        <h3 className="font-display text-[clamp(1.5rem,2.4vw,2.5rem)] leading-[1.05]">
          {listing.name}
        </h3>
        {meta && <p className="text-sm text-cream/85">{meta}</p>}
        <p className="mt-1 text-base font-semibold">
          {formatPrice(listing.price)}
        </p>
      </div>
    </Link>
  );
}
