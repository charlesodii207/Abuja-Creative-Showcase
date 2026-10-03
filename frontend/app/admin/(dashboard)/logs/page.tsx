// app/admin/(dashboard)/logs/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listAdminLogs,
  ApiError,
  type AdminLogSummary,
} from "../../../../lib/admin/api";
import { downloadCsv, todayForFilename } from "../../../../lib/admin/csv";

const ACTION_LABELS: Record<string, string> = {
  login: "Logged in",
  change_password: "Changed password",
  approve_registrant: "Approved registrant",
  reject_registrant: "Rejected registrant",
  edit_registrant: "Edited registrant",
  mark_paid: "Marked as paid",
  resend_email: "Resent email",
  create_admin: "Created admin",
  deactivate_admin: "Deactivated admin",
  delete_admin: "Deleted admin",
  upgrade_admin: "Upgraded admin",
  downgrade_admin: "Downgraded admin",
  update_departments: "Changed departments",
  mark_message_read: "Read a message",
  reply_to_contact_message: "Replied to a message",
  close_contact_thread: "Closed a conversation",
  reopen_contact_thread: "Reopened a conversation",
  booking_contacted: "Contacted a booking guest",
  booking_confirmed: "Confirmed a booking",
  booking_cancelled: "Cancelled a booking",
  booking_resend_confirmation: "Resent booking confirmation",
};

type ViewMode = "timeline" | "by_admin" | "by_action" | "by_date";

const VIEW_LABELS: Record<ViewMode, string> = {
  timeline: "Timeline",
  by_admin: "By admin",
  by_action: "By action",
  by_date: "By date",
};

function formatTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateKey(iso: string | null) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LogRow({ log }: { log: AdminLogSummary }) {
  const who = log.target_name || log.target_reference || "—";
  return (
    <tr className="border-b border-ink-raised last:border-b-0">
      <td className="px-4 py-3 text-muted whitespace-nowrap">
        {formatTime(log.created_at)}
      </td>
      <td className="px-4 py-3 text-cream whitespace-nowrap">
        {log.admin_name || "System"}
      </td>
      <td className="px-4 py-3 text-cream whitespace-nowrap">
        {ACTION_LABELS[log.action] || log.action}
      </td>
      <td className="px-4 py-3 text-muted">
        {who}
        {log.target_name && log.target_reference && (
          <span className="text-muted/50"> · {log.target_reference}</span>
        )}
      </td>
      <td className="px-4 py-3 text-muted hidden md:table-cell">
        {log.detail || "—"}
      </td>
    </tr>
  );
}

// Phones get one compact card per log entry instead of a wide table.
function LogCard({ log }: { log: AdminLogSummary }) {
  const who = log.target_name || log.target_reference;
  return (
    <div className="border border-ink-raised rounded-sm p-4 font-body text-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-cream">{ACTION_LABELS[log.action] || log.action}</p>
        <p className="text-xs text-muted shrink-0">{formatTime(log.created_at)}</p>
      </div>
      <p className="mt-1 text-xs text-muted">By {log.admin_name || "System"}</p>
      {who && (
        <p className="text-xs text-muted break-words">
          {who}
          {log.target_name && log.target_reference && (
            <span className="text-muted/50"> · {log.target_reference}</span>
          )}
        </p>
      )}
      {log.detail && (
        <p className="mt-1 text-xs text-muted break-words">{log.detail}</p>
      )}
    </div>
  );
}

function LogTable({ logs }: { logs: AdminLogSummary[] }) {
  return (
    <>
      <div className="md:hidden space-y-2">
        {logs.map((log) => (
          <LogCard key={log.id} log={log} />
        ))}
      </div>

      <div className="hidden md:block border border-ink-raised rounded-sm overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-ink-raised text-left">
              <th className="px-4 py-3 text-muted-on-paper font-medium">When</th>
              <th className="px-4 py-3 text-muted-on-paper font-medium">By</th>
              <th className="px-4 py-3 text-muted-on-paper font-medium">Action</th>
              <th className="px-4 py-3 text-muted-on-paper font-medium">Target</th>
              <th className="px-4 py-3 text-muted-on-paper font-medium hidden md:table-cell">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function groupBy(
  logs: AdminLogSummary[],
  keyFn: (log: AdminLogSummary) => string
): [string, AdminLogSummary[]][] {
  const map = new Map<string, AdminLogSummary[]>();
  for (const log of logs) {
    const key = keyFn(log);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [view, setView] = useState<ViewMode>("timeline");

  // Seeded once, unfiltered, so the admin-name dropdown doesn't shrink
  // to just "whoever matches the current search" as you filter.
  const [knownAdmins, setKnownAdmins] = useState<string[]>([]);

  useEffect(() => {
    listAdminLogs({ limit: 1000 })
      .then((all) => {
        const names = Array.from(
          new Set(all.map((l) => l.admin_name).filter(Boolean) as string[])
        ).sort((a, b) => a.localeCompare(b));
        setKnownAdmins(names);
      })
      .catch(() => {
        /* dropdown just stays empty-ish if this fails — not critical */
      });
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      setError(null);
      listAdminLogs({
        search: search.trim() || undefined,
        action: actionFilter || undefined,
        admin_name: adminFilter || undefined,
      })
        .then(setLogs)
        .catch((err) =>
          setError(err instanceof ApiError ? err.message : "Couldn't load logs.")
        )
        .finally(() => setLoading(false));
    }, 300); // small debounce so typing a search doesn't fire a request per keystroke

    return () => clearTimeout(handle);
  }, [search, actionFilter, adminFilter]);

  // If a search (or the natural result of filtering) lands on actions
  // against exactly one registrant, surface that clearly — this is the
  // "search an applicant, see who acted on them" view.
  const singleRegistrantSummary = useMemo(() => {
    if (logs.length === 0) return null;
    const refs = new Set(
      logs
        .filter((l) => l.target_type === "registrant" && l.target_reference)
        .map((l) => l.target_reference)
    );
    if (refs.size !== 1) return null;
    const sample = logs.find((l) => l.target_type === "registrant");
    if (!sample) return null;
    return {
      name: sample.target_name || sample.target_reference!,
      reference: sample.target_reference!,
      count: logs.length,
    };
  }, [logs]);

  const grouped = useMemo(() => {
    if (view === "by_admin") {
      return groupBy(logs, (l) => l.admin_name || "System");
    }
    if (view === "by_action") {
      return groupBy(logs, (l) => ACTION_LABELS[l.action] || l.action);
    }
    if (view === "by_date") {
      return groupBy(logs, (l) => dateKey(l.created_at)).sort((a, b) =>
        // newest date first — groupBy sorts keys alphabetically, which
        // isn't chronological for these formatted labels, so re-sort
        // using each group's first (most recent) log's raw timestamp
        (b[1][0].created_at || "").localeCompare(a[1][0].created_at || "")
      );
    }
    return null;
  }, [view, logs]);

  function handleDownload() {
    downloadCsv(`admin-logs-${todayForFilename()}`, logs, [
      { header: "When", value: (l) => l.created_at || "" },
      { header: "Admin", value: (l) => l.admin_name || "System" },
      { header: "Action", value: (l) => ACTION_LABELS[l.action] || l.action },
      { header: "Target name", value: (l) => l.target_name || "" },
      { header: "Target reference", value: (l) => l.target_reference || "" },
      { header: "Detail", value: (l) => l.detail || "" },
    ]);
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-5xl">
      <h1 className="font-display text-3xl text-cream mb-2">Admin logs</h1>
      <p className="font-body text-sm text-muted mb-6">
        A record of who did what, and when.
      </p>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by applicant name, reference, admin, or detail"
          className="flex-1 min-w-[240px] bg-ink-raised border border-ink-raised rounded-sm px-4 py-2 font-body text-sm text-cream placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold"
        />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="max-w-full bg-ink-raised border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
          className="max-w-full bg-ink-raised border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="">All admins</option>
          {knownAdmins.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <button
          onClick={handleDownload}
          disabled={logs.length === 0}
          className="font-body text-xs rounded-sm px-3 py-2 border border-ink-raised text-muted hover:text-cream hover:border-teal/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⭳ Download CSV
        </button>
      </div>

      {/* View toggle (swipes sideways on narrow phones) */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-ink-raised">
        {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`shrink-0 whitespace-nowrap font-body text-sm px-4 py-2.5 border-b-2 transition-colors focus:outline-none ${
              view === v
                ? "border-gold text-cream"
                : "border-transparent text-muted hover:text-cream"
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {singleRegistrantSummary && (
        <div className="mb-6 rounded-sm border border-teal/30 bg-teal/5 px-5 py-4">
          <p className="font-body text-sm text-cream">
            <span className="font-medium">{singleRegistrantSummary.count}</span>{" "}
            admin action{singleRegistrantSummary.count === 1 ? "" : "s"} found for{" "}
            <span className="font-medium">{singleRegistrantSummary.name}</span>{" "}
            <span className="text-muted">
              ({singleRegistrantSummary.reference})
            </span>
          </p>
        </div>
      )}

      {loading && <p className="font-body text-sm text-muted">Loading…</p>}
      {error && <p className="font-body text-sm text-red">{error}</p>}

      {!loading && !error && logs.length === 0 && (
        <div className="border border-ink-raised rounded-sm p-8 text-center">
          <p className="font-body text-sm text-muted">
            No activity matches that search.
          </p>
        </div>
      )}

      {!loading && logs.length > 0 && view === "timeline" && (
        <LogTable logs={logs} />
      )}

      {!loading && logs.length > 0 && grouped && (
        <div className="space-y-8">
          {grouped.map(([groupName, groupLogs]) => (
            <div key={groupName}>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="font-display text-lg text-cream">{groupName}</h2>
                <span className="font-body text-xs text-muted">
                  {groupLogs.length} action{groupLogs.length === 1 ? "" : "s"}
                </span>
              </div>
              <LogTable logs={groupLogs} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
