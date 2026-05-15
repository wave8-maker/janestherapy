import Link from "next/link";
import type { Addon } from "../lib/content";

export default function AddonsSection({ addons }: { addons: Addon[] }) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 justify-center py-10">
        <Link
          href="https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-sage text-white px-10 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity text-center"
        >
          Book Now
        </Link>
        <Link
          href="https://app.squareup.com/gift/MLXZ54Y84T053/order"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-brand text-brand px-10 py-3 rounded-full font-semibold hover:bg-brand-light transition-colors text-center"
        >
          Gift Card
        </Link>
      </div>

      <div className="bg-brand-light rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-bark text-center mb-2">ADD-ONs</h2>
        <p className="text-sm text-bark-light text-center mb-8">
          Choose from our add-ons to enhance your massage. Simply let your
          therapist know before or during your session.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => (
            <div
              key={addon.name}
              className="bg-white rounded-xl p-5 border border-brand-light shadow-sm"
            >
              <h3 className="font-semibold text-bark mb-2">{addon.name}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {addon.pricing.map((p, i) => (
                  <span
                    key={i}
                    className="text-xs bg-brand-light text-bark-light px-3 py-1 rounded-full"
                  >
                    {p.duration ? `${p.duration} — ` : ""}
                    {p.price}
                  </span>
                ))}
              </div>
              <p className="text-sm text-bark-light leading-relaxed">
                {addon.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
