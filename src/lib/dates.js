export function localDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function daysBetween(dateKey, today = localDateKey()) {
  if (!dateKey) return null;
  const start = new Date(`${today}T12:00:00Z`);
  const end = new Date(`${dateKey}T12:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

export function formatDate(dateKey, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!dateKey) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { ...options, timeZone: "UTC" }).format(new Date(`${dateKey}T12:00:00Z`));
}

