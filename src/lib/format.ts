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
