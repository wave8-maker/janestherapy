"use client";

import { useState } from "react";
import type { ReviewsContent, Review } from "../lib/content";

const CLAMP_CHARS = 320;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${i < rating ? "fill-brand" : "fill-brand-light"}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.47 5.34 5.84.63-4.35 3.96 1.18 5.76L10 14.27l-5.14 2.92 1.18-5.76L1.69 7.47l5.84-.63L10 1.5z" />
        </svg>
      ))}
    </div>
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

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {items.map((r) => (
          <ReviewCard key={`${r.name}-${r.date}`} review={r} />
        ))}
      </div>

      {(googleReviewUrl || yelpPageUrl) && (
        <div className="mt-12 text-center">
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
                Read all reviews on Yelp
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
