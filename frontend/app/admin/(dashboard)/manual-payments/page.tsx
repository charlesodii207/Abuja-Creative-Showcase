// app/admin/(dashboard)/manual-payments/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listManualPayments,
  confirmManualPayment,
  rejectManualPayment,
  revokeManualPayment,
  ApiError,
  type ManualPayment,
  type ManualPaymentStatus,
} from "../../../../lib/admin/api";

const TABS: { key: ManualPaymentStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "rejected", label: "Rejected" },
  { key: "revoked", label: "Revoked" },
];

type ActionKind = "confirm" | "reject" | "revoke";

function timeAgo(iso: string | null | undefined) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function naira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function errorText(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function StatusBadge({ status }: { status: ManualPaymentStatus }) {
  const styles: Record<ManualPaymentStatus, string> = {
    pending: "border-gold text-gold",
    confirmed: "border-teal text-teal",
    rejected: "border-red text-red",
    revoked: "border-muted text-muted",
  };

  return (
    <span
      className={`inline-block font-body text-[10px] uppercase tracking-wide rounded-sm px-1.5 py-0.5 border whitespace-nowrap ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function ManualPaymentsPage() {
  const [tab, setTab] = useState<ManualPaymentStatus>("pending");
  const [items, setItems] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Which row has an action panel open, and which action.
  const [openId, setOpenId] = useState<string | null>(null);
  const [openAction, setOpenAction] = useState<ActionKind | null>(null);
  const [noteText, setNoteText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);

      try {
        const data = await listManualPayments(tab);
        setItems(data);
        setListError(null);
      } catch (err) {
        setListError(errorText(err, "Couldn't load manual payments."));
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    setOpenId(null);
    setOpenAction(null);
    setActionError(null);
    load(true);
  }, [load]);

  // New "I've paid" notices should show up without a refresh.
  useEffect(() => {
    if (tab !== "pending") return;

    const timer = setInterval(() => {
      // Don't refresh the list while an admin is in the middle of an action.
      if (openId === null && busyId === null) load(false);
    }, 30000);

    return () => clearInterval(timer);
  }, [tab, load, openId, busyId]);

  function openPanel(id: string, action: ActionKind) {
    setOpenId(id);
    setOpenAction(action);
    setNoteText("");
    setActionError(null);
  }

  function closePanel() {
    setOpenId(null);
    setOpenAction(null);
    setNoteText("");
    setActionError(null);
  }

  async function runAction(item: ManualPayment, action: ActionKind) {
    setBusyId(item.id);
    setActionError(null);

    try {
      const note = noteText.trim() || undefined;
      let result;

      if (action === "confirm") {
        result = await confirmManualPayment(item.id);
      } else if (action === "reject") {
        result = await rejectManualPayment(item.id, note);
      } else {
        result = await revokeManualPayment(item.id, note);
      }

      setNotice(result.message || "Done.");
      closePanel();
      await load(false);
    } catch (err) {
      setActionError(errorText(err, "That didn't work. Please try again."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="px-4 pt-4 pb-8 sm:px-8 sm:pt-8 max-w-4xl">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="font-display text-2xl sm:text-3xl text-cream">
          Manual payments
        </h1>
        <button
          type="button"
          onClick={() => load(true)}
          className="font-body text-xs rounded-sm px-3 py-1.5 border border-ink-raised text-muted hover:text-cream transition-colors"
        >
          Refresh
        </button>
      </div>

      <p className="font-body text-sm text-muted mb-4">
        Bank transfers people say they have made. Confirm only after you have
        seen the money in the account.
      </p>

      <div className="flex border border-ink-raised rounded-sm overflow-hidden w-fit max-w-full overflow-x-auto mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`font-body text-sm px-4 py-1.5 transition-colors ${
              tab === t.key
                ? "bg-gold text-ink"
                : "text-muted hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {notice && <p className="font-body text-sm text-teal mb-3">{notice}</p>}

      {loading ? (
        <p className="font-body text-sm text-muted">Loading…</p>
      ) : listError ? (
        <p className="font-body text-sm text-red">{listError}</p>
      ) : items.length === 0 ? (
        <div className="border border-ink-raised rounded-sm px-4 py-6">
          <p className="font-body text-sm text-muted">
            {tab === "pending"
              ? "Nothing waiting. New bank transfer notices will appear here."
              : `No ${tab} payments.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const isOpen = openId === item.id;
            const busy = busyId === item.id;

            return (
              <li
                key={item.id}
                className="border border-ink-raised rounded-sm px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-body text-sm text-cream">
                      {item.full_name}
                    </p>
                    <p className="font-body text-xs text-muted capitalize">
                      {item.category} · {item.reference_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg text-cream">
                      {naira(item.amount_kobo)}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                <p className="font-body text-xs text-muted mt-2 break-all">
                  {item.email}
                  {item.phone ? ` · ${item.phone}` : ""}
                </p>
                <p className="font-body text-xs text-muted mt-0.5">
                  Notice sent {timeAgo(item.created_at)}
                </p>

                {item.reviewed_at && (
                  <p className="font-body text-xs text-muted mt-0.5">
                    {item.status === "confirmed"
                      ? "Confirmed"
                      : item.status === "rejected"
                      ? "Rejected"
                      : "Revoked"}{" "}
                    {timeAgo(item.reviewed_at)}
                    {item.reviewed_by ? ` by ${item.reviewed_by}` : ""}
                  </p>
                )}

                {item.note && (
                  <p className="font-body text-xs text-cream/80 mt-1">
                    Note: {item.note}
                  </p>
                )}

                {/* Action buttons */}
                {!isOpen && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => openPanel(item.id, "confirm")}
                          className="font-body text-sm bg-gold text-ink rounded-sm px-4 py-1.5"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => openPanel(item.id, "reject")}
                          className="font-body text-sm rounded-sm px-4 py-1.5 border border-ink-raised text-muted hover:text-red transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {item.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => openPanel(item.id, "revoke")}
                        className="font-body text-sm rounded-sm px-4 py-1.5 border border-ink-raised text-muted hover:text-red transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                )}

                {/* Inline action panel */}
                {isOpen && openAction && (
                  <div className="mt-3 border-t border-ink-raised pt-3">
                    {openAction === "confirm" && (
                      <p className="font-body text-sm text-cream mb-3">
                        Have you seen {naira(item.amount_kobo)} from{" "}
                        {item.full_name} in the bank account? Confirming marks
                        them paid and emails their ticket.
                      </p>
                    )}

                    {openAction === "reject" && (
                      <>
                        <p className="font-body text-sm text-cream mb-2">
                          No matching payment found? {item.full_name} will be
                          emailed. Add a reason if you like (it is included in
                          the email).
                        </p>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder="Optional reason"
                          className="w-full bg-transparent border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream placeholder:text-muted mb-3"
                        />
                      </>
                    )}

                    {openAction === "revoke" && (
                      <>
                        <p className="font-body text-sm text-cream mb-1">
                          Undo this confirmation? {item.full_name} becomes
                          unpaid and their ticket stops working at the gate.
                        </p>
                        <p className="font-body text-xs text-muted mb-2">
                          No email is sent. If they did pay, contact them and
                          refund yourself.
                        </p>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder="Optional note (for the team)"
                          className="w-full bg-transparent border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream placeholder:text-muted mb-3"
                        />
                      </>
                    )}

                    {actionError && (
                      <p className="font-body text-xs text-red mb-2">
                        {actionError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runAction(item, openAction)}
                        className={`font-body text-sm rounded-sm px-4 py-1.5 disabled:opacity-60 ${
                          openAction === "confirm"
                            ? "bg-gold text-ink"
                            : "border border-red text-red"
                        }`}
                      >
                        {busy
                          ? "Working…"
                          : openAction === "confirm"
                          ? "Yes, confirm"
                          : openAction === "reject"
                          ? "Reject payment"
                          : "Revoke"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={closePanel}
                        className="font-body text-sm rounded-sm px-4 py-1.5 border border-ink-raised text-muted hover:text-cream transition-colors disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
