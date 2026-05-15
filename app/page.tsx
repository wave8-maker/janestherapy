import Image from "next/image";
import Link from "next/link";
import { services } from "./lib/services";
import AddonsSection from "./components/AddonsSection";
import ReviewsGallery from "./components/ReviewsGallery";

const conditions = [
  "Lower and Upper Back Pain",
  "Neck Pain, Headaches, and Migraines",
  "Frozen Shoulder",
  "Ankle and Knee Pain",
  "Hip Pain",
  "Sciatica",
  "Plantar Fasciitis",
  "Carpal Tunnel Syndrome",
  "Knee or Hip Arthritis",
];

const highlights = [
  {
    title: "800+ Hours of Training",
    desc: "Graduate of the National Holistic Institute (NHI) with extensive multi-modality training.",
  },
  {
    title: "Traditional Chinese Medicine",
    desc: "Deep roots in TCM inform every treatment—beyond western massage techniques.",
  },
  {
    title: "Solo Practitioner",
    desc: "Every session is with Jane directly. No handoffs, no surprises.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Notice banner */}
      <div className="bg-brand text-white text-center text-sm py-3 px-4">
        <strong>Jane is back and accepting new clients.</strong> Online booking
        is now open—schedule your next session today.
      </div>

      {/* Hero */}
      <section className="relative min-h-[560px] flex items-center justify-end">
        <Image
          src="/hero-banner.webp"
          alt="Jane's Therapy massage studio"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#a78a7b]/80" />
        <div className="relative z-10 max-w-5xl mx-auto w-full px-6 py-16 flex justify-end">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-sm text-white">
            <h2 className="text-lg font-semibold mb-4">
              Jane is here to help if you&apos;re experiencing:
            </h2>
            <ul className="space-y-2 text-sm">
              {conditions.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <span className="mt-0.5 text-white/70">•</span>
                  {c}
                </li>
              ))}
            </ul>
            <Link
              href="/services"
              className="mt-6 block text-center bg-white text-bark font-semibold py-2.5 rounded-full hover:bg-brand-light transition-colors"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-bark mb-4">
          Welcome to Jane&apos;s Therapy
        </h1>
        <p className="text-bark-light max-w-2xl mx-auto leading-relaxed">
          Nestled in Palo Alto, CA, Jane&apos;s Therapy offers a sanctuary from
          the stresses of daily life. We believe in the power of a great massage
          not just to relax but to heal—catering to your individual needs with
          every session.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sage text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Book an Appointment
          </Link>
          <Link
            href="https://app.squareup.com/gift/MLXZ54Y84T053/order"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-brand text-brand px-8 py-3 rounded-full font-semibold hover:bg-brand-light transition-colors"
          >
            Send a Gift Card
          </Link>
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-brand-light py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-center text-bark mb-10">
            Why Clients Choose Jane
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-brand-light"
              >
                <h3 className="font-semibold text-bark mb-2">{h.title}</h3>
                <p className="text-sm text-bark-light leading-relaxed">
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-bark mb-3">
            Massage Services at Jane&apos;s Therapy
          </h2>
          <p className="text-bark-light text-sm">
            All sessions are one-on-one with Jane. Add cupping or Gua Sha to any treatment.
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
                <h3 className="text-lg font-semibold text-bark">{svc.name}</h3>
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
      </section>

      {/* Reviews */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-bark text-center mb-10">
          What Clients Say
        </h2>
        <ReviewsGallery />
      </section>

      {/* CTA strip */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-bark-light mb-4">
          Questions? Jane responds to texts only.
        </p>
        <a
          href="sms:6692924472"
          className="text-brand font-semibold text-lg hover:underline"
        >
          Text 669-292-4472
        </a>
        <span className="mx-4 text-bark-light">or</span>
        <a
          href="mailto:janezhang.therapist@gmail.com"
          className="text-brand font-semibold text-lg hover:underline"
        >
          Email Jane
        </a>
      </section>
    </>
  );
}
