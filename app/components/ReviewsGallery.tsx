"use client";

import Image from "next/image";
import { useState } from "react";

const reviews = ["revew 1.webp", "revew 2.webp", "revew 3.webp"];

export default function ReviewsGallery() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-6">
        {reviews.map((file, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="rounded-xl overflow-hidden border border-brand-light shadow-sm cursor-zoom-in hover:shadow-md transition-shadow"
          >
            <Image
              src={`/${file}`}
              alt={`Client review ${i + 1}`}
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={`/${reviews[active]}`}
              alt={`Client review ${active + 1}`}
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setActive(null)}
              className="absolute -top-3 -right-3 bg-white text-bark rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-brand-light transition-colors text-lg font-bold"
            >
              ×
            </button>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setActive((active - 1 + reviews.length) % reviews.length)}
                className="bg-white/20 text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setActive((active + 1) % reviews.length)}
                className="bg-white/20 text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
