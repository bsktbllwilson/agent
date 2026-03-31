import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NYC Market Data — BridgeEast",
  description:
    "Neighborhood-level rent benchmarks, foot traffic scores, and Asian dining demand heatmaps for NYC commercial real estate. Data from REBNY, CBRE, MTA, and NYC DOHMH.",
  openGraph: {
    title: "NYC Market Data — BridgeEast",
    description:
      "Interactive market data dashboard for Asian F&B brands evaluating New York City neighborhoods.",
    type: "website",
  },
};

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
