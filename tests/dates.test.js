import assert from "node:assert/strict";
import test from "node:test";
import { daysBetween, formatDate, localDateKey } from "../src/lib/dates.js";

test("localDateKey returns the local calendar day", () => {
  assert.equal(localDateKey(new Date(2026, 8, 13, 12)), "2026-09-13");
});

test("daysBetween reports future and past distances", () => {
  assert.equal(daysBetween("2026-09-20", "2026-09-13"), 7);
  assert.equal(daysBetween("2026-09-01", "2026-09-13"), -12);
  assert.equal(daysBetween(null, "2026-09-13"), null);
});

test("formatDate formats stored date keys without UTC drift", () => {
  assert.match(formatDate("2026-09-13"), /13/);
});
