import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  tone = "cream",
}: {
  className?: string;
  tone?: "cream" | "ink" | "orange";
}) {
  const color =
    tone === "cream"
      ? "text-cream"
      : tone === "orange"
        ? "text-orange"
        : "text-ink";
  return (
    <span
      className={cn(
        "font-display text-[1.375rem] leading-none tracking-tight",
        color,
        className,
      )}
    >
      Pass <span className="italic">The</span> Plate
    </span>
  );
}
