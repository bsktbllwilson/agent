"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Category } from "../../../content/schema";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <motion.a
      href={`#${category.slug}`}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-ink/5"
    >
      <Image
        src={category.image}
        alt={category.label}
        fill
        sizes="(max-width: 768px) 85vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-x-4 bottom-4 rounded-[1rem] bg-cream/95 p-4 backdrop-blur">
        <h3 className="font-display text-2xl leading-tight text-ink">
          {category.label}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">{category.tagline}</p>
      </div>
    </motion.a>
  );
}
