"use client";

import { useState } from "react";
import type { ReviewsContent, Review } from "../lib/content";

const CLAMP_CHARS = 320;

function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`${size} ${i < rating ? "fill-brand" : "fill-brand-light"}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.47 5.34 5.84.63-4.35 3.96 1.18 5.76L10 14.27l-5.14 2.92 1.18-5.76L1.69 7.47l5.84-.63L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

/** Google's four-color "G" mark. */
function GoogleGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.97 11.97 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

/** Yelp-red burst — five rounded rays radiating from center. */
function YelpGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g fill="#e00707">
        {[0, 72, 144, 216, 288].map((deg) => (
          <rect
            key={deg}
            x="10.8"
            y="2.5"
            width="2.4"
            height="9"
            rx="1.2"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="2.4" />
      </g>
    </svg>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > CLAMP_CHARS;
  const shown =
    isLong && !expanded ? review.text.slice(0, CLAMP_CHARS).trimEnd() + "…" : review.text;

  return (
    <figure className="card-soft p-7 flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        <span className="text-[0.65rem] uppercase tracking-wider text-bark-light/70">
          {review.source} · {review.date}
        </span>
      </div>
      <blockquote className="mt-4 text-sm text-bark-light leading-relaxed flex-1 whitespace-pre-line">
        {shown}
      </blockquote>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 self-start text-xs text-brand underline underline-offset-2 hover:opacity-80"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <figcaption className="mt-5 pt-4 border-t border-brand-light">
        <span className="font-display text-bark">{review.name}</span>
        <span className="text-xs text-bark-light ml-2">{review.location}</span>
      </figcaption>
    </figure>
  );
}

export default function ReviewsSection({ content }: { content: ReviewsContent }) {
  const { items, googleReviewUrl, yelpPageUrl } = content;

  const platforms = [
    {
      key: "google",
      anchor: "google-reviews",
      label: "On Google",
      glyph: <GoogleGlyph className="h-6 w-6" />,
      pillGlyph: <GoogleGlyph className="h-4 w-4" />,
      reviews: items.filter((r) => r.source.toLowerCase() === "google"),
      linkUrl: googleReviewUrl,
      linkLabel: "Write a review",
      emptyNote: "Google reviews are on their way — check back soon.",
    },
    {
      key: "yelp",
      anchor: "yelp-reviews",
      label: "On Yelp",
      glyph: <YelpGlyph className="h-6 w-6" />,
      pillGlyph: <YelpGlyph className="h-4 w-4" />,
      reviews: items.filter((r) => r.source.toLowerCase() === "yelp"),
      linkUrl: yelpPageUrl,
      linkLabel: "Read all on Yelp",
      emptyNote: "Yelp reviews are on their way — check back soon.",
    },
  ];

  const avg = items.length
    ? Math.round((items.reduce((s, r) => s + r.rating, 0) / items.length) * 10) / 10
    : 0;

  return (
    <>
      {/* Aggregate strip with anchor jump pills */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-x-10 gap-y-6 mb-16">
        <div className="flex items-center gap-4">
          <span className="font-display text-6xl leading-none text-bark">
            {avg.toFixed(1)}
          </span>
          <div>
            <Stars rating={Math.round(avg)} size="h-5 w-5" />
            <p className="text-xs text-bark-light mt-1.5">
              across {items.length} client review{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="h-px w-16 sm:h-12 sm:w-px bg-brand/25" aria-hidden="true" />
        <nav className="flex flex-wrap justify-center gap-3" aria-label="Jump to reviews by platform">
          {platforms.map((p) => (
            <a
              key={p.key}
              href={`#${p.anchor}`}
              className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-white/70 px-4 py-2 text-sm text-bark-light hover:border-brand hover:text-bark transition-colors"
            >
              {p.pillGlyph}
              {p.label.replace("On ", "")}
              <span className="text-bark-light/50">{p.reviews.length}</span>
              <span aria-hidden="true" className="text-brand">↓</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Platform groups — each heading is an anchor target */}
      <div className="space-y-16">
        {platforms.map((p) => (
          <section key={p.key} id={p.anchor} className="scroll-mt-28" aria-label={`${p.label.replace("On ", "")} reviews`}>
            <header className="flex flex-wrap items-end justify-between gap-4 pb-4 mb-7 border-b border-bark/10">
              <a href={`#${p.anchor}`} className="group flex items-center gap-3.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-brand-light shadow-sm">
                  {p.glyph}
                </span>
                <span>
                  <h3 className="font-display text-2xl text-bark group-hover:text-brand-dark transition-colors">
                    {p.label}
                    <span
                      aria-hidden="true"
                      className="ml-2 text-brand/0 group-hover:text-brand/60 transition-colors text-lg"
                    >
                      #
                    </span>
                  </h3>
                  {p.reviews.length > 0 && (
                    <span className="mt-1 flex items-center gap-2 text-xs text-bark-light">
                      <Stars
                        rating={Math.round(
                          p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length,
                        )}
                        size="h-3.5 w-3.5"
                      />
                      {p.reviews.length} review{p.reviews.length === 1 ? "" : "s"}
                    </span>
                  )}
                </span>
              </a>
              {p.linkUrl && (
                <a
                  href={p.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-sm px-5 py-2"
                >
                  {p.linkLabel} ↗
                </a>
              )}
            </header>

            {p.reviews.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {p.reviews.map((r) => (
                  <ReviewCard key={`${r.name}-${r.date}`} review={r} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-brand/35 px-8 py-10 text-center text-sm text-bark-light">
                {p.emptyNote}
              </div>
            )}
          </section>
        ))}
      </div>

      {(googleReviewUrl || yelpPageUrl) && (
        <div className="mt-16 text-center">
          <p className="text-sm text-bark-light mb-5">
            Had a great session? Your review helps others find Jane.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {googleReviewUrl && (
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Review us on Google
              </a>
            )}
            {yelpPageUrl && (
              <a
                href={yelpPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Review us on Yelp
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
