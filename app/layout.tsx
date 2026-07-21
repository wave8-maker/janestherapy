import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { SITE_URL, SITE_NAME } from "./lib/seo";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Jane's Therapy – Massage Therapist in San Jose",
    template: "%s – Jane's Therapy",
  },
  description:
    "Personalized massage therapy in San Jose, CA with Jane Zhang, CMT. Deep tissue, Swedish, lymphatic drainage, prenatal, and Traditional Chinese Medicine bodywork.",
  applicationName: SITE_NAME,
  keywords: [
    "massage San Jose",
    "massage therapist San Jose",
    "mobile massage San Jose",
    "in-home massage San Jose",
    "outcall massage Bay Area",
    "deep tissue massage Bay Area",
    "Swedish massage",
    "lymphatic drainage",
    "prenatal massage",
    "Traditional Chinese Medicine massage",
    "Jane Zhang CMT",
  ],
  authors: [{ name: "Jane Zhang, CMT" }],
  creator: "Jane Zhang, CMT",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    title: "Jane's Therapy – Massage Therapist in San Jose",
    description:
      "Personalized massage therapy in San Jose, CA with Jane Zhang, CMT. Deep tissue, Swedish, lymphatic drainage, prenatal, and TCM bodywork.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jane's Therapy – Massage Therapist in San Jose",
    description:
      "Personalized massage therapy in San Jose, CA with Jane Zhang, CMT.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${fraunces.variable} ${hanken.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
