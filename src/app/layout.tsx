import type { ReactNode } from "react";
import "./globals.css";

// The actual <html>/<body> shell lives in src/app/[locale]/layout.tsx so the
// `lang` attribute can reflect the active locale. Next still requires a root
// layout file, so this passes children through.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
