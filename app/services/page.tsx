import Link from "next/link";
import { getServices, getAddons } from "../lib/content";
import AddonsSection from "../components/AddonsSection";
import JsonLd from "../components/JsonLd";
import { pageMeta, SITE_URL, SITE_NAME } from "../lib/seo";

const BOOKING_URL =
  "https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services";
const GIFT_URL = "https://app.squareup.com/gift/MLXZ54Y84T053/order";

export const metadata = pageMeta({
  title: "Massage Services",
  description:
    "Swedish, Clinical Deep Tissue, Lymphatic Drainage, Glow from Head to Toe, prenatal, and more — one-on-one with Jane Zhang, CMT in Palo Alto, CA.",
  path: "/services",
});

export default function ServicesPage() {
  const services = getServices();
  const addons = getAddons();

  const serviceLd = services.map((svc) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Massage therapy",
    name: svc.name,
    description: svc.description,
    provider: { "@type": "LocalBusiness", "@id": `${SITE_URL}/#business`, name: SITE_NAME },
    areaServed: { "@type": "Place", name: "Palo Alto, CA" },
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <JsonLd data={serviceLd} />
      <div className="text-center mb-14">
        <p className="eyebrow">Treatments &amp; pricing</p>
        <h1 className="font-display text-4xl sm:text-5xl text-bark mt-3 mb-4">
          Massage services at Jane&apos;s Therapy
        </h1>
        <p className="text-bark-light max-w-xl mx-auto text-lg">
          All sessions are one-on-one with Jane. Add cupping or Gua Sha to any treatment.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Book Now
          </Link>
          <Link href={GIFT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            Gift Card
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {services.map((svc) => (
          <div
            key={svc.name}
            className="card-soft p-7 transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h2 className="font-display text-xl text-bark">{svc.name}</h2>
              {svc.badge && (
                <span className="text-[0.65rem] uppercase tracking-wider bg-brand text-white px-2.5 py-1 rounded-full whitespace-nowrap">
                  {svc.badge}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {svc.pricing.map((p) => (
                <span
                  key={p.duration}
                  className="text-xs bg-brand-light text-bark-light px-3 py-1 rounded-full"
                >
                  {p.duration} — {p.price}
                </span>
              ))}
            </div>
            <p className="text-sm text-bark-light leading-relaxed">{svc.description}</p>
            {svc.details && svc.details.length > 0 && (
              <ul className="mt-3 space-y-1">
                {svc.details.map((d) => (
                  <li key={d} className="text-xs text-bark-light">• {d}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <AddonsSection addons={addons} />
    </div>
  );
}
