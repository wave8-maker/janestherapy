// Server-only helper for the /availability page. Talks to the Square API with
// the account access token, so it must never be imported from client code.

export type DayState = "open" | "few" | "unavailable";

export interface AvailabilityDay {
  /** Calendar date in the business timezone, YYYY-MM-DD. */
  date: string;
  state: DayState;
}

export interface AvailabilitySummary {
  days: AvailabilityDay[];
  updatedAt: string;
  baselineDurationMinutes: number;
}

export const BUSINESS_TIMEZONE = "America/Los_Angeles";
export const WINDOW_DAYS = 28;

const businessDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toBusinessDate(isoTimestamp: string): string {
  return businessDateFormat.format(new Date(isoTimestamp));
}

/** Increment a YYYY-MM-DD calendar date; immune to DST because no timezone math is involved. */
export function nextDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function summarizeSlotsByDay(
  slotStartTimes: string[],
  startDate: string,
  dayCount: number
): AvailabilityDay[] {
  const counts = new Map<string, number>();
  for (const slot of slotStartTimes) {
    const day = toBusinessDate(slot);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const days: AvailabilityDay[] = [];
  let date = startDate;
  for (let i = 0; i < dayCount; i++) {
    const count = counts.get(date) ?? 0;
    days.push({ date, state: count === 0 ? "unavailable" : count <= 2 ? "few" : "open" });
    date = nextDate(date);
  }
  return days;
}
