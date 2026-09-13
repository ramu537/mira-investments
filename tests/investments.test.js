import assert from "node:assert/strict";
import test from "node:test";
import { blankHolding, formatMoney, holdingPayload, portfolioEvents, portfolioSummary, validateHolding } from "../src/lib/investments.js";

const holdings = [
  { id: 1, assetType: "STOCK", name: "Example Industries", symbol: "EXAMPLE", institution: "Broker A", quantity: 10, averageCost: 100, currentPrice: 125, investedAmount: 1000, currentValue: 1250, gainAmount: 250, gainPercent: 25, valuedOn: "2026-09-13" },
  { id: 2, assetType: "MUTUAL_FUND", name: "Index Fund", symbol: "", institution: "Fund House", quantity: 20, averageCost: 50, currentPrice: 55, investedAmount: 1000, currentValue: 1100, gainAmount: 100, gainPercent: 10, recurringAmount: 500, valuedOn: "2026-08-01" },
  { id: 3, assetType: "FIXED_DEPOSIT", name: "One-year deposit", symbol: "", institution: "Bank A", quantity: 1, averageCost: 2000, currentPrice: 2100, investedAmount: 2000, currentValue: 2100, gainAmount: 100, gainPercent: 5, annualRate: 7, maturityDate: "2026-12-13", valuedOn: "2026-09-10" },
];

test("holdingPayload maps cash balances to the existing backend contract", () => {
  const form = { ...blankHolding("CASH", "2026-09-13"), name: "Emergency fund", currentPrice: "50000", annualRate: "3.5" };
  const payload = holdingPayload(form);
  assert.equal(payload.quantity, 1);
  assert.equal(payload.averageCost, 50000);
  assert.equal(payload.currentPrice, 50000);
  assert.equal(payload.annualRate, 3.5);
  assert.equal(payload.symbol, "");
});

test("validateHolding enforces type-specific backend requirements", () => {
  assert.equal(validateHolding({ ...blankHolding("STOCK"), name: "Example", quantity: "2", averageCost: "10", currentPrice: "12" }), "Enter the stock ticker symbol.");
  assert.equal(validateHolding({ ...blankHolding("FIXED_DEPOSIT"), name: "Deposit", averageCost: "100", currentPrice: "105" }), "Choose the fixed deposit maturity date.");
  assert.equal(validateHolding({ ...blankHolding("CASH"), name: "Cash", currentPrice: "1000" }), "");
});

test("portfolioSummary derives transparent snapshot metrics", () => {
  const summary = portfolioSummary(holdings, "2026-09-13");
  assert.equal(summary.invested, 4000);
  assert.equal(summary.currentValue, 4450);
  assert.equal(summary.gain, 450);
  assert.equal(summary.gainPercent, 11.25);
  assert.equal(summary.annualIncome, 140);
  assert.equal(summary.monthlyRecurring, 500);
  assert.equal(summary.stale.length, 1);
  assert.equal(summary.byType.find((group) => group.value === "STOCK").items.length, 1);
});

test("portfolioEvents orders payouts and maturities by date", () => {
  const withPayout = [{ ...holdings[2], nextPayoutDate: "2026-10-13" }];
  const events = portfolioEvents(withPayout, "2026-09-13");
  assert.deepEqual(events.map((event) => event.kind), ["Payout", "Maturity"]);
  assert.deepEqual(events.map((event) => event.days), [30, 91]);
});

test("formatMoney uses Indian rupee notation", () => {
  assert.match(formatMoney(125000, { compact: true }), /^₹1\.25L$/);
});

