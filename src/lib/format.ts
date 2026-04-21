export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "Price on request";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m.toFixed(m >= 10 ? 1 : 2).replace(/\.0+$/, "")}M`;
  }
  if (value >= 1_000) {
    const k = Math.round(value / 1_000);
    return `$${k}K`;
  }
  return `$${value.toLocaleString("en-US")}`;
}

export function formatRevenue(value: number | null | undefined): string {
  if (value == null) return "—";
  return formatPrice(value);
}

export function formatArea(sqft: number | null | undefined): string {
  if (sqft == null) return "—";
  return `${sqft.toLocaleString("en-US")} sqft`;
}

export function formatYears(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n} ${n === 1 ? "year" : "years"}`;
}

export function formatEstablished(year: number | null | undefined): string {
  if (year == null) return "—";
  return `Est. ${year}`;
}

export function formatStatus(status: string | null | undefined): {
  label: string;
  tone: "draft" | "pending" | "published" | "rejected" | "unknown";
} {
  const s = (status ?? "").toLowerCase();
  if (s === "draft") return { label: "Draft", tone: "draft" };
  if (s === "pending") return { label: "Pending review", tone: "pending" };
  if (s === "published") return { label: "Published", tone: "published" };
  if (s === "rejected") return { label: "Needs revisions", tone: "rejected" };
  return { label: status ?? "Unknown", tone: "unknown" };
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 72);
}

