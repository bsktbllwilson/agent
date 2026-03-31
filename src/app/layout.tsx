import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "BridgeEast — Helping Asian F&B Brands Launch in NYC",
  description:
    "Market data, curated guides, and vetted partners to help Asian food & beverage brands navigate their first New York City location.",
  metadataBase: new URL("https://bridgeeast.co"),
  openGraph: {
    title: "BridgeEast — Helping Asian F&B Brands Launch in NYC",
    description:
      "Data, guides, and vetted partners to help Asian F&B brands open their first New York City location.",
    type: "website",
    siteName: "BridgeEast",
  },
  twitter: {
    card: "summary_large_image",
    title: "BridgeEast — Helping Asian F&B Brands Launch in NYC",
    description:
      "Data, guides, and vetted partners to help Asian F&B brands open their first New York City location.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
