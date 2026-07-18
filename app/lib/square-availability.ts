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

interface SquareConfig {
  accessToken: string;
  locationId: string;
  baseUrl: string;
}

function getConfig(): SquareConfig | null {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!accessToken || !locationId) return null;
  const baseUrl =
    process.env.SQUARE_ENV === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";
  return { accessToken, locationId, baseUrl };
}

async function squareFetch(
  config: SquareConfig,
  fetchImpl: typeof fetch,
  path: string,
  init?: { method?: string; body?: string }
): Promise<Record<string, unknown>> {
  const res = await fetchImpl(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Square ${path} returned ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

interface BaselineVariation {
  id: string;
  durationMinutes: number;
}

/** Pick the bookable service variation closest to 60 minutes as the availability baseline. */
async function findBaselineVariation(
  config: SquareConfig,
  fetchImpl: typeof fetch
): Promise<BaselineVariation | null> {
  const variations: BaselineVariation[] = [];
  let cursor: string | undefined;
  do {
    const suffix = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
    const data = (await squareFetch(config, fetchImpl, `/v2/catalog/list?types=ITEM${suffix}`)) as {
      objects?: Array<{
        type: string;
        item_data?: {
          product_type?: string;
          variations?: Array<{ id: string; item_variation_data?: { service_duration?: number } }>;
        };
      }>;
      cursor?: string;
    };
    for (const obj of data.objects ?? []) {
      if (obj.type !== "ITEM" || obj.item_data?.product_type !== "APPOINTMENTS_SERVICE") continue;
      for (const variation of obj.item_data.variations ?? []) {
        const durationMs = variation.item_variation_data?.service_duration;
        if (typeof durationMs === "number") {
          variations.push({ id: variation.id, durationMinutes: Math.round(durationMs / 60_000) });
        }
      }
    }
    cursor = data.cursor;
  } while (cursor);

  variations.sort(
    (a, b) => Math.abs(a.durationMinutes - 60) - Math.abs(b.durationMinutes - 60)
  );
  return variations[0] ?? null;
}

async function searchSlots(
  config: SquareConfig,
  fetchImpl: typeof fetch,
  serviceVariationId: string,
  startAt: Date,
  endAt: Date
): Promise<string[]> {
  const data = (await squareFetch(config, fetchImpl, "/v2/bookings/availability/search", {
    method: "POST",
    body: JSON.stringify({
      query: {
        filter: {
          start_at_range: { start_at: startAt.toISOString(), end_at: endAt.toISOString() },
          location_id: config.locationId,
          segment_filters: [{ service_variation_id: serviceVariationId }],
        },
      },
    }),
  })) as { availabilities?: Array<{ start_at: string }> };
  return (data.availabilities ?? []).map((a) => a.start_at);
}

const DAY_MS = 86_400_000;

function mockSummary(now: Date): AvailabilitySummary {
  const pattern: DayState[] = ["open", "open", "few", "unavailable", "open", "few", "open"];
  const days: AvailabilityDay[] = [];
  let date = toBusinessDate(now.toISOString());
  for (let i = 0; i < WINDOW_DAYS; i++) {
    days.push({ date, state: pattern[i % pattern.length] });
    date = nextDate(date);
  }
  return { days, updatedAt: now.toISOString(), baselineDurationMinutes: 60 };
}

/**
 * Availability for the next 28 days, or null when unconfigured or Square is
 * unreachable — the page then renders without a calendar. Never throws.
 */
export async function getAvailabilitySummary(
  fetchImpl: typeof fetch = fetch,
  now: Date = new Date()
): Promise<AvailabilitySummary | null> {
  if (process.env.SQUARE_MOCK === "1" && process.env.NODE_ENV !== "production") {
    return mockSummary(now);
  }
  const config = getConfig();
  if (!config) return null;
  try {
    const baseline = await findBaselineVariation(config, fetchImpl);
    if (!baseline) return null;
    // SearchAvailability caps the query range (~31 days), so split 28 days in two.
    const mid = new Date(now.getTime() + 14 * DAY_MS);
    const end = new Date(now.getTime() + WINDOW_DAYS * DAY_MS);
    const [firstHalf, secondHalf] = await Promise.all([
      searchSlots(config, fetchImpl, baseline.id, now, mid),
      searchSlots(config, fetchImpl, baseline.id, mid, end),
    ]);
    return {
      days: summarizeSlotsByDay(
        [...firstHalf, ...secondHalf],
        toBusinessDate(now.toISOString()),
        WINDOW_DAYS
      ),
      updatedAt: now.toISOString(),
      baselineDurationMinutes: baseline.durationMinutes,
    };
  } catch (error) {
    console.error("Availability summary failed:", error);
    return null;
  }
}
