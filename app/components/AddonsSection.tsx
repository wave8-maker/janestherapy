import Link from "next/link";
import type { Addon } from "../lib/content";

export default function AddonsSection({ addons }: { addons: Addon[] }) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 justify-center py-12">
        <Link
          href="https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary px-10"
        >
          Book Now
        </Link>
        <Link
          href="https://app.squareup.com/gift/MLXZ54Y84T053/order"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary px-10"
        >
          Gift Card
        </Link>
      </div>

      <div className="bg-brand-light rounded-3xl p-10">
        <div className="text-center mb-8">
          <p className="eyebrow">Enhancements</p>
          <h2 className="font-display text-3xl text-bark mt-2 mb-2">Add-ons</h2>
          <p className="text-sm text-bark-light max-w-lg mx-auto">
            Choose from our add-ons to enhance your massage. Simply let your
            therapist know before or during your session.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => (
            <div
              key={addon.name}
              className="bg-white rounded-xl p-5 border border-brand-light shadow-sm transition-transform duration-300 hover:-translate-y-1"
            >
              <h3 className="font-display text-lg text-bark mb-2">{addon.name}</h3>
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
