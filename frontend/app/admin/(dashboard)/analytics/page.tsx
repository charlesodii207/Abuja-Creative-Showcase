// app/admin/(dashboard)/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getStats, ApiError, type StatsResponse } from "../../../../lib/admin/api";

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between font-body text-sm mb-1">
        <span className="text-cream capitalize">{label.replace("_", " ")}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="h-2 bg-ink-raised rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load analytics.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="font-display text-3xl text-cream mb-2">Analytics</h1>
      <p className="font-body text-sm text-muted mb-8">
        A closer look at registrations and payments.
      </p>

      {loading && <p className="font-body text-sm text-muted">Loading…</p>}
      {error && <p className="font-body text-sm text-red">{error}</p>}

      {stats && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-ink-raised rounded-sm p-6">
            <h2 className="font-body text-sm text-muted-on-paper mb-4">
              Registrations by category
            </h2>
            {Object.entries(stats.by_category).map(([key, value]) => (
              <Bar
                key={key}
                label={key}
                value={value}
                max={stats.total_registrants}
              />
            ))}
          </div>

          <div className="border border-ink-raised rounded-sm p-6">
            <h2 className="font-body text-sm text-muted-on-paper mb-4">
              Registrations by status
            </h2>
            {Object.entries(stats.by_status).map(([key, value]) => (
              <Bar
                key={key}
                label={key}
                value={value}
                max={stats.total_registrants}
              />
            ))}
          </div>

          <div className="border border-ink-raised rounded-sm p-6">
            <h2 className="font-body text-sm text-muted-on-paper mb-4">
              Attendee payments
            </h2>
            <Bar
              label="Paid"
              value={stats.attendees_paid}
              max={stats.attendees_paid + stats.attendees_unpaid}
            />
            <Bar
              label="Unpaid"
              value={stats.attendees_unpaid}
              max={stats.attendees_paid + stats.attendees_unpaid}
            />
          </div>

          <div className="border border-ink-raised rounded-sm p-6">
            <h2 className="font-body text-sm text-muted-on-paper mb-4">
              Exhibitor payments
            </h2>
            <Bar
              label="Paid"
              value={stats.exhibitors_paid}
              max={stats.exhibitors_paid + stats.exhibitors_unpaid}
            />
            <Bar
              label="Unpaid"
              value={stats.exhibitors_unpaid}
              max={stats.exhibitors_paid + stats.exhibitors_unpaid}
            />
          </div>
        </div>
      )}

      <p className="font-body text-xs text-muted mt-8">
        Revenue totals and trends over time aren't wired up yet — this reuses
        the same stats endpoint as Overview, just broken out visually. Say the
        word if you want real revenue figures (₦) or time-series charts next.
      </p>
    </div>
  );
}
