// app/admin/(dashboard)/overview/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getStats, ApiError, type StatsResponse } from "../../../../lib/admin/api";

export default function OverviewPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load stats.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="font-display text-3xl text-cream mb-8">Overview</h1>

      {loading && <p className="font-body text-sm text-muted">Loading…</p>}
      {error && <p className="font-body text-sm text-red">{error}</p>}

      {stats && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard label="Total registrants" value={stats.total_registrants} />
            <StatCard
              label="Attendees paid"
              value={`${stats.attendees_paid} / ${
                stats.attendees_paid + stats.attendees_unpaid
              }`}
            />
            <StatCard
              label="Exhibitors paid"
              value={`${stats.exhibitors_paid} / ${
                stats.exhibitors_paid + stats.exhibitors_unpaid
              }`}
            />
            <StatCard
              label="Pending review"
              value={stats.by_status["pending"] || 0}
            />
          </section>

          <section className="grid md:grid-cols-2 gap-6">
            <div className="border border-ink-raised rounded-sm p-5">
              <h2 className="font-body text-sm text-muted-on-paper mb-4">
                By category
              </h2>
              <dl className="space-y-2">
                {Object.entries(stats.by_category).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="font-body text-sm text-cream capitalize">
                      {key}
                    </dt>
                    <dd className="font-body text-sm text-muted">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border border-ink-raised rounded-sm p-5">
              <h2 className="font-body text-sm text-muted-on-paper mb-4">
                By status
              </h2>
              <dl className="space-y-2">
                {Object.entries(stats.by_status).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="font-body text-sm text-cream capitalize">
                      {key.replace("_", " ")}
                    </dt>
                    <dd className="font-body text-sm text-muted">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-ink-raised rounded-sm p-4">
      <p className="font-display text-2xl text-cream">{value}</p>
      <p className="font-body text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
