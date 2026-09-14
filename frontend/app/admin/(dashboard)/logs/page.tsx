// app/admin/(dashboard)/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  listAdminLogs,
  ApiError,
  type AdminLogSummary,
} from "../../../../lib/admin/api";

const ACTION_LABELS: Record<string, string> = {
  login: "Logged in",
  approve_registrant: "Approved registrant",
  reject_registrant: "Rejected registrant",
  edit_registrant: "Edited registrant",
  mark_paid: "Marked as paid",
  resend_email: "Resent email",
  create_admin: "Created admin",
  deactivate_admin: "Deactivated admin",
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

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminLogs(200)
      .then(setLogs)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load logs.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="font-display text-3xl text-cream mb-2">Admin logs</h1>
      <p className="font-body text-sm text-muted mb-8">
        A record of who did what, and when.
      </p>

      {loading && <p className="font-body text-sm text-muted">Loading…</p>}
      {error && <p className="font-body text-sm text-red">{error}</p>}

      {!loading && !error && logs.length === 0 && (
        <div className="border border-ink-raised rounded-sm p-8 text-center">
          <p className="font-body text-sm text-muted">No activity yet.</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="border border-ink-raised rounded-sm overflow-hidden">
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
                <tr
                  key={log.id}
                  className="border-b border-ink-raised last:border-b-0"
                >
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {formatTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-cream">
                    {log.admin_name || "System"}
                  </td>
                  <td className="px-4 py-3 text-cream">
                    {ACTION_LABELS[log.action] || log.action}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {log.target_reference || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">
                    {log.detail || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
