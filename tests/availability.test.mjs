import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

// --- page, nav, and sitemap source assertions (repo convention) ---
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

const availabilityPage = read("app/availability/page.tsx");
assert.match(availabilityPage, /export const revalidate = 1800/, "page should ISR every 30 minutes");
assert.match(availabilityPage, /getAvailabilitySummary\(\)/, "page should load the summary server-side");
assert.match(availabilityPage, /approximate/i, "page should carry the for-reference disclaimer");
assert.match(availabilityPage, /getServiceModes\(\)/, "Book button should reuse the Square booking URL from content");
assert.match(availabilityPage, /aria-label/, "day cells should be readable by screen readers");
assert.doesNotMatch(availabilityPage, /"use client"/, "page must stay a server component (token safety)");

assert.match(availabilityPage, /Regular hours/, "availability page should show the weekly hours table");
assert.match(availabilityPage, /getSiteConfig\(\)/, "hours table should come from siteConfig");

assert.match(read("app/layout.tsx"), /\/availability/, "desktop nav should link to the page");
assert.match(read("app/components/MobileNav.tsx"), /\/availability/, "mobile nav should link to the page");
assert.match(read("app/sitemap.ts"), /\/availability/, "sitemap should include the page");

// --- /location → /contact rename ---
const contactPage = read("app/contact/page.tsx");
assert.match(contactPage, /path: "\/contact"/, "contact page metadata should use the new URL");
assert.match(contactPage, /href="\/availability"/, "contact page should link to check availability");
assert.doesNotMatch(contactPage, /<h2[^>]*>Hours<\/h2>/, "contact page should no longer render the hours card");
assert.match(read("next.config.ts"), /\/location.+\/contact/s, "old /location URL should redirect to /contact");
for (const f of ["app/layout.tsx", "app/components/MobileNav.tsx", "app/sitemap.ts"]) {
  assert.doesNotMatch(read(f), /"\/location"/, `${f} should not link to the removed /location route`);
}

console.log("availability tests passed");
