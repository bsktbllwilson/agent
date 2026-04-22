"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { saveListing, unsaveListing } from "@/lib/actions";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  initialSaved: boolean;
  redirectPath: string;
  variant?: "overlay" | "inline";
  size?: "sm" | "md";
};

export function SaveListingButton({
  listingId,
  initialSaved,
  redirectPath,
  variant = "overlay",
  size = "md",
}: Props) {
  const [optimistic, setOptimistic] = useOptimistic(
    initialSaved,
    (_prev, next: boolean) => next,
  );
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const next = !optimistic;
      setOptimistic(next);
      try {
        if (next) {
          await saveListing(listingId, redirectPath);
        } else {
          await unsaveListing(listingId, redirectPath);
        }
      } catch {
        setOptimistic(!next);
      }
    });
  }

  const dim = size === "sm" ? "size-9" : "size-11";
  const iconDim = size === "sm" ? "size-4" : "size-5";

  const base =
    "inline-flex items-center justify-center rounded-full transition-[background-color,transform,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink disabled:opacity-60";
  const look =
    variant === "overlay"
      ? "bg-cream/95 text-ink shadow-sm hover:bg-cream backdrop-blur"
      : "border border-ink/15 bg-white text-ink hover:border-ink";

  return (
    <button
      type="button"
      aria-label={optimistic ? "Unsave listing" : "Save listing"}
      aria-pressed={optimistic}
      disabled={pending}
      onClick={handleClick}
      className={cn(base, look, dim)}
    >
      <Heart
        aria-hidden
        className={cn(
          iconDim,
          "transition-[fill,color] duration-200",
          optimistic ? "fill-orange text-orange" : "fill-transparent text-ink",
        )}
      />
    </button>
  );
}
