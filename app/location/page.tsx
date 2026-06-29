import Link from "next/link";
import { getSiteConfig } from "../lib/content";
import { pageMeta } from "../lib/seo";

const BOOKING_URL =
  "https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services";
const GIFT_URL = "https://app.squareup.com/gift/MLXZ54Y84T053/order";

export const metadata = pageMeta({
  title: "Location & Contact",
  description:
    "Jane's Therapy is located in San Jose, CA. Contact Jane directly for the address — text 669-292-4472 or email janezhang.therapist@gmail.com.",
  path: "/location",
});

export default function LocationPage() {
  const { hours } = getSiteConfig();

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="mb-14">
        <p className="eyebrow">Hours &amp; contact</p>
        <h1 className="font-display text-4xl sm:text-5xl text-bark mt-3 mb-3">
          Location &amp; Contact
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
                <p className="font-semibold text-bark">📍 Address</p>
                <p className="mt-1">
                  Jane is currently working from home temporarily.
                  <br />
                  <strong>Please contact Jane directly for the address.</strong>
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
            <h2 className="font-display text-xl text-bark mb-4">Hours</h2>
            <table className="w-full text-sm">
              <tbody>
                {hours.map((h) => (
                  <tr key={h.day} className={h.time === "Closed" ? "text-bark-light/50" : "text-bark-light"}>
                    <td className="py-1.5 font-medium text-bark">{h.day}</td>
                    <td className="py-1.5 text-right">{h.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
