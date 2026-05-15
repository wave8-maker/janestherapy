import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "../lib/content";

export const metadata: Metadata = {
  title: "Location & Contact – Jane's Therapy",
  description:
    "Jane's Therapy is located in Palo Alto, CA. Contact Jane directly for the address. Text 669-292-4472 or email janezhang.therapist@gmail.com.",
};

export default function LocationPage() {
  const { hours } = getSiteConfig();

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-bark mb-2">Location &amp; Contact</h1>
      <p className="text-bark-light mb-12">
        Jane is a solo practitioner—reach out directly for anything you need.
      </p>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="bg-white border border-brand-light rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-bark mb-4 text-lg">Jane&apos;s Therapy</h2>
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
              <Link
                href="https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sage text-white text-center py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Book Online
              </Link>
              <Link
                href="https://app.squareup.com/gift/MLXZ54Y84T053/order"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-brand text-brand text-center py-2.5 rounded-full text-sm font-semibold hover:bg-brand-light transition-colors"
              >
                Gift Card
              </Link>
            </div>
          </div>

          <div className="bg-white border border-brand-light rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-bark mb-4 text-lg">Hours</h2>
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
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4092.5682837185136!2d-122.14570920000001!3d37.4267101!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fbae5dda40001%3A0x7854da457a0b4012!2s415%20Cambridge%20Ave%20%2321%2C%20Palo%20Alto%2C%20CA%2094306!5e1!3m2!1sen!2sus!4v1741019372502!5m2!1sen!2sus"
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
