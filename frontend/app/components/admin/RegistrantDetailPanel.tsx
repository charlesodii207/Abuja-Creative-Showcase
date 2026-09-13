// components/admin/RegistrantDetailPanel.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getRegistrantDetail,
  editRegistrant,
  approveRegistrant,
  rejectRegistrant,
  markRegistrantPaid,
  resendRegistrantEmail,
  ApiError,
  type RegistrantDetail,
} from "../../../lib/admin/api";

const PAID_CATEGORIES = new Set(["attendee", "exhibitor", "pitcher"]);

const FIELD_LABELS: Record<string, string> = {
  ticket_type: "Ticket type",
  is_paid: "Paid",
  amount_kobo: "Amount",
  paystack_reference: "Paystack reference",
  pending_upgrade_ticket_type: "Pending upgrade",
  pending_upgrade_reference: "Pending upgrade reference",
  company_name: "Company",
  category: "Category",
  what_bringing: "What they're bringing",
  portfolio_url: "Portfolio",
  goal: "Goal",
  exhibit_type: "Exhibit type",
  booth_size: "Booth size",
  auction_item_description: "Auction item",
  auction_quantity: "Auction quantity",
  outlet_name: "Outlet",
  proof_type: "Proof type",
  proof_url: "Proof",
  project_name: "Project",
  pitch_summary: "Pitch summary",
  work_sample_url: "Work sample",
  organization_name: "Organization",
  investment_interest: "Investment interest",
  budget_range: "Budget range",
};

const HIDDEN_FIELDS = new Set(["id", "registrant_id", "wants_masterclass"]);

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "amount_kobo" && typeof value === "number") {
    return `₦${(value / 100).toLocaleString()}`;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function isLink(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

const STATUS_STYLES: Record<string, string> = {
  pending: "text-gold",
  awaiting_payment: "text-gold",
  approved: "text-teal",
  confirmed: "text-teal",
  rejected: "text-red",
};

export default function RegistrantDetailPanel({
  referenceNumber,
  onClose,
  onChanged,
}: {
  referenceNumber: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [registrant, setRegistrant] = useState<RegistrantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const isOpen = referenceNumber !== null;

  useEffect(() => {
    if (!referenceNumber) return;
    setLoading(true);
    setError(null);
    setActionMessage(null);
    setEditing(false);

    getRegistrantDetail(referenceNumber)
      .then((data) => {
        setRegistrant(data);
        setEditName(data.full_name);
        setEditEmail(data.email);
        setEditPhone(data.phone);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load this registrant.");
      })
      .finally(() => setLoading(false));
  }, [referenceNumber]);

  async function refresh() {
    if (!referenceNumber) return;
    const data = await getRegistrantDetail(referenceNumber);
    setRegistrant(data);
  }

  async function runAction(
    action: string,
    fn: () => Promise<{ message: string }>
  ) {
    setActionLoading(action);
    setActionMessage(null);
    setError(null);
    try {
      const result = await fn();
      setActionMessage(result.message);
      await refresh();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveEdit() {
    if (!referenceNumber) return;
    await runAction("edit", () =>
      editRegistrant(referenceNumber, {
        full_name: editName,
        email: editEmail,
        phone: editPhone,
      })
    );
    setEditing(false);
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-ink/70 transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-ink border-l border-ink-raised z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {registrant && (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-body text-xs text-muted uppercase tracking-wide mb-1">
                  {registrant.category}
                </p>
                <h2 className="font-display text-2xl text-cream">
                  {registrant.full_name}
                </h2>
                <p className="font-body text-sm text-muted mt-1">
                  {registrant.reference_number}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted hover:text-cream font-body text-xl leading-none px-2 focus:outline-none focus:ring-2 focus:ring-gold rounded-sm"
              >
                ×
              </button>
            </div>

            <p
              className={`font-body text-sm mb-6 ${
                STATUS_STYLES[registrant.status] || "text-cream"
              }`}
            >
              Status: {registrant.status.replace("_", " ")}
            </p>

            {actionMessage && (
              <p className="font-body text-sm text-teal mb-4 border border-teal/30 bg-teal/10 rounded-sm px-3 py-2">
                {actionMessage}
              </p>
            )}
            {error && (
              <p className="font-body text-sm text-red mb-4 border border-red/30 bg-red/10 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            {/* Contact info + edit */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-body text-sm text-muted-on-paper">
                  Contact
                </h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="font-body text-xs text-gold hover:underline focus:outline-none"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-ink-raised border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Full name"
                  />
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-ink-raised border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Email"
                  />
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-ink-raised border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Phone"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={actionLoading === "edit"}
                      className="font-body text-xs bg-gold text-ink rounded-sm px-3 py-1.5 disabled:opacity-60"
                    >
                      {actionLoading === "edit" ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="font-body text-xs text-muted hover:text-cream px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="space-y-1.5 font-body text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Email</dt>
                    <dd className="text-cream text-right">{registrant.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Phone</dt>
                    <dd className="text-cream text-right">{registrant.phone}</dd>
                  </div>
                </dl>
              )}
            </section>

            {/* Category-specific details */}
            <section className="mb-6">
              <h3 className="font-body text-sm text-muted-on-paper mb-3">
                Application details
              </h3>
              <dl className="space-y-1.5 font-body text-sm">
                {Object.entries(registrant.details)
                  .filter(([key]) => !HIDDEN_FIELDS.has(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <dt className="text-muted">
                        {FIELD_LABELS[key] || key}
                      </dt>
                      <dd className="text-cream text-right break-all">
                        {isLink(value) ? (
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal hover:underline"
                          >
                            View link
                          </a>
                        ) : (
                          formatValue(key, value)
                        )}
                      </dd>
                    </div>
                  ))}
              </dl>
            </section>

            {/* Ticket / check-in */}
            {registrant.ticket && (
              <section className="mb-6">
                <h3 className="font-body text-sm text-muted-on-paper mb-3">
                  Ticket
                </h3>
                <dl className="space-y-1.5 font-body text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Ticket number</dt>
                    <dd className="text-cream">
                      {registrant.ticket.ticket_number || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Checked in</dt>
                    <dd className={registrant.ticket.checked_in ? "text-teal" : "text-cream"}>
                      {registrant.ticket.checked_in ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            {/* Actions */}
            <section className="border-t border-ink-raised pt-5 space-y-2">
              <div className="flex gap-2">
                {registrant.status !== "approved" && (
                  <button
                    onClick={() =>
                      runAction("approve", () =>
                        approveRegistrant(registrant.reference_number)
                      )
                    }
                    disabled={actionLoading !== null}
                    className="flex-1 font-body text-sm bg-teal text-ink rounded-sm py-2 disabled:opacity-60"
                  >
                    {actionLoading === "approve" ? "Approving…" : "Approve"}
                  </button>
                )}
                {registrant.status !== "rejected" && (
                  <button
                    onClick={() =>
                      runAction("reject", () =>
                        rejectRegistrant(registrant.reference_number)
                      )
                    }
                    disabled={actionLoading !== null}
                    className="flex-1 font-body text-sm border border-red text-red rounded-sm py-2 disabled:opacity-60"
                  >
                    {actionLoading === "reject" ? "Rejecting…" : "Reject"}
                  </button>
                )}
              </div>

              {PAID_CATEGORIES.has(registrant.category) &&
                registrant.details.is_paid !== true && (
                  <button
                    onClick={() =>
                      runAction("mark-paid", () =>
                        markRegistrantPaid(registrant.reference_number)
                      )
                    }
                    disabled={actionLoading !== null}
                    className="w-full font-body text-sm bg-gold text-ink rounded-sm py-2 disabled:opacity-60"
                  >
                    {actionLoading === "mark-paid"
                      ? "Marking as paid…"
                      : "Mark as paid (manual override)"}
                  </button>
                )}

              <button
                onClick={() =>
                  runAction("resend-email", () =>
                    resendRegistrantEmail(registrant.reference_number)
                  )
                }
                disabled={actionLoading !== null}
                className="w-full font-body text-sm text-muted-on-paper border border-ink-raised rounded-sm py-2 hover:text-cream disabled:opacity-60"
              >
                {actionLoading === "resend-email"
                  ? "Sending…"
                  : "Resend status email"}
              </button>
            </section>
          </div>
        )}

        {loading && (
          <div className="p-6">
            <p className="font-body text-sm text-muted">Loading…</p>
          </div>
        )}

        {!loading && error && !registrant && (
          <div className="p-6">
            <p className="font-body text-sm text-red">{error}</p>
          </div>
        )}
      </div>
    </>
  );
}
