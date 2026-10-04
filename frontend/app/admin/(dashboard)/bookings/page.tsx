// app/admin/(dashboard)/bookings/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listBookings,
  ApiError,
  type BookingSummary,
  type SortOrder,
} from "../../../../lib/admin/api";
import { downloadCsv, todayForFilename } from "../../../../lib/admin/csv";
import {
  watDate,
  todayWat,
  addDays,
  prettyDate,
} from "../../../../lib/admin/dates";
import BookingDetailPanel from "../../../components/admin/BookingDetailPanel";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "text-gold",
  contacted: "text-cream",
  confirmed: "text-teal",
  cancelled: "text-red",
};

type PresetKey = "today" | "yesterday" | "7d" | "30d";
type DateMode = "any" | PresetKey | "custom";

const DATE_MODES: { value: DateMode; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Pick dates…" },
];

function presetRange(key: PresetKey): [string, string] {
  const today = todayWat();
  if (key === "today") return [today, today];
  if (key === "yesterday") {
    const y = addDays(today, -1);
    return [y, y];
  }
  if (key === "7d") return [addDays(today, -6), today];
  return [addDays(today, -29), today];
}

function stayLabel(b: BookingSummary): string {
  if (b.check_in && b.check_out) {
    return `${prettyDate(b.check_in)} – ${prettyDate(b.check_out)}`;
  }
  if (b.check_in) return `From ${prettyDate(b.check_in)}`;
  return "—";
}

const controlClass =
  "bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold";

const labelClass = "block font-body text-xs text-muted mb-1";

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [sort, setSort] = useState<SortOrder>("recent");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateMode, setDateMode] = useState<DateMode>("any");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 100;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await listBookings({ sort }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Couldn't load bookings.");
    } finally {
      setLoading(false);
    }
  }, [sort, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search and date narrow the list first; the counts in the status
  // dropdown come from this list so they always match.
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return bookings.filter((b) => {
      if (
        q &&
        !(
          b.full_name.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.reference_number.toLowerCase().includes(q) ||
          (b.phone || "").toLowerCase().includes(q)
        )
      ) {
        return false;
      }

      if (dateFrom || dateTo) {
        if (!b.created_at) return false;
        const d = watDate(b.created_at);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }

      return true;
    });
  }, [bookings, search, dateFrom, dateTo]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    baseFiltered.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [baseFiltered]);

  const filtered = useMemo(
    () =>
      statusFilter
        ? baseFiltered.filter((b) => b.status === statusFilter)
        : baseFiltered,
    [baseFiltered, statusFilter]
  );

  useEffect(() => {
    setPage(1);
  }, [sort, search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  // ---- "What am I looking at" heading ----
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label;
  const hasDate = Boolean(dateFrom || dateTo);
  const dateLabel = !hasDate
    ? null
    : dateFrom === dateTo
    ? `Received ${prettyDate(dateFrom)}`
    : `Received ${dateFrom ? prettyDate(dateFrom) : "…"} – ${
        dateTo ? prettyDate(dateTo) : "…"
      }`;
  const activeFilterCount =
    (statusFilter ? 1 : 0) + (hasDate ? 1 : 0) + (search.trim() ? 1 : 0);

  const summaryParts = [
    statusLabel,
    dateLabel,
    search.trim() ? `Matching “${search.trim()}”` : null,
    sort === "alpha" ? "Sorted A–Z" : "Most recent first",
  ].filter(Boolean) as string[];

  function clearDates() {
    setDateMode("any");
    setDateFrom("");
    setDateTo("");
  }

  function clearAllFilters() {
    setStatusFilter(null);
    clearDates();
    setSearch("");
  }

  function changeDateMode(mode: DateMode) {
    setDateMode(mode);
    if (mode === "any") {
      setDateFrom("");
      setDateTo("");
    } else if (mode !== "custom") {
      const [from, to] = presetRange(mode);
      setDateFrom(from);
      setDateTo(to);
    }
  }

  function changeFrom(value: string) {
    setDateFrom(value);
    if (value && (!dateTo || dateTo < value)) setDateTo(value);
  }

  function changeTo(value: string) {
    setDateTo(value);
    if (value && (!dateFrom || dateFrom > value)) setDateFrom(value);
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-6xl">
      <h1 className="font-display text-3xl text-cream mb-6">Bookings</h1>

      {/* All filters live in this one bar */}
      <div className="border border-ink-raised rounded-sm mb-6">
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="bk-search" className={labelClass}>
              Search
            </label>
            <input
              id="bk-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, phone or reference"
              className={`${controlClass} w-full placeholder:text-muted`}
            />
          </div>

          <div>
            <label htmlFor="bk-status" className={labelClass}>
              Status
            </label>
            <select
              id="bk-status"
              value={statusFilter ?? ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className={controlClass}
            >
              <option value="">All statuses ({baseFiltered.length})</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} ({statusCounts[s.value] || 0})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bk-date" className={labelClass}>
              Received
            </label>
            <select
              id="bk-date"
              value={dateMode}
              onChange={(e) => changeDateMode(e.target.value as DateMode)}
              className={controlClass}
            >
              {DATE_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {dateMode === "custom" && (
            <>
              <div>
                <label htmlFor="bk-from" className={labelClass}>
                  From
                </label>
                <input
                  id="bk-from"
                  type="date"
                  value={dateFrom}
                  max={todayWat()}
                  onChange={(e) => changeFrom(e.target.value)}
                  className={controlClass}
                />
              </div>
              <div>
                <label htmlFor="bk-to" className={labelClass}>
                  To
                </label>
                <input
                  id="bk-to"
                  type="date"
                  value={dateTo}
                  max={todayWat()}
                  onChange={(e) => changeTo(e.target.value)}
                  className={controlClass}
                />
              </div>
            </>
          )}

          <div>
            <span className={labelClass}>Sort</span>
            <div className="flex rounded-sm border border-ink-raised overflow-hidden">
              <button
                onClick={() => setSort("alpha")}
                className={`font-body text-sm px-3 py-2 transition-colors ${
                  sort === "alpha"
                    ? "bg-gold text-ink"
                    : "text-muted hover:text-cream"
                }`}
              >
                A–Z
              </button>
              <button
                onClick={() => setSort("recent")}
                className={`font-body text-sm px-3 py-2 transition-colors border-l border-ink-raised ${
                  sort === "recent"
                    ? "bg-gold text-ink"
                    : "text-muted hover:text-cream"
                }`}
              >
                Most recent
              </button>
            </div>
          </div>

          <button
            onClick={() =>
              downloadCsv(`bookings-${todayForFilename()}`, filtered, [
                { header: "Reference", value: (b) => b.reference_number },
                { header: "Name", value: (b) => b.full_name },
                { header: "Email", value: (b) => b.email },
                { header: "Phone", value: (b) => b.phone || "" },
                { header: "Status", value: (b) => b.status },
                { header: "Requested check-in", value: (b) => b.check_in || "" },
                { header: "Requested check-out", value: (b) => b.check_out || "" },
                { header: "Nights", value: (b) => (b.nights ?? "").toString() },
                { header: "Rooms", value: (b) => (b.rooms ?? "").toString() },
                { header: "Budget per night", value: (b) => b.budget_range || "" },
                {
                  header: "Received (WAT date)",
                  value: (b) => (b.created_at ? watDate(b.created_at) : ""),
                },
              ])
            }
            disabled={filtered.length === 0}
            className="font-body text-sm rounded-sm px-3 py-2 border border-ink-raised text-muted hover:text-cream hover:border-teal/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⭳ Download CSV
          </button>
        </div>
      </div>

      {/* Always-visible summary of what is on screen */}
      <div className="mb-6">
        <h2 className="font-display text-2xl text-cream">
          Bookings{" "}
          <span className="text-gold">
            · {loading ? "…" : filtered.length.toLocaleString()}{" "}
            {filtered.length === 1 ? "booking" : "bookings"}
          </span>
        </h2>
        <p className="font-body text-xs text-muted mt-1">
          {summaryParts.join(" · ")}
          {!loading && activeFilterCount > 0 && (
            <> · of {bookings.length.toLocaleString()} in total</>
          )}
        </p>

        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {statusLabel && (
              <button
                onClick={() => setStatusFilter(null)}
                className="font-body text-xs rounded-full border border-gold/50 text-gold px-3 py-1 hover:bg-gold/10"
              >
                {statusLabel} ×
              </button>
            )}
            {dateLabel && (
              <button
                onClick={clearDates}
                className="font-body text-xs rounded-full border border-gold/50 text-gold px-3 py-1 hover:bg-gold/10"
              >
                {dateLabel} ×
              </button>
            )}
            {search.trim() && (
              <button
                onClick={() => setSearch("")}
                className="font-body text-xs rounded-full border border-gold/50 text-gold px-3 py-1 hover:bg-gold/10"
              >
                “{search.trim()}” ×
              </button>
            )}
            <button
              onClick={clearAllFilters}
              className="font-body text-xs text-muted hover:text-cream underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="font-body text-sm text-red mb-4 border border-red/30 bg-red/10 rounded-sm px-3 py-2">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="border border-ink-raised rounded-sm overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-ink-raised text-left">
              <th className="px-4 py-3 text-muted-on-paper font-medium">Guest</th>
              <th className="px-4 py-3 text-muted-on-paper font-medium hidden sm:table-cell">
                Reference
              </th>
              <th className="px-4 py-3 text-muted-on-paper font-medium hidden md:table-cell">
                Requested stay
              </th>
              <th className="px-4 py-3 text-muted-on-paper font-medium hidden lg:table-cell">
                Received
              </th>
              <th className="px-4 py-3 text-muted-on-paper font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {bookings.length === 0
                    ? "No bookings yet."
                    : "No bookings match these filters."}
                </td>
              </tr>
            ) : (
              pageItems.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedRef(b.reference_number)}
                  className="border-b border-ink-raised last:border-b-0 cursor-pointer hover:bg-ink-raised/40 transition-colors"
                >
                  <td className="px-4 py-3 text-cream">
                    {b.full_name}
                    <span className="block text-xs text-muted break-all">
                      {b.email}
                    </span>
                    <span className="block sm:hidden text-xs text-muted">
                      {b.reference_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">
                    {b.reference_number}
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">
                    {stayLabel(b)}
                    {b.nights && (
                      <span className="block text-xs">
                        {b.nights} {b.nights === 1 ? "night" : "nights"}
                        {b.rooms ? ` · ${b.rooms} ${b.rooms === 1 ? "room" : "rooms"}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted hidden lg:table-cell whitespace-nowrap">
                    {b.created_at ? prettyDate(watDate(b.created_at)) : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 capitalize ${
                      STATUS_STYLES[b.status] || "text-cream"
                    }`}
                  >
                    {b.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-xs text-muted">
            Showing {rangeStart}–{rangeEnd} of {filtered.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="font-body text-xs rounded-sm px-3 py-1.5 border border-ink-raised text-muted hover:text-cream disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <span className="font-body text-xs text-muted px-2">
              Page {safePage} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="font-body text-xs rounded-sm px-3 py-1.5 border border-ink-raised text-muted hover:text-cream disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <BookingDetailPanel
        referenceNumber={selectedRef}
        onClose={() => setSelectedRef(null)}
        onChanged={loadData}
      />
    </div>
  );
}
