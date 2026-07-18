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
