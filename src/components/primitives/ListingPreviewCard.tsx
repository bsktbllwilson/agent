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
  const tag = listing.subtype || listing.cuisine || "Business";

  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-ink/5">
        {listing.hero_url ? (
          <Image
            src={listing.hero_url}
            alt={listing.name}
            fill
            sizes="(max-width: 768px) 85vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-orange/10 text-ink/40 font-display text-5xl">
            {listing.name.slice(0, 1)}
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-cream px-3 py-1 text-xs font-medium tracking-wide text-ink">
          {tag}
        </span>
        {listing.featured && (
          <span className="absolute right-4 bottom-4 rounded-full bg-orange px-3 py-1 text-xs font-medium text-cream">
            Featured
          </span>
        )}
        {showSaveButton && listing.slug && (
          <div className="absolute right-3 top-3">
            <SaveListingButton
              listingId={listing.id}
              initialSaved={saved}
              redirectPath={`/listings/${listing.slug}`}
              size="sm"
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-2xl leading-tight text-ink group-hover:underline underline-offset-4">
          {listing.name}
        </h3>
        {listing.neighborhood && (
          <p className="text-sm text-ink-muted">{listing.neighborhood}</p>
        )}
        <p className="mt-1 text-lg font-medium text-ink">
          {formatPrice(listing.price)}
        </p>
      </div>
    </Link>
  );
}
