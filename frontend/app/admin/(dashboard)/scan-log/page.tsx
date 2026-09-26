// app/admin/(dashboard)/scan-log/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getScanLog,
  ApiError,
  type ScanLogResponse,
  type ScanLogEntry,
} from "../../../../lib/admin/api";

type Filter = "all" | "accepted" | "duplicate";

function todayWAT(): string {
  // Nigeria is UTC+1 year-round — shift "now" by the browser's own UTC
  // offset plus 1 hour, so the date picker defaults to the right day
  // regardless of where the admin's device thinks it is.
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const wat = new Date(utcMs + 60 * 60000);
  return wat.toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

export default function ScanLogPage() {
  const [eventDay, setEventDay] = useState(todayWAT());
  const [data, setData] = useState<ScanLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  async function load(day: string) {
    setLoading(true);
    setError("");
    try {
      const result = await getScanLog(day);
      setData(result);
    } catch (err) {
      setData(null);
      setError(
        err instanceof ApiError ? err.message : "Could not load the scan log."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(eventDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventDay]);

  const entries: ScanLogEntry[] = (data?.entries ?? []).filter((e) => {
    if (filter !== "all" && e.result !== filter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        e.full_name.toLowerCase().includes(q) ||
        e.ticket_number.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="font-display text-3xl text-cream">Scan log</h1>
      <p className="mt-2 font-body text-sm text-muted">
        Everyone scanned on a given day — accepted entries and repeat
        (duplicate) scans.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block font-body text-xs uppercase tracking-wide text-muted">
            Date
          </label>
          <input
            type="date"
            value={eventDay}
            onChange={(e) => setEventDay(e.target.value)}
            className="mt-1 rounded-sm border border-ink-raised bg-ink px-4 py-2.5 font-body text-sm text-cream outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block font-body text-xs uppercase tracking-wide text-muted">
            Search name or ticket number
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Kelly Doty or TBGDX92BXM"
            className="mt-1 w-full rounded-sm border border-ink-raised bg-ink px-4 py-2.5 font-body text-sm text-cream outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "accepted", "duplicate"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-sm border px-4 py-2.5 font-body text-sm capitalize transition-colors ${
                filter === f
                  ? "border-teal bg-teal/10 text-teal"
                  : "border-ink-raised text-muted hover:text-cream"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="mt-10 flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal/30 border-t-teal" />
          <p className="font-body text-sm text-muted">Loading scan log…</p>
        </div>
      )}

      {!loading && error && (
        <p className="mt-8 font-body text-sm text-red">{error}</p>
      )}

      {!loading && !error && data && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-md">
            <div className="rounded-sm border border-ink-raised bg-ink-raised/40 px-4 py-3">
              <p className="font-body text-xs uppercase tracking-wide text-muted">
                Total scans
              </p>
              <p className="mt-1 font-display text-2xl text-cream">
                {data.total_scans}
              </p>
            </div>
            <div className="rounded-sm border border-teal/30 bg-teal/5 px-4 py-3">
              <p className="font-body text-xs uppercase tracking-wide text-muted">
                Accepted
              </p>
              <p className="mt-1 font-display text-2xl text-teal">
                {data.accepted_count}
              </p>
            </div>
            <div className="rounded-sm border border-gold/30 bg-gold/5 px-4 py-3">
              <p className="font-body text-xs uppercase tracking-wide text-muted">
                Duplicates
              </p>
              <p className="mt-1 font-display text-2xl text-gold">
                {data.duplicate_count}
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-sm border border-ink-raised">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-ink-raised bg-ink-raised/40 text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Ticket No.</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Scanned by</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted"
                    >
                      No scans match this filter for {data.event_day}.
                    </td>
                  </tr>
                )}
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-ink-raised/60 last:border-0"
                  >
                    <td className="px-4 py-3 text-cream">
                      {formatTime(e.scanned_at)}
                    </td>
                    <td className="px-4 py-3 text-cream">{e.full_name}</td>
                    <td className="px-4 py-3 text-muted">
                      {e.category_tag}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {e.ticket_number}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          e.result === "accepted"
                            ? "bg-teal/10 text-teal"
                            : "bg-gold/10 text-gold"
                        }`}
                      >
                        {e.result === "accepted" ? "Approved" : "Duplicate"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {e.checked_in_by || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
