import { daysBetween, localDateKey } from "./dates.js";

export const assetTypes = [
  { value: "STOCK", label: "Stock", plural: "Stocks", short: "EQ", token: "var(--asset-stock)" },
  { value: "MUTUAL_FUND", label: "Mutual fund", plural: "Mutual funds", short: "MF", token: "var(--asset-fund)" },
  { value: "BOND", label: "Bond", plural: "Bonds", short: "BD", token: "var(--asset-bond)" },
  { value: "FIXED_DEPOSIT", label: "Fixed deposit", plural: "Fixed deposits", short: "FD", token: "var(--asset-deposit)" },
  { value: "CASH", label: "Cash account", plural: "Cash", short: "CA", token: "var(--asset-cash)" },
];

export function typeDetails(value) {
  return assetTypes.find((type) => type.value === value) || assetTypes[0];
}

export function formatMoney(value, { compact = false, decimals = 0 } = {}) {
  const amount = finiteNumber(value);
  if (!compact) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: decimals,
    }).format(amount);
  }
  const absolute = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  if (absolute >= 10_000_000) return `${sign}₹${trimNumber(absolute / 10_000_000)}Cr`;
  if (absolute >= 100_000) return `${sign}₹${trimNumber(absolute / 100_000)}L`;
  if (absolute >= 1_000) return `${sign}₹${trimNumber(absolute / 1_000)}k`;
  return `${sign}₹${trimNumber(absolute)}`;
}

export function formatPercent(value, signed = false) {
  const number = finiteNumber(value);
  return `${signed && number > 0 ? "+" : ""}${number.toFixed(2)}%`;
}

export function blankHolding(assetType = "STOCK", today = localDateKey()) {
  return {
    assetType,
    name: "",
    symbol: "",
    category: "",
    institution: "",
    quantity: "",
    averageCost: "",
    currentPrice: "",
    annualRate: "",
    secondaryRate: "",
    recurringAmount: "",
    maturityDate: "",
    nextPayoutDate: "",
    valuedOn: today,
    notes: "",
  };
}

export function holdingToForm(holding) {
  const blank = blankHolding(holding.assetType, holding.valuedOn);
  return Object.fromEntries(Object.keys(blank).map((key) => [key, holding[key] == null ? "" : String(holding[key])]));
}

export function holdingPayload(form) {
  const marketAsset = ["STOCK", "MUTUAL_FUND", "BOND"].includes(form.assetType);
  const cashAsset = form.assetType === "CASH";
  const currentPrice = requiredNumber(form.currentPrice);
  return {
    assetType: form.assetType,
    name: String(form.name || "").trim().slice(0, 120),
    symbol: String(form.symbol || "").trim().toLocaleUpperCase().slice(0, 30),
    category: String(form.category || "").trim().slice(0, 60),
    institution: String(form.institution || "").trim().slice(0, 100),
    quantity: marketAsset ? requiredNumber(form.quantity) : 1,
    averageCost: cashAsset ? currentPrice : requiredNumber(form.averageCost),
    currentPrice,
    annualRate: optionalNumber(form.annualRate),
    secondaryRate: optionalNumber(form.secondaryRate),
    recurringAmount: optionalNumber(form.recurringAmount),
    maturityDate: form.maturityDate || null,
    nextPayoutDate: form.nextPayoutDate || null,
    valuedOn: form.valuedOn,
    notes: String(form.notes || "").trim().slice(0, 500),
  };
}

export function validateHolding(form) {
  if (!assetTypes.some((type) => type.value === form.assetType)) return "Choose a supported asset type.";
  if (!String(form.name || "").trim()) return "Enter a name for this holding.";
  if (form.assetType === "STOCK" && !String(form.symbol || "").trim()) return "Enter the stock ticker symbol.";
  const marketAsset = ["STOCK", "MUTUAL_FUND", "BOND"].includes(form.assetType);
  if (marketAsset && !(requiredNumber(form.quantity) > 0)) return "Quantity must be greater than zero.";
  if (form.assetType !== "CASH" && form.averageCost === "") return "Enter the average cost or principal.";
  if (form.assetType !== "CASH" && requiredNumber(form.averageCost) < 0) return "Cost or principal cannot be negative.";
  if (form.currentPrice === "") return "Enter the current price, value, or balance.";
  if (requiredNumber(form.currentPrice) < 0) return "Current value or price cannot be negative.";
  for (const field of ["annualRate", "secondaryRate"]) {
    const value = optionalNumber(form[field]);
    if (value != null && (value < 0 || value > 100)) return "Rates must be between 0% and 100%.";
  }
  if (optionalNumber(form.recurringAmount) < 0) return "Recurring amount cannot be negative.";
  if (form.assetType === "FIXED_DEPOSIT" && !form.maturityDate) return "Choose the fixed deposit maturity date.";
  if (!form.valuedOn) return "Choose the date these values apply to.";
  if (form.valuedOn > localDateKey()) return "Valuation date cannot be in the future.";
  return "";
}

export function holdingValue(holding) {
  return finiteNumber(holding.currentValue ?? finiteNumber(holding.quantity) * finiteNumber(holding.currentPrice));
}

export function holdingInvested(holding) {
  return finiteNumber(holding.investedAmount ?? finiteNumber(holding.quantity) * finiteNumber(holding.averageCost));
}

export function portfolioSummary(holdings, today = localDateKey()) {
  const invested = holdings.reduce((sum, holding) => sum + holdingInvested(holding), 0);
  const currentValue = holdings.reduce((sum, holding) => sum + holdingValue(holding), 0);
  const gain = currentValue - invested;
  const byType = assetTypes.map((type) => {
    const items = holdings.filter((holding) => holding.assetType === type.value);
    const groupValue = items.reduce((sum, holding) => sum + holdingValue(holding), 0);
    return { ...type, items, currentValue: groupValue, share: currentValue > 0 ? (groupValue / currentValue) * 100 : 0 };
  });
  const institutionMap = new Map();
  holdings.forEach((holding) => {
    const name = holding.institution?.trim() || "Not specified";
    institutionMap.set(name, (institutionMap.get(name) || 0) + holdingValue(holding));
  });
  const institutions = [...institutionMap.entries()].map(([name, value]) => ({
    name,
    value,
    share: currentValue > 0 ? (value / currentValue) * 100 : 0,
  })).sort((left, right) => right.value - left.value);
  const annualIncome = holdings.reduce((sum, holding) => {
    if (!["BOND", "FIXED_DEPOSIT", "CASH"].includes(holding.assetType)) return sum;
    const base = holding.assetType === "CASH" ? holdingValue(holding) : holdingInvested(holding);
    return sum + base * finiteNumber(holding.annualRate) / 100;
  }, 0);
  const monthlyRecurring = holdings.reduce((sum, holding) => sum + finiteNumber(holding.recurringAmount), 0);
  const stale = holdings.filter((holding) => {
    const age = daysBetween(holding.valuedOn, today);
    return age != null && age < -30;
  }).sort((left, right) => (left.valuedOn || "").localeCompare(right.valuedOn || ""));
  const latestValuation = holdings.map((holding) => holding.valuedOn).filter(Boolean).sort().at(-1) || null;
  const largestHolding = [...holdings].sort((left, right) => holdingValue(right) - holdingValue(left))[0] || null;
  const largestHoldingShare = largestHolding && currentValue > 0 ? holdingValue(largestHolding) / currentValue * 100 : 0;
  return {
    invested,
    currentValue,
    gain,
    gainPercent: invested > 0 ? gain / invested * 100 : 0,
    annualIncome,
    monthlyRecurring,
    byType,
    institutions,
    latestValuation,
    stale,
    largestHolding,
    largestHoldingShare,
  };
}

export function portfolioEvents(holdings, today = localDateKey()) {
  return holdings.flatMap((holding) => [
    holding.nextPayoutDate ? { id: `${holding.id}-payout`, date: holding.nextPayoutDate, kind: "Payout", holding } : null,
    holding.maturityDate ? { id: `${holding.id}-maturity`, date: holding.maturityDate, kind: "Maturity", holding } : null,
  ]).filter(Boolean).map((event) => ({ ...event, days: daysBetween(event.date, today) }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function holdingFacts(holding) {
  if (holding.assetType === "STOCK") return [`${plainNumber(holding.quantity)} shares`, `${formatMoney(holding.averageCost, { decimals: 2 })} average`];
  if (holding.assetType === "MUTUAL_FUND") return [`${plainNumber(holding.quantity)} units`, holding.recurringAmount ? `${formatMoney(holding.recurringAmount)}/month` : "No SIP recorded"];
  if (holding.assetType === "BOND") return [rateFact(holding.annualRate, "coupon"), rateFact(holding.secondaryRate, "YTM")];
  if (holding.assetType === "FIXED_DEPOSIT") return [rateFact(holding.annualRate, "interest"), holding.maturityDate ? `Matures ${holding.maturityDate}` : "Maturity not set"];
  return [rateFact(holding.annualRate, "interest")];
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function requiredNumber(value) {
  return finiteNumber(value);
}

function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  return finiteNumber(value);
}

function plainNumber(value) {
  return finiteNumber(value).toLocaleString("en-IN", { maximumFractionDigits: 6 });
}

function rateFact(value, label) {
  return value == null ? `${label} not set` : `${plainNumber(value)}% ${label}`;
}

function trimNumber(value) {
  return value.toFixed(value >= 10 ? 1 : 2).replace(/\.?0+$/u, "");
}
