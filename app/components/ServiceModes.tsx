import Link from "next/link";
import { getServiceModes } from "../lib/content";

/* Minimal line icons, drawn in currentColor so each card's accent flows through. */
function StudioIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <path d="M12 21c4.5-4.2 6.75-7.5 6.75-10.5A6.75 6.75 0 0 0 5.25 10.5C5.25 13.5 7.5 16.8 12 21Z" />
      <circle cx="12" cy="10.25" r="2.25" />
    </svg>
  );
}

export default function ServiceModes({ className = "" }: { className?: string }) {
  const { bookingUrl, eyebrow, heading, subheading, modes } = getServiceModes();
  const [studio, mobile] = modes;

  return (
    <div className={className}>
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-display text-3xl sm:text-4xl text-bark mt-3 leading-tight">
          {heading}
        </h2>
        <p className="mt-4 text-bark-light leading-relaxed">{subheading}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Studio — clay accent */}
        <article className="card-soft p-8 flex flex-col">
          <div className="flex items-center gap-4">
            <span className="h-12 w-12 shrink-0 grid place-items-center rounded-full bg-brand-light text-brand-dark">
              <StudioIcon />
            </span>
            <p className="eyebrow !text-brand-dark">{studio.label}</p>
          </div>
          <h3 className="font-display text-2xl text-bark mt-6 mb-3">{studio.title}</h3>
          <p className="text-bark-light leading-relaxed">{studio.description}</p>
          <p className="mt-auto pt-6 text-sm text-bark-light flex items-start gap-2">
            <span className="text-brand mt-px">◦</span>
            <span>{studio.meta}</span>
          </p>
          <Link
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-6 w-full sm:w-fit px-8"
          >
            Book a studio visit
          </Link>
        </article>

        {/* Mobile — sage accent, carries the travel-fee note + booking CTA */}
        <article className="card-soft p-8 flex flex-col relative overflow-hidden border-sage/30 ring-1 ring-sage/10">
          <span className="absolute top-0 right-0 text-[0.62rem] uppercase tracking-[0.16em] font-semibold bg-sage text-white px-3.5 py-1.5 rounded-bl-xl">
            Travel fee applies
          </span>
          <div className="flex items-center gap-4">
            <span className="h-12 w-12 shrink-0 grid place-items-center rounded-full bg-sage/10 text-sage">
              <MobileIcon />
            </span>
            <p className="eyebrow !text-sage-dark">{mobile.label}</p>
          </div>
          <h3 className="font-display text-2xl text-bark mt-6 mb-3">{mobile.title}</h3>
          <p className="text-bark-light leading-relaxed">{mobile.description}</p>
          {mobile.areas && mobile.areas.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-dark mb-2.5">
                {mobile.meta}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {mobile.areas.map((city) => (
                  <li
                    key={city}
                    className="text-[0.72rem] bg-sage/[0.09] text-sage-dark px-2.5 py-1 rounded-full"
                  >
                    {city}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {mobile.note && (
            <div className="mt-5 rounded-xl bg-sage/[0.07] border border-sage/20 px-4 py-3 text-sm text-sage-dark leading-relaxed">
              {mobile.note}
            </div>
          )}
          <Link
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-6 w-full sm:w-fit px-8"
          >
            Book a mobile visit
          </Link>
        </article>
      </div>
    </div>
  );
}
