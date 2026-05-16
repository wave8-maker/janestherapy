import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MobileNav from "./components/MobileNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jane's Therapy – Massage Therapist in Palo Alto",
  description:
    "Your Trusted Solo Therapist in Bay Area. Specializing in deep tissue, Swedish, lymphatic drainage, and more.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/location", label: "Location" },
  { href: "/blog", label: "Blog" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <header className="bg-white border-b border-brand-light sticky top-0 z-50 relative">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Jane's Therapy logo"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-semibold text-bark tracking-wide">
                  Jane&apos;s Therapy
                </span>
                <span className="text-xs text-brand italic">
                  Your Trusted Solo Therapist in Bay Area
                </span>
              </div>
            </Link>
            <nav className="hidden sm:flex gap-6 text-sm text-bark-light">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-brand transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <MobileNav />
              <Link
                href="https://book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sage text-white text-sm px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Book Now
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-bark text-white py-10 mt-16">
          <div className="max-w-5xl mx-auto px-6 grid sm:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="font-semibold text-base mb-2">Jane&apos;s Therapy</p>
              <p className="text-white/70 italic">
                Your Trusted Solo Therapist in Bay Area
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">Contact</p>
              <p className="text-white/80">
                📧{" "}
                <a
                  href="mailto:janezhang.therapist@gmail.com"
                  className="hover:text-brand-light transition-colors"
                >
                  janezhang.therapist@gmail.com
                </a>
              </p>
              <p className="text-white/80 mt-1">📱 669-292-4472 (text only)</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Hours</p>
              <p className="text-white/80">Mon, Tue, Thu–Sun</p>
              <p className="text-white/80">9:30 AM – 8:30 PM</p>
              <p className="text-white/80 mt-1">Wednesday: Closed</p>
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-6 mt-8 pt-6 border-t border-white/20 text-center text-white/50 text-xs">
            © {new Date().getFullYear()} Jane&apos;s Therapy. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
