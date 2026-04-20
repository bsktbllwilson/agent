"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type PillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "orange" | "cream" | "outline";
  size?: "md" | "lg";
};

export function PillButton({
  className,
  variant = "orange",
  size = "lg",
  ...props
}: PillButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-body font-medium transition-[background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink disabled:pointer-events-none disabled:opacity-60 active:translate-y-px",
        variant === "orange" && "bg-orange text-cream hover:bg-[rgb(210,68,28)]",
        variant === "cream" && "bg-cream text-ink hover:bg-cream/80",
        variant === "outline" &&
          "border border-ink bg-transparent text-ink hover:bg-ink hover:text-cream",
        size === "md" && "px-6 py-3 text-base",
        size === "lg" && "px-8 py-4 text-lg",
        className,
      )}
    />
  );
}
