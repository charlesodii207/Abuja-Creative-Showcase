// lib/admin/dates.ts
//
// Dates are compared as Nigeria (WAT, UTC+1) calendar days, the same
// convention the scan log and stats use.

const DAY_MS = 24 * 60 * 60 * 1000;

export function watDate(iso: string): string {
  return new Date(new Date(iso).getTime() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function todayWat(): string {
  return watDate(new Date().toISOString());
}

export function addDays(ymd: string, days: number): string {
  return new Date(new Date(`${ymd}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function prettyDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}