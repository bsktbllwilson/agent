import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist — BridgeEast",
  description:
    "Get early access to BridgeEast's NYC market intelligence platform. Personalized neighborhood recommendations, partner introductions, and market reports for Asian F&B brands.",
  openGraph: {
    title: "Join the Waitlist — BridgeEast",
    description:
      "Get early access to market data, guides, and partner introductions for your NYC expansion.",
    type: "website",
  },
};

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
