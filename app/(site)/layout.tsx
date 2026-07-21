import Image from "next/image";
import Link from "next/link";
import MobileNav from "@/app/components/MobileNav";
import JsonLd from "@/app/components/JsonLd";
import { SITE_TAGLINE, localBusinessJsonLd } from "@/app/lib/seo";

/**
 * Site chrome for the public marketing pages.
 *
 * It lives in this route group rather than the root layout so the intake
 * wizard has no navigation at all: on the studio tablet a "Book Now" link
 * would open Square in a new tab and let a client out of the kiosk.
 */

const BOOKING_URL =
  "https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/availability", label: "Availability" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={localBusinessJsonLd()} />

      <header className="bg-cream/85 backdrop-blur-md border-b border-brand-light sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Jane's Therapy logo"
              width={44}
              height={44}
              className="rounded-full ring-1 ring-brand-light transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl font-semibold text-bark tracking-tight">
                Jane&apos;s Therapy
              </span>
              <span className="text-[0.68rem] text-brand uppercase tracking-[0.18em]">
                San Jose · Bay Area
              </span>
            </div>
          </Link>
          <nav className="hidden sm:flex gap-8 text-sm text-bark-light">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="link-underline hover:text-brand transition-colors py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary text-sm px-5 py-2.5"
            >
              <span className="sm:hidden">Book</span>
              <span className="hidden sm:inline">Book Now</span>
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="relative bg-bark text-white mt-24 overflow-hidden">
        <div className="absolute inset-0 bg-warm-glow opacity-[0.18]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10">
          <div className="grid sm:grid-cols-3 gap-10 text-sm">
            <div>
              <p className="font-display text-2xl mb-3">Jane&apos;s Therapy</p>
              <p className="text-white/60 leading-relaxed max-w-xs">
                {SITE_TAGLINE}. Every session is one-on-one with Jane Zhang, CMT.
              </p>
            </div>
            <div>
              <p className="eyebrow text-white/50 mb-4">Contact</p>
              <a
                href="mailto:janezhang.therapist@gmail.com"
                className="text-white/80 hover:text-brand-light transition-colors block"
              >
                janezhang.therapist@gmail.com
              </a>
              <a
                href="sms:6692924472"
                className="text-white/80 hover:text-brand-light transition-colors block mt-2"
              >
                669-292-4472 (text only)
              </a>
            </div>
            <div>
              <p className="eyebrow text-white/50 mb-4">Visit</p>
              <nav className="flex flex-col gap-2">
                <Link href="/services" className="text-white/80 hover:text-brand-light transition-colors">
                  Services &amp; Pricing
                </Link>
                <Link href="/availability" className="text-white/80 hover:text-brand-light transition-colors">
                  Hours &amp; Availability
                </Link>
                <Link href="/contact" className="text-white/80 hover:text-brand-light transition-colors">
                  Contact &amp; Location
                </Link>
                <Link href="/#reviews" className="text-white/80 hover:text-brand-light transition-colors">
                  Client Reviews
                </Link>
                <Link href="/intake" className="text-white/80 hover:text-brand-light transition-colors">
                  New Client Intake
                </Link>
              </nav>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/45 text-xs">
            <p>© {new Date().getFullYear()} Jane&apos;s Therapy. All rights reserved.</p>
            <p>San Jose, California</p>
          </div>
        </div>
      </footer>
    </>
  );
}
