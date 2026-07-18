# Read-Only Availability Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/availability` page showing a 4-week, day-level heatmap of Jane's real Square Appointments availability, with a "for reference only" disclaimer and a Book Now button linking to the Square-hosted booking page.

**Architecture:** One self-contained server-side library (`app/lib/square-availability.ts`) fetches Square Catalog + Bookings availability with plain `fetch` and reduces slots to per-day states. A server-component page renders the grid and is cached via ISR (`export const revalidate = 1800`). No client JS, no API route, no new dependencies.

**Tech Stack:** Next.js 16.2.6 (custom fork — see constraints), React 19 server components, Tailwind v4 tokens from `app/globals.css`, Node 22 `node:assert` test scripts (repo convention), Square REST API (Catalog `ListCatalog`, Bookings `SearchAvailability`).

**Spec:** `docs/superpowers/specs/2026-07-18-availability-calendar-design.md`

## Global Constraints

- **Custom Next.js fork** (`AGENTS.md`): consult `node_modules/next/dist/docs/` before deviating from this plan. Relevant, already-verified facts: route/page conventions match upstream App Router; `use cache` requires `cacheComponents: true` which this repo does NOT enable — use `export const revalidate = 1800` (documented in `03-file-conventions/route.md` and route-segment-config) for caching; pages are statically prerendered + ISR'd by default (plain `fetch` calls do not opt out).
- **Never show fabricated availability in production**: mock data only when `SQUARE_MOCK === "1"` AND `NODE_ENV !== "production"`. Missing config or Square errors → page renders without a calendar (never an error state, never fake data).
- Env vars (server-only, never sent to client): `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENV` (`"production"` | anything else → sandbox), `SQUARE_MOCK` (dev only).
- Business timezone is `America/Los_Angeles`; all day-bucketing happens in that zone.
- Day states: 0 slots → `unavailable`, 1–2 → `few`, 3+ → `open`. Window: 28 days starting today.
- Site copy is **English**. Palette/idioms come from `app/globals.css` tokens (`sage`, `sand`, `bark`, `cream`, `brand-light`, `.eyebrow`, `.btn .btn-primary`); states must be distinguishable without color (glyph/pattern + color).
- Tests are plain Node scripts using `node:assert` (see `tests/admin-ui.test.js`), run directly with `node`. Node 22.22 strips TS types natively, so tests import the `.ts` lib directly (the lib must use only erasable TS syntax — no enums — and must not import other project files).
- Commit after each task with the repo's plain-English commit style, ending with the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.

---

### Task 1: Day-reduction logic in `app/lib/square-availability.ts`

**Files:**
- Create: `app/lib/square-availability.ts`
- Test: `tests/availability.test.mjs`

**Interfaces:**
- Consumes: nothing (pure functions, no imports).
- Produces (used by Tasks 2–3):
  - `type DayState = "open" | "few" | "unavailable"`
  - `interface AvailabilityDay { date: string; state: DayState }` (`date` = `YYYY-MM-DD` in LA time)
  - `interface AvailabilitySummary { days: AvailabilityDay[]; updatedAt: string; baselineDurationMinutes: number }`
  - `const BUSINESS_TIMEZONE = "America/Los_Angeles"`, `const WINDOW_DAYS = 28`
  - `toBusinessDate(isoTimestamp: string): string`
  - `nextDate(date: string): string` (calendar-date increment, DST-proof)
  - `summarizeSlotsByDay(slotStartTimes: string[], startDate: string, dayCount: number): AvailabilityDay[]`

- [ ] **Step 1: Write the failing test**

Create `tests/availability.test.mjs`:

```js
import assert from "node:assert";

const lib = await import("../app/lib/square-availability.ts");
const { toBusinessDate, nextDate, summarizeSlotsByDay } = lib;

// --- toBusinessDate: UTC instants bucket to Los Angeles calendar days ---
assert.equal(toBusinessDate("2026-07-20T17:00:00Z"), "2026-07-20"); // 10:00 PDT
assert.equal(toBusinessDate("2026-07-21T05:30:00Z"), "2026-07-20"); // 22:30 PDT previous day

// --- nextDate: calendar increment across month/year boundaries ---
assert.equal(nextDate("2026-07-31"), "2026-08-01");
assert.equal(nextDate("2026-12-31"), "2027-01-01");

// --- summarizeSlotsByDay: counts → states, every day present ---
const slots = [
  "2026-07-20T17:00:00Z", // 3 slots on 2026-07-20 → open
  "2026-07-20T18:30:00Z",
  "2026-07-21T04:00:00Z", // 21:00 PDT, still 2026-07-20
  "2026-07-21T17:00:00Z", // 1 slot on 2026-07-21 → few
];
const days = summarizeSlotsByDay(slots, "2026-07-20", 3);
assert.deepEqual(days, [
  { date: "2026-07-20", state: "open" },
  { date: "2026-07-21", state: "few" },
  { date: "2026-07-22", state: "unavailable" },
]);

console.log("availability tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/availability.test.mjs`
Expected: FAIL — `Cannot find module .../app/lib/square-availability.ts`

- [ ] **Step 3: Write minimal implementation**

Create `app/lib/square-availability.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/availability.test.mjs`
Expected: `availability tests passed`, exit 0

- [ ] **Step 5: Commit**

```bash
git add app/lib/square-availability.ts tests/availability.test.mjs
git commit -m "Add day-level availability reduction for the calendar page"
```

---

### Task 2: Square fetch orchestration `getAvailabilitySummary`

**Files:**
- Modify: `app/lib/square-availability.ts` (append)
- Test: `tests/availability.test.mjs` (append)

**Interfaces:**
- Consumes (Task 1): `summarizeSlotsByDay`, `toBusinessDate`, `nextDate`, `WINDOW_DAYS`, types.
- Produces (used by Task 3):
  - `getAvailabilitySummary(fetchImpl?: typeof fetch, now?: Date): Promise<AvailabilitySummary | null>` — `null` means "render the page without a calendar". Defaults: global `fetch`, `new Date()`. The parameters exist for tests only.

- [ ] **Step 1: Write the failing tests**

Append to `tests/availability.test.mjs` (before the final `console.log`):

```js
const { getAvailabilitySummary, WINDOW_DAYS } = lib;

// --- missing config → null ---
delete process.env.SQUARE_ACCESS_TOKEN;
delete process.env.SQUARE_LOCATION_ID;
delete process.env.SQUARE_MOCK;
assert.equal(await getAvailabilitySummary(), null);

// --- happy path with a fake Square API ---
process.env.SQUARE_ACCESS_TOKEN = "test-token";
process.env.SQUARE_LOCATION_ID = "LTEST";

const now = new Date("2026-07-20T16:00:00Z"); // 09:00 PDT
const catalogResponse = {
  objects: [
    {
      type: "ITEM",
      item_data: {
        product_type: "APPOINTMENTS_SERVICE",
        variations: [
          { id: "VAR60", item_variation_data: { service_duration: 3_600_000 } },
          { id: "VAR90", item_variation_data: { service_duration: 5_400_000 } },
        ],
      },
    },
    { type: "ITEM", item_data: { product_type: "REGULAR", variations: [] } },
  ],
};
const availabilityResponse = {
  availabilities: [
    { start_at: "2026-07-20T17:00:00Z" },
    { start_at: "2026-07-20T18:30:00Z" },
    { start_at: "2026-07-20T20:00:00Z" },
    { start_at: "2026-07-21T17:00:00Z" },
  ],
};
const requests = [];
const fakeFetch = async (url, init) => {
  requests.push({ url: String(url), init });
  const body = String(url).includes("/v2/catalog/list") ? catalogResponse : availabilityResponse;
  return new Response(JSON.stringify(body), { status: 200 });
};

const summary = await getAvailabilitySummary(fakeFetch, now);
assert.equal(summary.baselineDurationMinutes, 60);
assert.equal(summary.days.length, WINDOW_DAYS);
assert.deepEqual(summary.days[0], { date: "2026-07-20", state: "open" });
assert.deepEqual(summary.days[1], { date: "2026-07-21", state: "few" });
assert.equal(summary.days[2].state, "unavailable");
assert.equal(summary.updatedAt, now.toISOString());

// sandbox base URL by default; auth header present; VAR60 chosen (closest to 60 min)
assert.match(requests[0].url, /^https:\/\/connect\.squareupsandbox\.com\/v2\/catalog\/list/);
const searchCalls = requests.filter((r) => r.url.includes("/v2/bookings/availability/search"));
assert.equal(searchCalls.length, 2); // two ~14-day windows
assert.equal(searchCalls[0].init.headers.Authorization, "Bearer test-token");
assert.match(searchCalls[0].init.body, /"service_variation_id":"VAR60"/);
assert.match(searchCalls[0].init.body, /"location_id":"LTEST"/);

// --- Square failure → null, not a throw ---
const failingFetch = async () => new Response("{}", { status: 500 });
assert.equal(await getAvailabilitySummary(failingFetch, now), null);

// --- mock mode (non-production only) ---
process.env.SQUARE_MOCK = "1";
const mock = await getAvailabilitySummary(failingFetch, now);
assert.equal(mock.days.length, WINDOW_DAYS);
assert.equal(mock.days[0].date, "2026-07-20");
delete process.env.SQUARE_MOCK;
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests/availability.test.mjs`
Expected: FAIL — `getAvailabilitySummary is not a function`

- [ ] **Step 3: Write the implementation**

Append to `app/lib/square-availability.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/availability.test.mjs`
Expected: `availability tests passed`, exit 0

- [ ] **Step 5: Commit**

```bash
git add app/lib/square-availability.ts tests/availability.test.mjs
git commit -m "Fetch and summarize Square availability for the calendar page"
```

---

### Task 3: `/availability` page, nav links, sitemap, docs

**Files:**
- Create: `app/availability/page.tsx`
- Modify: `app/layout.tsx:73-79` (navLinks array)
- Modify: `app/components/MobileNav.tsx:6-10` (links array)
- Modify: `app/sitemap.ts:6-12` (staticRoutes array)
- Modify: `README.md` (append env-var section)
- Test: `tests/availability.test.mjs` (append source assertions)

**Interfaces:**
- Consumes (Tasks 1–2): `getAvailabilitySummary()`, `BUSINESS_TIMEZONE`, `AvailabilityDay`, `DayState`; `getServiceModes()` from `app/lib/content.ts` (returns `{ bookingUrl: string, ... }`).
- Produces: the public page; no downstream consumers.

- [ ] **Step 1: Write the failing source assertions**

Append to `tests/availability.test.mjs` (before the final `console.log`):

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

const availabilityPage = read("app/availability/page.tsx");
assert.match(availabilityPage, /export const revalidate = 1800/, "page should ISR every 30 minutes");
assert.match(availabilityPage, /getAvailabilitySummary\(\)/, "page should load the summary server-side");
assert.match(availabilityPage, /approximate/i, "page should carry the for-reference disclaimer");
assert.match(availabilityPage, /getServiceModes\(\)/, "Book button should reuse the Square booking URL from content");
assert.match(availabilityPage, /aria-label/, "day cells should be readable by screen readers");
assert.doesNotMatch(availabilityPage, /"use client"/, "page must stay a server component (token safety)");

assert.match(read("app/layout.tsx"), /\/availability/, "desktop nav should link to the page");
assert.match(read("app/components/MobileNav.tsx"), /\/availability/, "mobile nav should link to the page");
assert.match(read("app/sitemap.ts"), /\/availability/, "sitemap should include the page");
```

Note: `import` statements must sit at the top of the file with the existing imports; only the assertions go before the final `console.log`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests/availability.test.mjs`
Expected: FAIL — `ENOENT ... app/availability/page.tsx`

- [ ] **Step 3: Create the page**

Create `app/availability/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAvailabilitySummary,
  BUSINESS_TIMEZONE,
  type AvailabilityDay,
  type DayState,
} from "../lib/square-availability";
import { getServiceModes } from "../lib/content";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Availability",
  description:
    "An at-a-glance look at Jane's approximate openings over the next four weeks. For exact times, use the booking page.",
  alternates: { canonical: "/availability" },
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATE_STYLES: Record<DayState, { cell: string; label: string; glyph: string }> = {
  open: { cell: "bg-sage/15 ring-1 ring-sage/40 text-sage-dark", label: "openings", glyph: "●" },
  few: { cell: "bg-sage/5 ring-1 ring-sage/25 text-sage-dark", label: "a few openings left", glyph: "◐" },
  unavailable: { cell: "bg-brand-light/40 text-bark-light/50", label: "unavailable", glyph: "" },
};

function weekdayIndex(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function dayOfMonth(date: string): number {
  return Number(date.slice(8, 10));
}

function monthLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CalendarGrid({ days }: { days: AvailabilityDay[] }) {
  const leadingBlanks = weekdayIndex(days[0].date);
  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs uppercase tracking-widest text-bark-light">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden="true" />
        ))}
        {days.map((day) => {
          const style = STATE_STYLES[day.state];
          const showMonth = day === days[0] || dayOfMonth(day.date) === 1;
          return (
            <div
              key={day.date}
              aria-label={`${day.date}: ${style.label}`}
              className={`rounded-lg py-2.5 flex flex-col items-center gap-0.5 text-sm ${style.cell}`}
            >
              <span className="font-medium">
                {showMonth ? `${monthLabel(day.date)} ` : ""}
                {dayOfMonth(day.date)}
              </span>
              <span aria-hidden="true" className="text-[0.55rem] leading-none min-h-[0.55rem]">
                {style.glyph}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-xs text-bark-light">
        <span><span aria-hidden="true" className="text-sage-dark">●</span> Openings</span>
        <span><span aria-hidden="true" className="text-sage-dark">◐</span> A few left</span>
        <span><span aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-light align-middle" /> Unavailable</span>
      </div>
    </div>
  );
}

export default async function AvailabilityPage() {
  const summary = await getAvailabilitySummary();
  const { bookingUrl } = getServiceModes();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="eyebrow mb-3">Plan your visit</p>
      <h1 className="font-display text-4xl text-bark mb-4">Jane&apos;s availability</h1>
      <p className="text-bark-light leading-relaxed mb-8 max-w-prose">
        A rough look at the next four weeks — approximate only. Exact times, services, and
        booking live on the booking page.
      </p>

      {summary ? (
        <>
          <CalendarGrid days={summary.days} />
          <p className="text-xs text-bark-light mt-4">
            Based on {summary.baselineDurationMinutes}-minute sessions · Updated{" "}
            {formatUpdatedAt(summary.updatedAt)} · Approximate — see the booking page for
            exact times.
          </p>
        </>
      ) : (
        <p className="text-bark-light bg-brand-light/40 rounded-lg px-5 py-4">
          The live calendar is taking a break right now — the booking page below always has
          Jane&apos;s exact openings.
        </p>
      )}

      <div className="mt-10">
        <Link
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add nav links and sitemap entry**

In `app/layout.tsx`, extend the `navLinks` array (line 73):

```tsx
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/availability", label: "Availability" },
  { href: "/about", label: "About" },
  { href: "/location", label: "Location" },
  { href: "/blog", label: "Blog" },
];
```

In `app/components/MobileNav.tsx`, make the identical addition to the links array at lines 6–10 (insert `{ href: "/availability", label: "Availability" },` after the Services entry).

In `app/sitemap.ts`, add to `staticRoutes` after the `/services` entry:

```ts
{ url: `${SITE_URL}/availability`, changeFrequency: "daily", priority: 0.8 },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node tests/availability.test.mjs && node tests/admin-ui.test.js`
Expected: `availability tests passed`, both exit 0

- [ ] **Step 6: Verify the page end to end (mock mode)**

Run: `SQUARE_MOCK=1 npm run dev`, open `http://localhost:3000/availability`.
Expected: calendar grid with the repeating open/few/unavailable pattern, legend, disclaimer line, Book Now button pointing at the Square page; nav shows "Availability" on desktop and in the mobile menu.

Then stop dev, run: `npm run build`
Expected: build succeeds; `/availability` listed as ISR/static output. (Without env vars, the prerendered page shows the fallback text — correct.)

- [ ] **Step 7: Document env vars for Vercel/local**

Append to `README.md`:

```markdown
## Square availability calendar

`/availability` shows a read-only, day-level heatmap of the Square Appointments
calendar (next 4 weeks), regenerated every 30 minutes. Configuration
(server-side env vars, in Vercel and `.env.local`):

- `SQUARE_ACCESS_TOKEN` — access token from a Square Developer application
  (developer.squareup.com → your app → Credentials → Production Access Token)
- `SQUARE_LOCATION_ID` — `L148MHX709ZSA`
- `SQUARE_ENV` — `production` (anything else targets the Square sandbox)
- `SQUARE_MOCK=1` — local development only: renders fake data without credentials

Unset/invalid credentials degrade gracefully: the page hides the calendar and
keeps the Book Now button.
```

- [ ] **Step 8: Commit**

```bash
git add app/availability/page.tsx app/layout.tsx app/components/MobileNav.tsx app/sitemap.ts README.md tests/availability.test.mjs
git commit -m "Add read-only availability calendar page fed by Square"
```
