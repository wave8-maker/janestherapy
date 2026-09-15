/**
 * How an image's size and alignment survive the trip out of the editor.
 *
 * A post is stored as the HTML the editor produced, so the only place a resized
 * image can remember its width is its own `style` attribute. These read and
 * write that one string, and are plain functions so the maths behind a drag can
 * be tested without a browser.
 */

export type ImageAlign = "left" | "center" | "right" | null;

/** Narrowest an image may be dragged — below this there is nothing left to grab. */
export const MIN_WIDTH_PERCENT = 10;

const MARGINS: Record<Exclude<ImageAlign, null>, [string, string]> = {
  left: ["0", "auto"],
  center: ["auto", "auto"],
  right: ["auto", "0"],
};

/** The inline style a sized or aligned image carries, or null when it is neither. */
export function imageStyle(width: string | null, align: ImageAlign): string | null {
  const parts: string[] = [];
  if (width) parts.push(`width:${width}`);
  if (align) {
    const [left, right] = MARGINS[align];
    parts.push(`margin-left:${left}`, `margin-right:${right}`);
  }
  return parts.length ? parts.join(";") : null;
}

/** Splits a style attribute into the properties it sets. */
function declarations(style: string | null | undefined): Record<string, string> {
  const found: Record<string, string> = {};
  for (const part of (style ?? "").split(";")) {
    const at = part.indexOf(":");
    if (at === -1) continue;
    found[part.slice(0, at).trim().toLowerCase()] = part.slice(at + 1).trim().toLowerCase();
  }
  return found;
}

/**
 * The width the slider and the drag handle work in — percentages only. A pixel
 * width pasted in from somewhere else still renders; it just isn't a value this
 * UI can put back on a slider, so it reads as unset.
 */
export function parseImageWidth(style: string | null | undefined): string | null {
  const width = declarations(style).width;
  return width && /^\d+(\.\d+)?%$/.test(width) ? width : null;
}

/** The alignment implied by the image's margins. */
export function parseImageAlign(style: string | null | undefined): ImageAlign {
  const found = declarations(style);
  const left = found["margin-left"];
  const right = found["margin-right"];
  for (const align of ["left", "center", "right"] as const) {
    const [wantLeft, wantRight] = MARGINS[align];
    if (left === wantLeft && right === wantRight) return align;
  }
  return null;
}

/**
 * The width a drag lands on, as a whole percentage of the editor's text column.
 * Dragging past either end stops rather than inverting or overflowing.
 */
export function widthPercent(pxWidth: number, containerPx: number): number {
  if (!(containerPx > 0)) return 100;
  const percent = Math.round((pxWidth / containerPx) * 100);
  return Math.min(100, Math.max(MIN_WIDTH_PERCENT, percent));
}
