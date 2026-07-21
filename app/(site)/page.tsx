import Image from "next/image";
import Link from "next/link";
import { getSiteConfig, getServices, getAddons, getReviews, slugify } from "@/app/lib/content";
import AddonsSection from "@/app/components/AddonsSection";
import ServiceModes from "@/app/components/ServiceModes";
import ReviewsSection from "@/app/components/ReviewsSection";

const BOOKING_URL =
  "https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services";
const GIFT_URL = "https://app.squareup.com/gift/MLXZ54Y84T053/order";

const conditions = [
  "Lower & upper back pain",
  "Neck pain, headaches & migraines",
  "Frozen shoulder",
  "Ankle & knee pain",
  "Hip pain",
  "Sciatica",
  "Plantar fasciitis",
  "Carpal tunnel syndrome",
  "Knee or hip arthritis",
];

const highlights = [
  {
    title: "800+ hours of training",
    desc: "Graduate of the National Holistic Institute with extensive multi-modality training.",
  },
  {
    title: "Traditional Chinese Medicine",
    desc: "Deep roots in TCM inform every treatment — beyond Western massage techniques.",
  },
  {
    title: "A true solo practitioner",
    desc: "Every session is with Jane directly. No handoffs, no front desk, no surprises.",
  },
];

export default function HomePage() {
  const { announcement } = getSiteConfig();
  const services = getServices();
  const addons = getAddons();
  const reviews = getReviews();

  return (
    <>
      {announcement && (
        <div className="bg-brand text-white text-center text-sm py-2.5 px-4">
          <strong className="font-medium tracking-wide">{announcement}</strong>
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <Image
          src="/hero-banner.webp"
          alt="Calm massage therapy studio at Jane's Therapy in San Jose"
          fill
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(38,27,20,0.86) 0%, rgba(44,32,24,0.55) 45%, rgba(110,82,60,0.25) 100%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto w-full px-6 py-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          {/* Headline */}
          <div className="text-white max-w-xl">
            <p className="eyebrow text-brand-light reveal reveal-1">
              Massage Therapy · San Jose, CA
            </p>
            <h1 className="reveal reveal-2 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] mt-5">
              Therapeutic massage in San Jose, made personal.
            </h1>
            <p className="reveal reveal-3 mt-6 text-white/85 text-lg leading-relaxed max-w-md">
              Deep tissue, Swedish, lymphatic drainage, and Traditional Chinese
              Medicine bodywork — one-on-one with Jane Zhang, CMT, in her San
              Jose studio or at your door.
            </p>
            <div className="reveal reveal-4 mt-9 flex flex-col sm:flex-row gap-4">
              <Link href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Book an Appointment
              </Link>
              <Link
                href="/services"
                className="btn border border-white/40 text-white hover:bg-white/10"
              >
                View Services
              </Link>
            </div>
          </div>

          {/* Conditions card */}
          <div className="reveal reveal-5 card-soft bg-white/10 backdrop-blur-md border-white/20 p-7 text-white">
            <p className="eyebrow text-brand-light">Here to help with</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {conditions.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-light shrink-0" />
                  <span className="text-white/90">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-warm-glow">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="eyebrow">A sanctuary in Silicon Valley</p>
          <h2 className="font-display text-3xl sm:text-4xl text-bark mt-4 leading-tight">
            We believe a great massage doesn&apos;t just relax — it heals.
          </h2>
          <p className="mt-6 text-bark-light text-lg leading-relaxed">
            Nestled in San Jose, Jane&apos;s Therapy offers a quiet refuge from the
            pace of daily life. Each session is tailored to your body and your
            goals, blending clinical technique with genuine, unhurried care.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Book an Appointment
            </Link>
            <Link href={GIFT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Send a Gift Card
            </Link>
          </div>
        </div>
      </section>

      {/* Studio or Mobile */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <ServiceModes />
      </section>

      {/* Why clients choose Jane */}
      <section className="bg-brand-light">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="eyebrow">Why clients choose Jane</p>
            <h2 className="font-display text-3xl sm:text-4xl text-bark mt-3">
              Care you can feel the difference of
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <div key={h.title} className="card-soft p-8 group">
                <span className="font-display text-2xl text-brand/70">
                  0{i + 1}
                </span>
                <h3 className="font-display text-xl text-bark mt-3 mb-2">{h.title}</h3>
                <p className="text-sm text-bark-light leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="eyebrow">Treatments</p>
          <h2 className="font-display text-3xl sm:text-4xl text-bark mt-3 mb-4">
            Massage services at Jane&apos;s Therapy
          </h2>
          <p className="text-bark-light max-w-xl mx-auto">
            All sessions are one-on-one with Jane — in her studio or at your
            place. Add cupping or Gua Sha to any treatment.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="card-soft p-7 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-display text-xl text-bark">{svc.name}</h3>
                {svc.badge && (
                  <span className="text-[0.65rem] uppercase tracking-wider bg-brand text-white px-2.5 py-1 rounded-full whitespace-nowrap">
                    {svc.badge}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
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
              <Link
                href={`/services/${slugify(svc.name)}`}
                className="mt-4 inline-flex items-center gap-1 text-brand text-sm font-semibold link-underline"
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>
        <AddonsSection addons={addons} />
      </section>

      {/* Reviews — anchor target for /#reviews links */}
      <section id="reviews" className="bg-brand-light scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="eyebrow">In their words</p>
            <h2 className="font-display text-3xl sm:text-4xl text-bark mt-3">
              What clients say
            </h2>
          </div>
          <ReviewsSection content={reviews} />
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="eyebrow">Get in touch</p>
        <h2 className="font-display text-3xl sm:text-4xl text-bark mt-3 mb-6">
          Questions? Jane responds to texts.
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="sms:6692924472" className="btn btn-primary">
            Text 669-292-4472
          </a>
          <a href="mailto:janezhang.therapist@gmail.com" className="btn btn-secondary">
            Email Jane
          </a>
        </div>
      </section>
    </>
  );
}
