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

import ConfirmDialog from "./ConfirmDialog";

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

const HIDDEN_FIELDS = new Set([
  "id",
  "registrant_id",
  "wants_masterclass",
]);

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (key === "amount_kobo" && typeof value === "number") {
    return `₦${(value / 100).toLocaleString()}`;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function isLink(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^https?:\/\//.test(value)
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "text-gold",
  awaiting_payment: "text-gold",
  approved: "text-teal",
  confirmed: "text-teal",
  rejected: "text-red",
};

type ConfirmAction =
  | "approve"
  | "reject"
  | "mark-paid"
  | null;

export default function RegistrantDetailPanel({
  referenceNumber,
  onClose,
  onChanged,
}: {
  referenceNumber: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [registrant, setRegistrant] =
    useState<RegistrantDetail | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);
  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [confirmAction, setConfirmAction] =
    useState<ConfirmAction>(null);

  const isOpen = referenceNumber !== null;

  useEffect(() => {
    if (!referenceNumber) return;

    setLoading(true);
    setError(null);
    setActionMessage(null);
    setEditing(false);
    setConfirmAction(null);

    getRegistrantDetail(referenceNumber)
      .then((data) => {
        setRegistrant(data);
        setEditName(data.full_name);
        setEditEmail(data.email);
        setEditPhone(data.phone);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't load this registrant."
        );
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
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong."
      );
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

  async function handleConfirmAction() {
    if (!registrant || !confirmAction) return;

    const action = confirmAction;

    setConfirmAction(null);

    if (action === "approve") {
      await runAction("approve", () =>
        approveRegistrant(registrant.reference_number)
      );
      return;
    }

    if (action === "reject") {
      await runAction("reject", () =>
        rejectRegistrant(registrant.reference_number)
      );
      return;
    }

    if (action === "mark-paid") {
      await runAction("mark-paid", () =>
        markRegistrantPaid(registrant.reference_number)
      );
    }
  }

  function getConfirmDialog() {
    if (confirmAction === "approve") {
      return {
        title: "Approve Registration?",
        message:
          "Are you sure you want to approve this registration? The applicant will be notified of the status change.",
        confirmText: "Approve",
        variant: "default" as const,
      };
    }

    if (confirmAction === "reject") {
      return {
        title: "Reject Registration?",
        message:
          "Are you sure you want to reject this registration? Please confirm before continuing.",
        confirmText: "Reject",
        variant: "danger" as const,
      };
    }

    if (confirmAction === "mark-paid") {
      return {
        title: "Mark as Paid?",
        message:
          "This will manually mark the registration as paid. Use this only when the payment has been verified outside the normal payment flow.",
        confirmText: "Mark as Paid",
        variant: "warning" as const,
      };
    }

    return null;
  }

  const confirmDialog = getConfirmDialog();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/70 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform overflow-y-auto border-l border-ink-raised bg-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {registrant && (
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-1 font-body text-xs uppercase tracking-wide text-muted">
                  {registrant.category}
                </p>

                <h2 className="font-display text-2xl text-cream">
                  {registrant.full_name}
                </h2>

                <p className="mt-1 font-body text-sm text-muted">
                  {registrant.reference_number}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-sm px-2 text-xl leading-none text-muted hover:text-cream focus:outline-none focus:ring-2 focus:ring-gold"
              >
                ×
              </button>
            </div>

            <p
              className={`mb-6 font-body text-sm ${
                STATUS_STYLES[registrant.status] ||
                "text-cream"
              }`}
            >
              Status: {registrant.status.replace("_", " ")}
            </p>

            {actionMessage && (
              <p className="mb-4 rounded-sm border border-teal/30 bg-teal/10 px-3 py-2 font-body text-sm text-teal">
                {actionMessage}
              </p>
            )}

            {error && (
              <p className="mb-4 rounded-sm border border-red/30 bg-red/10 px-3 py-2 font-body text-sm text-red">
                {error}
              </p>
            )}

            <section className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-body text-sm text-muted-on-paper">
                  Contact
                </h3>

                {!editing && (
                  <button
                    type="button"
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
                    onChange={(e) =>
                      setEditName(e.target.value)
                    }
                    className="w-full rounded-sm border border-ink-raised bg-ink-raised px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Full name"
                  />

                  <input
                    value={editEmail}
                    onChange={(e) =>
                      setEditEmail(e.target.value)
                    }
                    className="w-full rounded-sm border border-ink-raised bg-ink-raised px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Email"
                  />

                  <input
                    value={editPhone}
                    onChange={(e) =>
                      setEditPhone(e.target.value)
                    }
                    className="w-full rounded-sm border border-ink-raised bg-ink-raised px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Phone"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={actionLoading === "edit"}
                      className="rounded-sm bg-gold px-3 py-1.5 font-body text-xs text-ink disabled:opacity-60"
                    >
                      {actionLoading === "edit"
                        ? "Saving…"
                        : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-3 py-1.5 font-body text-xs text-muted hover:text-cream"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="space-y-1.5 font-body text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Email</dt>
                    <dd className="text-right text-cream">
                      {registrant.email}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Phone</dt>
                    <dd className="text-right text-cream">
                      {registrant.phone}
                    </dd>
                  </div>
                </dl>
              )}
            </section>

            <section className="mb-6">
              <h3 className="mb-3 font-body text-sm text-muted-on-paper">
                Application details
              </h3>

              <dl className="space-y-1.5 font-body text-sm">
                {Object.entries(registrant.details)
                  .filter(
                    ([key]) => !HIDDEN_FIELDS.has(key)
                  )
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between gap-4"
                    >
                      <dt className="text-muted">
                        {FIELD_LABELS[key] || key}
                      </dt>

                      <dd className="break-all text-right text-cream">
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

            {registrant.ticket && (
              <section className="mb-6">
                <h3 className="mb-3 font-body text-sm text-muted-on-paper">
                  Ticket
                </h3>

                <dl className="space-y-1.5 font-body text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">
                      Ticket number
                    </dt>

                    <dd className="text-cream">
                      {registrant.ticket.ticket_number ||
                        "—"}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">
                      Checked in
                    </dt>

                    <dd
                      className={
                        registrant.ticket.checked_in
                          ? "text-teal"
                          : "text-cream"
                      }
                    >
                      {registrant.ticket.checked_in
                        ? "Yes"
                        : "No"}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            <section className="space-y-2 border-t border-ink-raised pt-5">
              <div className="flex gap-2">
                {registrant.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction("approve")
                    }
                    disabled={actionLoading !== null}
                    className="flex-1 rounded-sm bg-teal py-2 font-body text-sm text-ink disabled:opacity-60"
                  >
                    {actionLoading === "approve"
                      ? "Approving…"
                      : "Approve"}
                  </button>
                )}

                {registrant.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction("reject")
                    }
                    disabled={actionLoading !== null}
                    className="flex-1 rounded-sm border border-red py-2 font-body text-sm text-red disabled:opacity-60"
                  >
                    {actionLoading === "reject"
                      ? "Rejecting…"
                      : "Reject"}
                  </button>
                )}
              </div>

              {PAID_CATEGORIES.has(registrant.category) &&
                registrant.details.is_paid !== true && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction("mark-paid")
                    }
                    disabled={actionLoading !== null}
                    className="w-full rounded-sm bg-gold py-2 font-body text-sm text-ink disabled:opacity-60"
                  >
                    {actionLoading === "mark-paid"
                      ? "Marking as paid…"
                      : "Mark as paid (manual override)"}
                  </button>
                )}

              <button
                type="button"
                onClick={() =>
                  runAction("resend-email", () =>
                    resendRegistrantEmail(
                      registrant.reference_number
                    )
                  )
                }
                disabled={actionLoading !== null}
                className="w-full rounded-sm border border-ink-raised py-2 font-body text-sm text-muted-on-paper hover:text-cream disabled:opacity-60"
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
            <p className="font-body text-sm text-muted">
              Loading…
            </p>
          </div>
        )}

        {!loading && error && !registrant && (
          <div className="p-6">
            <p className="font-body text-sm text-red">
              {error}
            </p>
          </div>
        )}
      </div>

      {confirmDialog && (
        <ConfirmDialog
          open={confirmAction !== null}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText="Cancel"
          loading={actionLoading !== null}
          variant={confirmDialog.variant}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            if (actionLoading === null) {
              setConfirmAction(null);
            }
          }}
        />
      )}
    </>
  );
}