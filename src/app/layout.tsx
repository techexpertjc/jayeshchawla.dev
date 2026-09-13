import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jayeshchawla.dev"),
  title: "Jayesh Chawla — Senior Frontend Engineer",
  description:
    "Frontends built pixel-perfect, then owned in production. Portfolio of Jayesh Chawla, a senior frontend engineer working in React, Next.js and TypeScript.",
  openGraph: {
    type: "website",
    url: "https://jayeshchawla.dev",
    siteName: "Jayesh Chawla",
    title: "Jayesh Chawla — Senior Frontend Engineer",
    description: "Frontends built pixel-perfect, then owned in production. React, Next.js and TypeScript.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${jetbrainsMono.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
