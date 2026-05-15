import type { Metadata } from "next";
import Link from "next/link";
import { services } from "../lib/services";
import AddonsSection from "../components/AddonsSection";

export const metadata: Metadata = {
  title: "Massage Services – Jane's Therapy",
  description:
    "Swedish, Clinical Deep Tissue, Lymphatic Drainage, Glow from Head to Toe, and more. Located in Palo Alto, CA.",
};

export default function ServicesPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-bark mb-3">
          Massage Services at Jane&apos;s Therapy
        </h1>
        <p className="text-bark-light max-w-xl mx-auto">
          All sessions are one-on-one with Jane. Add cupping or Gua Sha to any
          treatment.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sage text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Book Now
          </Link>
          <Link
            href="https://app.squareup.com/gift/MLXZ54Y84T053/order"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-brand text-brand px-8 py-3 rounded-full font-semibold hover:bg-brand-light transition-colors"
          >
            Gift Card
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {services.map((svc) => (
          <div
            key={svc.name}
            className="bg-white border border-brand-light rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-bark">{svc.name}</h2>
              {svc.badge && (
                <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full whitespace-nowrap">
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
            <p className="text-sm text-bark-light leading-relaxed">
              {svc.description}
            </p>
            {svc.details && (
              <ul className="mt-3 space-y-1">
                {svc.details.map((d) => (
                  <li key={d} className="text-xs text-bark-light">
                    • {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <AddonsSection />
    </div>
  );
}
