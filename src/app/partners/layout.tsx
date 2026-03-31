import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Directory — BridgeEast",
  description:
    "Vetted NYC specialists for Asian F&B brands: real estate brokers, immigration attorneys, ingredient distributors, PR agencies, and accountants.",
  openGraph: {
    title: "Partner Directory — BridgeEast",
    description:
      "Searchable directory of vetted local specialists who help Asian F&B brands succeed in NYC.",
    type: "website",
  },
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
