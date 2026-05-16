"use client";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/location", label: "Location" },
  { href: "/blog", label: "Blog" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="sm:hidden p-2 rounded-md text-bark hover:bg-brand-light transition-colors"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Dropdown — mobile only */}
      {open && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-brand-light shadow-md z-40">
          <nav className="flex flex-col px-6 py-3 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm text-bark-light hover:text-brand border-b border-brand-light/40 last:border-0 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
