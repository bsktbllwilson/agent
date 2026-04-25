import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  tone = "cream",
  size = "md",
}: {
  className?: string;
  tone?: "cream" | "ink" | "orange";
  size?: "sm" | "md" | "lg" | "giant";
}) {
  const color =
    tone === "cream"
      ? "text-cream"
      : tone === "orange"
        ? "text-orange"
        : "text-ink";
  const sizeCls =
    size === "giant"
      ? "text-[clamp(4rem,16vw,16rem)] leading-[0.85]"
      : size === "lg"
        ? "text-[clamp(1.75rem,3.5vw,2.5rem)] leading-none"
        : size === "sm"
          ? "text-[1rem] leading-none"
          : "text-[1.5rem] leading-none";
  return (
    <span
      className={cn(
        "font-chunky font-black uppercase tracking-[-0.02em]",
        sizeCls,
        color,
        className,
      )}
    >
      Pass The Plate
    </span>
  );
}
