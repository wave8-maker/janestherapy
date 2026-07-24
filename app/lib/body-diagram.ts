import type { PainMarker } from "./intake-types";

/**
 * The body silhouette, drawn on a 200 × 470 grid. Kept here, apart from the
 * interactive picker, so the read-only views Jane and an insurer see — the admin
 * detail page and the printed record — render the exact figure the client tapped
 * on, from one definition. Markers are stored as percentages of that box, so
 * this is the only place the outline and the pin geometry live.
 */
export const BODY_OUTLINE = `M 100 10
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

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * A read-only figure with the client's marks numbered on it, as an `<svg>`
 * string. A string rather than JSX so the admin (via dangerouslySetInnerHTML)
 * and the printed record (raw injection) produce the identical picture.
 */
export function bodyDiagramSvg(markers: PainMarker[], caption: string): string {
  const pins = markers
    .map((m, i) => {
      const cx = (m.x / 100) * 200;
      const cy = (m.y / 100) * 470;
      return `<g>
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="11" fill="#b4462b" stroke="#fff" stroke-width="2"></circle>
        <text x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="Helvetica, Arial, sans-serif">${i + 1}</text>
      </g>`;
    })
    .join("");

  return `<svg viewBox="0 0 200 490" width="150" role="img" aria-label="${esc(caption)}">
    <path d="${BODY_OUTLINE}" fill="#efe5d9" stroke="#a87c5f" stroke-opacity="0.55" stroke-width="2" stroke-linejoin="round"></path>
    ${pins}
    <text x="100" y="484" text-anchor="middle" font-size="15" font-weight="700" letter-spacing="1" fill="#6e5c4e" font-family="Helvetica, Arial, sans-serif">${esc(caption)}</text>
  </svg>`;
}

/** Whether there is anything to draw, so callers can skip the whole section. */
export function hasBodyMarkers(front: PainMarker[], back: PainMarker[]): boolean {
  return (front?.length ?? 0) > 0 || (back?.length ?? 0) > 0;
}
