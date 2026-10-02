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

function naira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString()}`;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "teal" | "gold" | "red";
}) {
  const color =
    accent === "teal" ? "text-teal" : accent === "red" ? "text-red" : "text-gold";
  return (
    <div className="border border-ink-raised rounded-sm px-5 py-4">
      <p className="font-body text-xs uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`mt-1 font-display text-2xl ${color}`}>{value}</p>
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
        A closer look at registrations, payments, and today's event activity.
      </p>

      {loading && <p className="font-body text-sm text-muted">Loading…</p>}
      {error && <p className="font-body text-sm text-red">{error}</p>}

      {stats && (
        <>
          {/* NEW: Revenue */}
          <div className="border border-ink-raised rounded-sm p-6 mb-6">
            <h2 className="font-body text-sm text-muted-on-paper mb-4">
              Revenue collected
            </h2>
            <p className="font-display text-4xl text-gold mb-5">
              {naira(stats.revenue_kobo_total)}
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard
                label="Attendees"
                value={naira(stats.revenue_kobo_by_category.attendee || 0)}
              />
              <StatCard
                label="Exhibitors"
                value={naira(stats.revenue_kobo_by_category.exhibitor || 0)}
              />
              <StatCard
                label="Pitchers"
                value={naira(stats.revenue_kobo_by_category.pitcher || 0)}
              />
            </div>
          </div>

          {/* NEW: Today's check-ins */}
          <div className="border border-ink-raised rounded-sm p-6 mb-6">
            <h2 className="font-body text-sm text-muted-on-paper mb-4">
              Today's check-ins
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <StatCard
                label="Checked in today"
                value={stats.today_checked_in}
                accent="teal"
              />
              <StatCard
                label="Duplicate scans today"
                value={stats.today_duplicate_scans}
                accent="gold"
              />
            </div>
            <p className="font-body text-xs text-muted mt-4">
              Full breakdown by name and time is on the{" "}
              <a href="/admin/scan-log" className="text-teal hover:underline">
                Scan log
              </a>{" "}
              page.
            </p>
          </div>

          {/* Existing — unchanged */}
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

            {/* NEW — filled a gap: Pitcher payments existed in the data
                but had no card here before, same as Attendee/Exhibitor */}
            <div className="border border-ink-raised rounded-sm p-6">
              <h2 className="font-body text-sm text-muted-on-paper mb-4">
                Pitcher payments
              </h2>
              <Bar
                label="Paid"
                value={stats.pitchers_paid}
                max={stats.pitchers_paid + stats.pitchers_unpaid}
              />
              <Bar
                label="Unpaid"
                value={stats.pitchers_unpaid}
                max={stats.pitchers_paid + stats.pitchers_unpaid}
              />
            </div>
          </div>

          <p className="font-body text-xs text-muted mt-8">
            Site traffic (visits, pages, social clicks) isn't tracked yet —
            that needs a separate analytics layer and is a bigger, separate
            piece of work. Revenue and today's check-ins above are now real
            figures, pulled live from payments and the scan log.
          </p>
        </>
      )}
    </div>
  );
}
