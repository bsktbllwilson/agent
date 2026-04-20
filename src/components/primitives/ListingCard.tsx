"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Listing } from "../../../content/schema";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group flex w-full flex-col gap-4"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-ink/5">
        <Image
          src={listing.image}
          alt={listing.name}
          fill
          sizes="(max-width: 768px) 85vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-cream px-3 py-1 text-xs font-medium tracking-wide text-ink">
          {listing.category}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-2xl leading-tight text-ink">
          {listing.name}
        </h3>
        <p className="text-sm text-ink-muted">
          {listing.city} · {listing.state}
        </p>
        <p className="mt-1 text-lg font-medium text-ink">{listing.price}</p>
      </div>
    </motion.article>
  );
}
