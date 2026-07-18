"use client";

import { useRef } from "react";
import type { PainMarker } from "@/app/lib/intake-types";

/* Soft, brand-toned body silhouette drawn on a 200 × 470 grid. */
const OUTLINE = `M 100 10
C 112 10 121 20 121 34 C 121 43 118 52 113 58 C 112 63 112 68 114 72
C 124 76 138 82 148 88 C 158 94 163 102 165 114 C 167 126 168 142 168 158
C 168 174 170 190 172 204 C 174 218 175 232 174 244 C 174 254 172 264 169 271
C 166 277 159 278 155 274 C 152 270 153 263 154 257 C 156 250 155 240 153 230
C 151 220 149 208 147 196 C 145 184 143 172 142 162 C 141 172 141 184 142 196
C 143 210 144 224 144 238 C 144 254 142 270 139 284 C 136 298 134 312 134 326
C 134 340 135 354 136 366 C 137 380 136 394 133 406 C 131 414 130 422 130 430
C 130 438 135 442 139 446 C 142 450 141 456 134 458 C 127 460 114 459 110 455
C 108 452 108 446 109 440 C 110 430 111 418 110 404 C 109 386 108 370 108 353
C 108 339 107 325 105 313 C 104 305 102 297 100 291 C 98 297 96 305 95 313
C 93 325 92 339 92 353 C 92 370 91 386 90 404 C 89 418 90 430 91 440
C 92 446 92 452 90 455 C 86 459 73 460 66 458 C 59 456 58 450 61 446
C 65 442 70 438 70 430 C 70 422 69 414 67 406 C 64 394 63 380 64 366
C 65 354 66 340 66 326 C 66 312 64 298 61 284 C 58 270 56 254 56 238
C 56 224 57 210 58 196 C 59 184 59 172 58 162 C 57 172 55 184 53 196
C 51 208 49 220 47 230 C 45 240 46 250 46 257 C 47 263 48 270 45 274
C 41 278 34 277 31 271 C 28 264 26 254 26 244 C 25 232 26 218 28 204
C 30 190 32 174 32 158 C 32 142 33 126 35 114 C 37 102 42 94 52 88
C 62 82 76 76 86 72 C 88 68 88 63 87 58 C 82 52 79 43 79 34 C 79 20 88 10 100 10 Z`;

function FigureView({
  view,
  markers,
  onChange,
}: {
  view: "front" | "back";
  markers: PainMarker[];
  onChange: (markers: PainMarker[]) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  function handleTap(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onChange([...markers, { x, y }]);
  }

  return (
    <figure className="min-w-0 text-center">
      <div
        ref={boxRef}
        onPointerDown={handleTap}
        className="relative mx-auto w-full max-w-[190px] cursor-crosshair touch-none select-none"
        aria-label={`${view === "front" ? "Front" : "Back"} of body — tap to mark areas of discomfort`}
      >
        <svg viewBox="0 0 200 470" className="block h-auto w-full" aria-hidden="true">
          <path
            d={OUTLINE}
            fill="#efe5d9"
            stroke="#a87c5f"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {view === "front" ? (
            <g stroke="#a87c5f" fill="none" strokeLinecap="round" strokeWidth="1.5">
              <path d="M 84 92 C 90 96 96 97 100 97 C 104 97 110 96 116 92" opacity="0.4" />
              <path d="M 100 104 L 100 136" opacity="0.3" />
              <circle cx="100" cy="190" r="1.8" fill="#a87c5f" stroke="none" opacity="0.35" />
            </g>
          ) : (
            <g stroke="#a87c5f" fill="none" strokeLinecap="round" strokeWidth="1.5">
              <path d="M 100 80 L 100 208" opacity="0.32" />
              <path d="M 78 100 C 74 110 74 122 80 132" opacity="0.3" />
              <path d="M 122 100 C 126 110 126 122 120 132" opacity="0.3" />
            </g>
          )}
        </svg>
        {markers.map((m, i) => (
          <span
            key={i}
            className="pin-pop absolute -ml-[11px] -mt-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#b4462b] text-[11px] font-bold leading-none text-white shadow-md ring-2 ring-white"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <figcaption className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-bark-light">
        {view === "front" ? "Front" : "Back"}
      </figcaption>
      <div
        className={`mt-1.5 flex justify-center gap-4 text-xs transition-opacity ${
          markers.length ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => onChange(markers.slice(0, -1))}
          className="text-bark-light underline decoration-brand-light underline-offset-2 transition-colors hover:text-brand"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-bark-light underline decoration-brand-light underline-offset-2 transition-colors hover:text-brand"
        >
          Clear
        </button>
      </div>
    </figure>
  );
}

export default function BodyDiagram({
  front,
  back,
  onFrontChange,
  onBackChange,
}: {
  front: PainMarker[];
  back: PainMarker[];
  onFrontChange: (markers: PainMarker[]) => void;
  onBackChange: (markers: PainMarker[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-10">
      <FigureView view="front" markers={front} onChange={onFrontChange} />
      <FigureView view="back" markers={back} onChange={onBackChange} />
    </div>
  );
}
