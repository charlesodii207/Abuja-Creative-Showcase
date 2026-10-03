// app/admin/(dashboard)/registrants/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listRegistrants,
  ApiError,
  type RegistrantSummary,
  type SortOrder,
} from "../../../../lib/admin/api";
import { downloadCsv, todayForFilename } from "../../../../lib/admin/csv";
import RegistrantDetailPanel from "../../../components/admin/RegistrantDetailPanel";

const TABS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Attendees", value: "attendee" },
  { label: "Exhibitors", value: "exhibitor" },
  { label: "Press", value: "press" },
  { label: "Pitchers", value: "pitcher" },
  { label: "Investors", value: "investor" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "approved", label: "Approved" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "text-gold",
  awaiting_payment: "text-gold",
  approved: "text-teal",
  confirmed: "text-teal",
  rejected: "text-red",
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Registration dates are compared as Nigeria (WAT, UTC+1) calendar days,
// the same convention the scan log and stats use.
function watDate(iso: string): string {
  return new Date(new Date(iso).getTime() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function todayWat(): string {
  return watDate(new Date().toISOString());
}

function addDays(ymd: string, days: number): string {
  return new Date(new Date(`${ymd}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function prettyDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

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

const controlClass =
  "bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold";

const labelClass = "block font-body text-xs text-muted mb-1";

export default function RegistrantsPage() {
  const router = useRouter();
  const [registrants, setRegistrants] = useState<RegistrantSummary[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOrder>("alpha");
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
      const data = await listRegistrants({
        ...(activeTab ? { category: activeTab } : {}),
        sort,
      });
      setRegistrants(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(
        err instanceof ApiError ? err.message : "Couldn't load registrants."
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, sort, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search and date narrow the list first. The status counts in the status
  // dropdown are taken from this list, so they always match what you'd get
  // by choosing that status.
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return registrants.filter((r) => {
      if (
        q &&
        !(
          r.full_name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.reference_number.toLowerCase().includes(q)
        )
      ) {
        return false;
      }

      if (dateFrom || dateTo) {
        if (!r.created_at) return false;
        const d = watDate(r.created_at);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }

      return true;
    });
  }, [registrants, search, dateFrom, dateTo]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    baseFiltered.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [baseFiltered]);

  const filtered = useMemo(
    () =>
      statusFilter
        ? baseFiltered.filter((r) => r.status === statusFilter)
        : baseFiltered,
    [baseFiltered, statusFilter]
  );

  // Reset to page 1 whenever anything changes the underlying list —
  // otherwise you could land on "page 5" of a filtered set that only
  // has 2 pages.
  useEffect(() => {
    setPage(1);
  }, [activeTab, sort, search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  // ---- "What am I looking at" heading ----
  const tabLabel = TABS.find((t) => t.value === activeTab)?.label ?? "All";
  const categoryLabel = tabLabel === "All" ? "All registrants" : tabLabel;
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label;
  const hasDate = Boolean(dateFrom || dateTo);
  const dateLabel = !hasDate
    ? null
    : dateFrom === dateTo
    ? `Registered ${prettyDate(dateFrom)}`
    : `Registered ${dateFrom ? prettyDate(dateFrom) : "…"} – ${
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
    // "custom" keeps whatever dates are set; the two date boxes appear.
  }

  function changeFrom(value: string) {
    setDateFrom(value);
    // Picking a start day shows that single day until you set an end day.
    if (value && (!dateTo || dateTo < value)) setDateTo(value);
  }

  function changeTo(value: string) {
    setDateTo(value);
    if (value && (!dateFrom || dateFrom > value)) setDateFrom(value);
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-6xl">
      <h1 className="font-display text-3xl text-cream mb-6">Registrants</h1>

      {/* All filters live in this one bar */}
      <div className="border border-ink-raised rounded-sm mb-6">
        {/* Category */}
        <div className="flex gap-1 overflow-x-auto border-b border-ink-raised px-2 sm:flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.value)}
              className={`shrink-0 whitespace-nowrap font-body text-sm px-4 py-2.5 border-b-2 transition-colors focus:outline-none ${
                activeTab === tab.value
                  ? "border-gold text-cream"
                  : "border-transparent text-muted hover:text-cream"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, status, date, sort, download */}
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="reg-search" className={labelClass}>
              Search
            </label>
            <input
              id="reg-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, or reference number"
              className={`${controlClass} w-full placeholder:text-muted`}
            />
          </div>

          <div>
            <label htmlFor="reg-status" className={labelClass}>
              Status
            </label>
            <select
              id="reg-status"
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
            <label htmlFor="reg-date" className={labelClass}>
              Registered
            </label>
            <select
              id="reg-date"
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
                <label htmlFor="reg-from" className={labelClass}>
                  From
                </label>
                <input
                  id="reg-from"
                  type="date"
                  value={dateFrom}
                  max={todayWat()}
                  onChange={(e) => changeFrom(e.target.value)}
                  className={controlClass}
                />
              </div>
              <div>
                <label htmlFor="reg-to" className={labelClass}>
                  To
                </label>
                <input
                  id="reg-to"
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
              downloadCsv(
                `registrants-${activeTab || "all"}-${todayForFilename()}`,
                filtered,
                [
                  { header: "Full name", value: (r) => r.full_name },
                  { header: "Email", value: (r) => r.email },
                  { header: "Phone", value: (r) => r.phone },
                  { header: "Category", value: (r) => r.category },
                  { header: "Reference", value: (r) => r.reference_number },
                  { header: "Status", value: (r) => r.status },
                  {
                    header: "Registered (WAT date)",
                    value: (r) => (r.created_at ? watDate(r.created_at) : ""),
                  },
                ]
              )
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
          {categoryLabel}{" "}
          <span className="text-gold">
            · {loading ? "…" : filtered.length.toLocaleString()}{" "}
            {filtered.length === 1 ? "person" : "people"}
          </span>
        </h2>
        <p className="font-body text-xs text-muted mt-1">
          {summaryParts.join(" · ")}
          {!loading && activeFilterCount > 0 && (
            <>
              {" "}
              · of {registrants.length.toLocaleString()} in{" "}
              {categoryLabel.toLowerCase()}
            </>
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
              <th className="px-4 py-3 text-muted-on-paper font-medium">
                Name
              </th>
              <th className="px-4 py-3 text-muted-on-paper font-medium hidden md:table-cell">
                Email
              </th>
              <th className="px-4 py-3 text-muted-on-paper font-medium hidden sm:table-cell">
                Reference
              </th>
              <th className="px-4 py-3 text-muted-on-paper font-medium hidden lg:table-cell">
                Registered
              </th>
              <th className="px-4 py-3 text-muted-on-paper font-medium">
                Status
              </th>
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
                  No registrants match these filters.
                </td>
              </tr>
            ) : (
              pageItems.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRef(r.reference_number)}
                  className="border-b border-ink-raised last:border-b-0 cursor-pointer hover:bg-ink-raised/40 transition-colors"
                >
                  <td className="px-4 py-3 text-cream">
                    {r.full_name}
                    <span className="block md:hidden text-xs text-muted break-all">
                      {r.email}
                    </span>
                    <span className="block sm:hidden text-xs text-muted">
                      {r.reference_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">
                    {r.email}
                  </td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">
                    {r.reference_number}
                  </td>
                  <td className="px-4 py-3 text-muted hidden lg:table-cell whitespace-nowrap">
                    {r.created_at ? prettyDate(watDate(r.created_at)) : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      STATUS_STYLES[r.status] || "text-cream"
                    }`}
                  >
                    {r.status.replace("_", " ")}
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

      <RegistrantDetailPanel
        referenceNumber={selectedRef}
        onClose={() => setSelectedRef(null)}
        onChanged={loadData}
      />
    </div>
  );
}
