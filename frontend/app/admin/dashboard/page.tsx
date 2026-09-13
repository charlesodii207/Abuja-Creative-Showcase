// app/admin/dashboard/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStats,
  listRegistrants,
  getToken,
  getAdminProfile,
  logout,
  ApiError,
  type StatsResponse,
  type RegistrantSummary,
} from "../../../lib/admin/api";
import RegistrantDetailPanel from "../../components/admin/RegistrantDetailPanel";

const TABS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Attendees", value: "attendee" },
  { label: "Exhibitors", value: "exhibitor" },
  { label: "Press", value: "press" },
  { label: "Pitchers", value: "pitcher" },
  { label: "Investors", value: "investor" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "text-gold",
  awaiting_payment: "text-gold",
  approved: "text-teal",
  confirmed: "text-teal",
  rejected: "text-red",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminName, setAdminName] = useState("");

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [registrants, setRegistrants] = useState<RegistrantSummary[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    const profile = getAdminProfile();
    setAdminName(profile?.full_name || "Admin");
    setChecking(false);
  }, [router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, registrantsData] = await Promise.all([
        getStats(),
        listRegistrants(activeTab ? { category: activeTab } : undefined),
      ]);
      setStats(statsData);
      setRegistrants(registrantsData);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(
        err instanceof ApiError ? err.message : "Couldn't load the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, router]);

  useEffect(() => {
    if (!checking) loadData();
  }, [checking, loadData]);

  function handleLogout() {
    logout();
    router.replace("/admin/login");
  }

  const filteredRegistrants = registrants.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.reference_number.toLowerCase().includes(q)
    );
  });

  if (checking) return null;

  return (
    <main className="min-h-screen bg-ink">
      {/* Header */}
      <header className="border-b border-ink-raised px-6 py-5 flex items-center justify-between">
        <div>
          <div className="tricolor-rule mb-3">
            <span />
            <span />
            <span />
          </div>
          <h1 className="font-display text-2xl text-cream">
            Abuja Creative Showcase
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-body text-sm text-muted">{adminName}</span>
          <button
            onClick={handleLogout}
            className="font-body text-sm text-muted-on-paper hover:text-cream border border-ink-raised rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Stats */}
        {stats && (
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
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-ink-raised">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.value)}
              className={`font-body text-sm px-4 py-2.5 border-b-2 transition-colors focus:outline-none ${
                activeTab === tab.value
                  ? "border-gold text-cream"
                  : "border-transparent text-muted hover:text-cream"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or reference number"
            className="w-full max-w-sm bg-ink-raised border border-ink-raised rounded-sm px-4 py-2 font-body text-sm text-cream placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        {error && (
          <p className="font-body text-sm text-red mb-4 border border-red/30 bg-red/10 rounded-sm px-3 py-2">
            {error}
          </p>
        )}

        {/* Table */}
        <div className="border border-ink-raised rounded-sm overflow-hidden">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-ink-raised text-left">
                <th className="px-4 py-3 text-muted-on-paper font-medium">
                  Name
                </th>
                <th className="px-4 py-3 text-muted-on-paper font-medium hidden md:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-muted-on-paper font-medium">
                  Reference
                </th>
                <th className="px-4 py-3 text-muted-on-paper font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : filteredRegistrants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No registrants found.
                  </td>
                </tr>
              ) : (
                filteredRegistrants.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRef(r.reference_number)}
                    className="border-b border-ink-raised last:border-b-0 cursor-pointer hover:bg-ink-raised/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-cream">{r.full_name}</td>
                    <td className="px-4 py-3 text-muted hidden md:table-cell">
                      {r.email}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {r.reference_number}
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
      </div>

      <RegistrantDetailPanel
        referenceNumber={selectedRef}
        onClose={() => setSelectedRef(null)}
        onChanged={loadData}
      />
    </main>
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
