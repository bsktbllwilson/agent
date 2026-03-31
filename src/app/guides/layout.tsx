import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curated Guides — BridgeEast",
  description:
    "Step-by-step playbooks for Asian F&B brands opening in NYC. Covers visas, health permits, lease negotiation, hiring, sourcing, and brand localization.",
  openGraph: {
    title: "Curated Guides — BridgeEast",
    description:
      "Step-by-step playbooks for Asian F&B brands opening their first NYC location.",
    type: "website",
  },
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
