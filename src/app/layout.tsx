import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pass The Plate — Marketplace for Asian F&B Businesses",
  description:
    "The first marketplace for the $240B+ Asian F&B transition. Buy and sell Asian-owned restaurants, grocery, manufacturing, and more.",
  metadataBase: new URL("https://passtheplate.example.com"),
  openGraph: {
    title: "Pass The Plate",
    description:
      "The first marketplace for the $240B+ Asian F&B transition.",
    images: ["/og.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pass The Plate",
    description:
      "The first marketplace for the $240B+ Asian F&B transition.",
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "rgb(248, 243, 222)",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Adobe Typekit — Please Display VF + Proxima Nova */}
        <link rel="stylesheet" href="https://use.typekit.net/cub1hgl.css" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
