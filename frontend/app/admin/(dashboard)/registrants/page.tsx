// app/admin/(dashboard)/registrants/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listRegistrants,
  ApiError,
  type RegistrantSummary,
} from "../../../../lib/admin/api";
import RegistrantDetailPanel from "../../../components/admin/RegistrantDetailPanel";

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

export default function RegistrantsPage() {
  const router = useRouter();
  const [registrants, setRegistrants] = useState<RegistrantSummary[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRegistrants(
        activeTab ? { category: activeTab } : undefined
      );
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
  }, [activeTab, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = registrants.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.reference_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="font-display text-3xl text-cream mb-8">Registrants</h1>

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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No registrants found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
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

      <RegistrantDetailPanel
        referenceNumber={selectedRef}
        onClose={() => setSelectedRef(null)}
        onChanged={loadData}
      />
    </div>
  );
}
