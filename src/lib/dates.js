export function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function daysBetween(dateKey, today = localDateKey()) {
  if (!dateKey) return null;
  const start = new Date(`${today}T12:00:00`);
  const end = new Date(`${dateKey}T12:00:00`);
  return Math.round((end - start) / 86_400_000);
}

export function formatDate(dateKey, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!dateKey) return "Not set";
  return new Intl.DateTimeFormat("en-IN", options).format(new Date(`${dateKey}T12:00:00`));
}

