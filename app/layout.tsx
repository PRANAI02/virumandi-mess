import type { Metadata } from "next";
// Both families carry Tamil and Latin, so the two scripts are set in the
// same voice instead of one falling back. Anek Tamil is a contemporary
// Tamil grotesk; Hind Madurai is named for the city and reads like the
// print you see on a mess board.
import { Anek_Tamil, Hind_Madurai } from "next/font/google";
import "./globals.css";
import { INFO } from "@/lib/data";

const SITE_URL = "https://virumandi-mess.vercel.app";

const display = Anek_Tamil({
  subsets: ["latin", "tamil"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--f-display",
});

const body = Hind_Madurai({
  subsets: ["latin", "tamil"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--f-body",
});

const TITLE = `${INFO.name} — Tamil Nadu meals in ${INFO.addressShort}, ${INFO.city}`;
const DESC = `${INFO.tagline}. Mutton, fish, crab, prawn and chicken at ${INFO.name}, ${INFO.landmark}, ${INFO.addressShort}, ${INFO.city}.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    locale: "en_IN",
    siteName: INFO.name,
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: INFO.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/images/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
