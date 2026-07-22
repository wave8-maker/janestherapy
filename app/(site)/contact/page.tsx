import Link from "next/link";
import { getSiteConfig, getServiceModes } from "@/app/lib/content";
import JsonLd from "@/app/components/JsonLd";
import { pageMeta } from "@/app/lib/seo";

const BOOKING_URL =
  "https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services";
const GIFT_URL = "https://app.squareup.com/gift/MLXZ54Y84T053/order";

export const metadata = pageMeta({
  title: "Contact",
  description:
    "Jane's Therapy is based in San Jose, CA — visit the studio or book a mobile visit across the South Bay: Palo Alto, Mountain View, Sunnyvale, Santa Clara, Cupertino, Los Gatos & more. Text 669-292-4472.",
  path: "/contact",
});

export default async function ContactPage() {
  const { hours } = await getSiteConfig();
  const mobile = getServiceModes().modes.find((m) => m.key === "mobile");

  // Single source of truth for the visible FAQ and the FAQPage JSON-LD.
  const openDays = hours.filter((h) => h.time.toLowerCase() !== "closed");
  const hoursAnswer =
    openDays.length === 7 && new Set(openDays.map((h) => h.time)).size === 1
      ? `Open every day, ${openDays[0].time}.`
      : openDays.map((h) => `${h.day}: ${h.time}`).join("; ") + ".";
  const faqs = [
    {
      q: "Where is Jane's Therapy located?",
      a: "Jane sees clients from her private home studio in San Jose, CA. The exact address is shared once your appointment is confirmed.",
    },
    {
      q: "Do you offer mobile (outcall) massage?",
      a: `Yes. Jane brings the massage table, fresh linens, and oils to your home, hotel, or office across the South Bay${mobile?.areas ? ` — including ${mobile.areas.join(", ")}` : ""}. ${mobile?.note ?? ""}`.trim(),
    },
    {
      q: "What are your hours?",
      a: hoursAnswer,
    },
    {
      q: "How do I book an appointment?",
      a: "Book online through Square, or text Jane at 669-292-4472 (text only — Jane is a solo practitioner with no front desk staff).",
    },
    {
      q: "Do you sell gift cards?",
      a: "Yes, digital gift cards are available for purchase online through Square.",
    },
  ];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <JsonLd data={faqLd} />
      <div className="mb-14">
        <p className="eyebrow">Get in touch</p>
        <h1 className="font-display text-4xl sm:text-5xl text-bark mt-3 mb-3">
          Contact
        </h1>
        <p className="text-bark-light text-lg">
          Jane is a solo practitioner — reach out directly for anything you need.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="card-soft p-7">
            <h2 className="font-display text-xl text-bark mb-4">Jane&apos;s Therapy</h2>
            <div className="space-y-4 text-sm text-bark-light">
              <div>
                <p className="font-semibold text-bark">📍 In studio</p>
                <p className="mt-1">
                  Jane sees clients from her private home studio in San Jose. The
                  exact address is shared once your appointment is confirmed.
                </p>
              </div>
              <div>
                <p className="font-semibold text-bark">🚗 Mobile · we come to you</p>
                <p className="mt-1">
                  Prefer to stay home? Mobile visits are available across the
                  South Bay and Peninsula
                  {mobile?.areas ? ` — including ${mobile.areas.join(", ")}` : ""}.
                  An additional travel fee applies — details are shown when you
                  book on Square. Text to confirm your location.
                </p>
              </div>
              <div>
                <p className="font-semibold text-bark">📧 Email</p>
                <a href="mailto:janezhang.therapist@gmail.com" className="text-brand hover:underline mt-1 block">
                  janezhang.therapist@gmail.com
                </a>
              </div>
              <div>
                <p className="font-semibold text-bark">📱 Text only</p>
                <a href="sms:6692924472" className="text-brand hover:underline mt-1 block">669-292-4472</a>
                <p className="text-xs mt-1 text-bark-light/70">
                  I do not have front desk staff. Please text me and I&apos;ll respond as soon as possible.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
                Book Online
              </Link>
              <Link href={GIFT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
                Gift Card
              </Link>
            </div>
          </div>

          <div className="card-soft p-7">
            <h2 className="font-display text-xl text-bark mb-2">Looking for an opening?</h2>
            <p className="text-sm text-bark-light leading-relaxed mb-4">
              See Jane&apos;s hours and approximate openings for the next four
              weeks at a glance.
            </p>
            <Link href="/availability" className="btn btn-secondary w-full">
              Check availability
            </Link>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-brand-light shadow-sm h-[500px] sm:h-auto">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d50000!2d-121.93905!3d37.34962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: "400px" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* FAQ — rendered from the same data as the FAQPage JSON-LD above */}
      <section className="mt-20">
        <p className="eyebrow">Good to know</p>
        <h2 className="font-display text-3xl text-bark mt-3 mb-8">
          Frequently asked questions
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {faqs.map((f) => (
            <div key={f.q} className="card-soft p-6">
              <h3 className="font-semibold text-bark text-base mb-2">{f.q}</h3>
              <p className="text-sm text-bark-light leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
