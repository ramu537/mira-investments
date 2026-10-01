import assert from "node:assert/strict";
import test from "node:test";
import { intelligenceCopy, normalizeEvidence } from "../src/lib/intelligence.js";

test("investment intelligence renders aggregate evidence and calculated fallback", () => {
  assert.equal(normalizeEvidence({ stale_holdings: 2 })[0].label, "stale holdings");
  assert.equal(intelligenceCopy({ guidance: "Update stale valuations" }), "Update stale valuations");
});
