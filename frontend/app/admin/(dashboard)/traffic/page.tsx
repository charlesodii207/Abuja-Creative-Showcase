// app/admin/(dashboard)/traffic/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTraffic,
  ApiError,
  type TrafficResponse,
  type TrafficRange,
} from "../../../../lib/admin/api";

const SOCIAL = ["facebook", "instagram", "x", "linkedin", "tiktok", "whatsapp", "youtube"];

const RANGES: { value: TrafficRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between font-body text-sm mb-1">
        <span className="text-cream capitalize">{label.replace("_", " ")}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="h-2 bg-ink-raised rounded-full overflow-hidden">
        <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
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
      <p className="font-body text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl ${color}`}>{value}</p>
    </div>
  );
}

function maskIp(ip: string): string {
  if (ip.includes(":")) return ip.split(":").slice(0, 2).join(":") + ":••••";
  return ip.split(".").slice(0, 2).join(".") + ".•••.•••";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrafficPage() {
  const [range, setRange] = useState<TrafficRange>("7d");
  const [data, setData] = useState<TrafficResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [maskIps, setMaskIps] = useState(true);
  const [shown, setShown] = useState(20);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTraffic(range)
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load traffic data.")
      )
      .finally(() => setLoading(false));
  }, [range]);

  const visits = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.recent_visits.filter(
      (v) =>
        (sourceFilter === "all" || v.source === sourceFilter) &&
        (!q || `${v.ip} ${v.path} ${v.country ?? ""}`.toLowerCase().includes(q))
    );
  }, [data, sourceFilter, search]);

  const sources = data
    ? Object.entries(data.by_source).sort((a, b) => b[1] - a[1])
    : [];
  const topSocial = sources.find(([k]) => SOCIAL.includes(k));
  const maxSource = sources[0]?.[1] ?? 0;
  const maxPage = data?.top_pages[0]?.views ?? 0;

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-cream mb-2">Traffic</h1>
          <p className="font-body text-sm text-muted">
            Website visits, social clicks, and visitor IP addresses.
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                setRange(r.value);
                setShown(20);
              }}
              aria-pressed={range === r.value}
              className={`font-body text-sm px-3 py-1.5 rounded-sm border ${
                range === r.value
                  ? "bg-gold text-ink border-gold"
                  : "border-ink-raised text-muted hover:text-cream"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="font-body text-sm text-muted">Loading…</p>}
      {error && <p className="font-body text-sm text-red">{error}</p>}

      {data && !loading && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Page visits" value={data.total_visits.toLocaleString()} />
            <StatCard
              label="Unique visitors"
              value={data.unique_visitors.toLocaleString()}
              accent="teal"
            />
            <StatCard label="Social clicks" value={data.social_clicks.toLocaleString()} />
            <StatCard
              label="Top social source"
              value={topSocial ? topSocial[0] : "None yet"}
              accent="teal"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="border border-ink-raised rounded-sm p-6">
              <h2 className="font-body text-sm text-muted-on-paper mb-4">
                Where visitors come from
              </h2>
              {sources.length === 0 && (
                <p className="font-body text-sm text-muted">No visits in this period.</p>
              )}
              {sources.map(([key, value]) => (
                <Bar key={key} label={key} value={value} max={maxSource} />
              ))}
            </div>

            <div className="border border-ink-raised rounded-sm p-6">
              <h2 className="font-body text-sm text-muted-on-paper mb-4">Top pages</h2>
              {data.top_pages.length === 0 && (
                <p className="font-body text-sm text-muted">No visits in this period.</p>
              )}
              {data.top_pages.map((p) => (
                <Bar key={p.path} label={p.path} value={p.views} max={maxPage} />
              ))}
            </div>
          </div>

          <div className="border border-ink-raised rounded-sm p-6">
            <h2 className="font-body text-sm text-muted-on-paper mb-4">Visitor log</h2>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShown(20);
                }}
                placeholder="Search IP, page or country"
                aria-label="Search visitor log"
                className="font-body text-sm bg-transparent border border-ink-raised rounded-sm px-3 py-1.5 text-cream placeholder:text-muted"
              />
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setShown(20);
                }}
                aria-label="Filter by source"
                className="font-body text-sm bg-ink border border-ink-raised rounded-sm px-3 py-1.5 text-cream"
              >
                <option value="all">All sources</option>
                {sources.map(([key]) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 font-body text-sm text-muted">
                <input
                  type="checkbox"
                  checked={maskIps}
                  onChange={(e) => setMaskIps(e.target.checked)}
                />
                Mask IP addresses
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-2 pr-4 font-normal">Time</th>
                    <th className="py-2 pr-4 font-normal">IP address</th>
                    <th className="py-2 pr-4 font-normal">Page</th>
                    <th className="py-2 pr-4 font-normal">Source</th>
                    <th className="py-2 pr-4 font-normal hidden sm:table-cell">Country</th>
                    <th className="py-2 font-normal hidden sm:table-cell">Device</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.slice(0, shown).map((v) => (
                    <tr key={v.id} className="border-t border-ink-raised text-cream">
                      <td className="py-2 pr-4 whitespace-nowrap text-muted">
                        {formatTime(v.created_at)}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {maskIps ? maskIp(v.ip) : v.ip}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">{v.path}</td>
                      <td className="py-2 pr-4 whitespace-nowrap capitalize text-teal">
                        {v.source}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap hidden sm:table-cell">{v.country ?? "—"}</td>
                      <td className="py-2 whitespace-nowrap capitalize hidden sm:table-cell">{v.device ?? "—"}</td>
                    </tr>
                  ))}
                  {visits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-muted">
                        No visits match these filters. Clear the search or pick another source.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {visits.length > shown && (
              <button
                type="button"
                onClick={() => setShown((n) => n + 20)}
                className="mt-4 font-body text-sm text-teal hover:underline"
              >
                Show more
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
