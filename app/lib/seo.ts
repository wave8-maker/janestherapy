import type { Metadata } from "next";
import { getSiteConfig, slugify, type Service } from "./content";

/** Canonical production origin. Used for metadataBase, sitemap, and JSON-LD. */
export const SITE_URL = "https://janestherapy.com";

export const SITE_NAME = "Jane's Therapy";
export const SITE_TAGLINE = "Your Trusted Solo Therapist in San Jose";

/** Core business facts, reused across metadata and structured data. */
export const BUSINESS = {
  name: SITE_NAME,
  legalName: "Jane Zhang, CMT",
  telephone: "+1-669-292-4472",
  email: "janezhang.therapist@gmail.com",
  city: "San Jose",
  region: "CA",
  country: "US",
  priceRange: "$$",
  areaServed: ["San Jose", "Bay Area", "Silicon Valley"],
} as const;

/**
 * Builds a page's Metadata with a canonical URL and matching Open Graph /
 * Twitter tags. `title` is the short, unique part — the root layout's title
 * template appends the brand. The OG title carries the brand explicitly.
 */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const ogTitle = `${title} – ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      locale: "en_US",
      title: ogTitle,
      description,
    },
    twitter: { card: "summary_large_image", title: ogTitle, description },
  };
}

/** Maps a siteConfig day/time row to schema.org openingHoursSpecification. */
const DAY_MAP: Record<string, string> = {
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
  Sunday: "Sunday",
};

function parseHours() {
  const { hours } = getSiteConfig();
  return hours
    .filter((h) => h.time && h.time.toLowerCase() !== "closed")
    .map((h) => {
      // "9:30 AM – 8:30 PM" -> opens/closes in 24h
      const match = h.time.match(
        /(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*[–-]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i,
      );
      if (!match) return null;
      const to24 = (h12: string, m: string | undefined, ap: string) => {
        let hr = parseInt(h12, 10);
        if (/pm/i.test(ap) && hr !== 12) hr += 12;
        if (/am/i.test(ap) && hr === 12) hr = 0;
        return `${String(hr).padStart(2, "0")}:${m ?? "00"}`;
      };
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_MAP[h.day] ?? h.day,
        opens: to24(match[1], match[2], match[3]),
        closes: to24(match[4], match[5], match[6]),
      };
    })
    .filter(Boolean);
}

/** Modalities Jane practices — reused by LocalBusiness and Person JSON-LD. */
const KNOWS_ABOUT = [
  "Deep tissue massage",
  "Swedish massage",
  "Lymphatic drainage",
  "Prenatal massage",
  "Traditional Chinese Medicine",
  "Cupping therapy",
  "Gua Sha",
] as const;

/** schema.org Person JSON-LD for Jane — used on the About page. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/about#jane`,
    name: "Jane Zhang",
    honorificSuffix: "CMT",
    jobTitle: "Certified Massage Therapist",
    description:
      "Certified Massage Therapist in San Jose, CA specializing in deep tissue, sports recovery, prenatal and postpartum bodywork, and Traditional Chinese Medicine techniques including cupping, Gua Sha, and moxibustion.",
    image: `${SITE_URL}/jane-photo.webp`,
    url: `${SITE_URL}/about`,
    email: BUSINESS.email,
    telephone: BUSINESS.telephone,
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "National Holistic Institute",
    },
    worksFor: { "@id": `${SITE_URL}/#business` },
    knowsAbout: [...KNOWS_ABOUT],
    address: {
      "@type": "PostalAddress",
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
  };
}

/** schema.org Service JSON-LD for one treatment, linking to its own detail page. */
export function serviceJsonLd(svc: Service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Massage therapy",
    name: svc.name,
    description: svc.description,
    url: `${SITE_URL}/services/${slugify(svc.name)}`,
    provider: { "@type": "LocalBusiness", "@id": `${SITE_URL}/#business`, name: SITE_NAME },
    areaServed: { "@type": "Place", name: "San Jose, CA" },
    offers: svc.pricing.map((p) => ({
      "@type": "Offer",
      name: p.duration ? `${svc.name} — ${p.duration}` : svc.name,
      price: p.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
    })),
  };
}

/** schema.org LocalBusiness JSON-LD for the practice. */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HealthAndBeautyBusiness"],
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    description:
      "Solo massage therapy practice in San Jose, CA. Deep tissue, Swedish, lymphatic drainage, prenatal, and Traditional Chinese Medicine bodywork with Jane Zhang, CMT.",
    url: SITE_URL,
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    image: `${SITE_URL}/jane-photo.webp`,
    logo: `${SITE_URL}/logo.png`,
    priceRange: BUSINESS.priceRange,
    founder: { "@type": "Person", name: "Jane Zhang", jobTitle: "Certified Massage Therapist" },
    address: {
      "@type": "PostalAddress",
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    areaServed: BUSINESS.areaServed.map((name) => ({ "@type": "Place", name })),
    knowsAbout: [...KNOWS_ABOUT],
    openingHoursSpecification: parseHours(),
  };
}
