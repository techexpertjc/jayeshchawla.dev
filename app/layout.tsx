import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { profile } from "@/content/save-file";
import "./globals.css";

/*
  Self-hosted rather than next/font/google. Google's CDN is unreachable from
  Node in this environment (socket hang up on every fetch, twelve retries per
  build), and self-hosting is the better answer regardless: no build-time
  network dependency, no third-party request from visitors. Latin subsets
  only — 81 KB for all four faces.
*/

const inter = localFont({
  src: "./fonts/Inter-100-900.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
});

const zen = localFont({
  src: [
    { path: "./fonts/ZenMaruGothic-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ZenMaruGothic-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ZenMaruGothic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-zen",
  display: "swap",
  fallback: ["ui-rounded", "Hiragino Maru Gothic ProN", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: {
    default: `${profile.name} — ${profile.title}`,
    template: `%s — ${profile.name}`,
  },
  description: profile.tagline,
  authors: [{ name: profile.name }],
  creator: profile.name,
  openGraph: {
    type: "website",
    url: profile.siteUrl,
    title: `${profile.name} — ${profile.title}`,
    description: profile.tagline,
    siteName: profile.name,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.title}`,
    description: profile.tagline,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Edge-to-edge behind the notch; the HUD already insets itself.
  viewportFit: "cover",
  // Deliberately not disabling user zoom — pinching is how someone with low
  // vision reads the resume, and the canvas blocks its own gestures anyway.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfaf3" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1119" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${zen.variable}`}>
      <body>{children}</body>
    </html>
  );
}
