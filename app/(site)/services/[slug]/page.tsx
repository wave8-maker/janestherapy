import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServices, getServiceBySlug, slugify } from "@/app/lib/content";
import JsonLd from "@/app/components/JsonLd";
import { serviceJsonLd, SITE_URL, SITE_NAME } from "@/app/lib/seo";

const BOOKING_URL =
  "https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services";

export async function generateStaticParams() {
  return getServices().map((s) => ({ slug: slugify(s.name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const svc = getServiceBySlug(slug);
  if (!svc) return {};
  const title = svc.name;
  const description = svc.tagline
    ? `${svc.tagline} ${svc.description}`
    : svc.description;
  return {
    title,
    description,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/services/${slug}`,
      siteName: SITE_NAME,
      title: `${title} – ${SITE_NAME}`,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const svc = getServiceBySlug(slug);
  if (!svc) notFound();

  const story = svc.story && svc.story.length > 0 ? svc.story : [svc.description];

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <JsonLd data={serviceJsonLd(svc)} />
      <Link href="/services" className="text-sm text-brand link-underline mb-8 inline-block">
        ← Back to Services
      </Link>

      <div className="flex items-start justify-between gap-2 mb-3">
        <h1 className="font-display text-3xl sm:text-4xl text-bark leading-tight">{svc.name}</h1>
        {svc.badge && (
          <span className="text-[0.65rem] uppercase tracking-wider bg-brand text-white px-2.5 py-1 rounded-full whitespace-nowrap mt-2">
            {svc.badge}
          </span>
        )}
      </div>
      {svc.tagline && <p className="text-brand font-semibold text-lg mb-6">{svc.tagline}</p>}

      <div className="text-bark-light text-[1.0625rem] leading-relaxed space-y-5">
        {story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {svc.details && svc.details.length > 0 && (
        <ul className="mt-8 space-y-2">
          {svc.details.map((d) => (
            <li key={d} className="text-sm text-bark-light">• {d}</li>
          ))}
        </ul>
      )}

      <div className="mt-12 pt-8 border-t border-brand-light text-center">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {svc.pricing.map((p) => (
            <span
              key={p.duration}
              className="text-sm bg-brand-light text-bark-light px-3 py-1.5 rounded-full"
            >
              {p.duration} — {p.price}
            </span>
          ))}
        </div>
        <Link
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-sage text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
        >
          Book a Session
        </Link>
      </div>
    </div>
  );
}
