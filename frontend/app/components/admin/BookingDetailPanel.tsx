"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  getBookingDetail,
  markBookingContacted,
  confirmBooking,
  cancelBooking,
  resendBookingConfirmation,
  getAdminProfile,
  ApiError,
  type BookingDetail,
} from "../../../lib/admin/api";
import { prettyDate, watDate } from "../../../lib/admin/dates";

import ConfirmDialog from "./ConfirmDialog";

const STATUS_STYLES: Record<string, string> = {
  new: "text-gold",
  contacted: "text-cream",
  confirmed: "text-teal",
  cancelled: "text-red",
};

function naira(kobo: number | null): string {
  if (kobo === null || kobo === undefined) return "—";
  return `₦${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words text-right text-cream">{value || "—"}</dd>
    </div>
  );
}

const inputClass =
  "w-full rounded-sm border border-ink-raised bg-ink-raised px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold";

export default function BookingDetailPanel({
  referenceNumber,
  onClose,
  onChanged,
}: {
  referenceNumber: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [hotelName, setHotelName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [amountNaira, setAmountNaira] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);

  // Shown (read-only) on the form: whoever is signed in is the operator.
  const [operatorName, setOperatorName] = useState("");
  useEffect(() => {
    setOperatorName(getAdminProfile()?.full_name ?? "");
  }, []);

  const isOpen = referenceNumber !== null;

  useEffect(() => {
    if (!referenceNumber) return;

    setLoading(true);
    setError(null);
    setActionMessage(null);
    setShowConfirmForm(false);
    setCancelOpen(false);

    getBookingDetail(referenceNumber)
      .then(setBooking)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Couldn't load this booking."
        )
      )
      .finally(() => setLoading(false));
  }, [referenceNumber]);

  async function refresh() {
    if (!referenceNumber) return;
    setBooking(await getBookingDetail(referenceNumber));
  }

  // Returns true when the action worked.
  async function run(
    action: string,
    fn: () => Promise<{ message: string }>
  ): Promise<boolean> {
    setActionLoading(action);
    setActionMessage(null);
    setError(null);

    try {
      const result = await fn();
      setActionMessage(result.message);
      await refresh();
      onChanged();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      return false;
    } finally {
      setActionLoading(null);
    }
  }

  function openConfirmForm() {
    if (!booking) return;
    // Start from what the guest asked for; the admin finalizes it.
    setHotelName(booking.hotel_preference ?? "");
    setCheckIn(booking.check_in ?? "");
    setCheckOut(booking.check_out ?? "");
    setAmountNaira("");
    setNotes("");
    setFormError(null);
    setShowConfirmForm(true);
  }

  async function handleConfirmSubmit(e: FormEvent) {
    e.preventDefault();
    if (!booking) return;
    setFormError(null);

    const amount = Number(amountNaira);

    if (!hotelName.trim()) return setFormError("Enter the hotel name.");
    if (!checkIn || !checkOut) return setFormError("Choose the check-in and check-out dates.");
    if (checkOut <= checkIn) return setFormError("Check-out must be after check-in.");
    if (!Number.isFinite(amount) || amount <= 0)
      return setFormError("Enter the amount paid in naira.");

    const ok = await run("confirm", () =>
      confirmBooking(booking.reference_number, {
        hotel_name: hotelName.trim(),
        check_in: checkIn,
        check_out: checkOut,
        amount_paid_kobo: Math.round(amount * 100),
        notes: notes.trim() || undefined,
      })
    );

    if (ok) setShowConfirmForm(false);
  }

  async function handleCancel() {
    if (!booking) return;
    setCancelOpen(false);
    await run("cancel", () => cancelBooking(booking.reference_number));
  }

  const canProgress = booking && (booking.status === "new" || booking.status === "contacted");

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/70 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
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
        {booking && (
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div className="min-w-0">
                <p className="mb-1 font-body text-xs uppercase tracking-wide text-muted">
                  Booking
                </p>
                <h2 className="font-display text-2xl text-cream break-words">
                  {booking.full_name}
                </h2>
                <p className="mt-1 font-body text-sm text-muted">
                  {booking.reference_number}
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
              className={`mb-6 font-body text-sm capitalize ${
                STATUS_STYLES[booking.status] || "text-cream"
              }`}
            >
              Status: {booking.status}
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
              <h3 className="mb-3 font-body text-sm text-muted-on-paper">Contact</h3>
              <dl className="space-y-1.5 font-body text-sm">
                <Row label="Email" value={booking.email} />
                <Row label="Phone" value={booking.phone} />
              </dl>
            </section>

            <section className="mb-6">
              <h3 className="mb-3 font-body text-sm text-muted-on-paper">
                What the guest asked for
              </h3>
              <dl className="space-y-1.5 font-body text-sm">
                <Row
                  label="Check-in"
                  value={booking.check_in ? prettyDate(booking.check_in) : null}
                />
                <Row
                  label="Check-out"
                  value={booking.check_out ? prettyDate(booking.check_out) : null}
                />
                <Row
                  label="Guests"
                  value={booking.guests ? String(booking.guests) : null}
                />
                <Row label="Hotel preference" value={booking.hotel_preference} />
                {Object.entries(booking.extra || {}).map(([key, value]) => (
                  <Row
                    key={key}
                    label={key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}
                    value={value}
                  />
                ))}
                <Row label="Message" value={booking.message} />
                <Row
                  label="Received"
                  value={booking.created_at ? prettyDate(watDate(booking.created_at)) : null}
                />
              </dl>
            </section>

            {booking.status === "confirmed" && (
              <section className="mb-6">
                <h3 className="mb-3 font-body text-sm text-muted-on-paper">
                  Confirmed arrangement
                </h3>
                <dl className="space-y-1.5 font-body text-sm">
                  <Row label="Hotel" value={booking.hotel_name} />
                  <Row
                    label="Check-in"
                    value={booking.confirmed_check_in ? prettyDate(booking.confirmed_check_in) : null}
                  />
                  <Row
                    label="Check-out"
                    value={booking.confirmed_check_out ? prettyDate(booking.confirmed_check_out) : null}
                  />
                  <Row label="Amount paid" value={naira(booking.amount_paid_kobo)} />
                  <Row label="Handled by" value={booking.operator_name} />
                  <Row
                    label="Confirmed"
                    value={booking.confirmed_at ? prettyDate(watDate(booking.confirmed_at)) : null}
                  />
                  <Row label="Notes" value={booking.confirmation_notes} />
                </dl>
              </section>
            )}

            {booking.status === "cancelled" && (
              <section className="mb-6">
                <h3 className="mb-3 font-body text-sm text-muted-on-paper">Cancelled</h3>
                <dl className="space-y-1.5 font-body text-sm">
                  <Row label="Cancelled by" value={booking.cancelled_by_name} />
                  <Row
                    label="Date"
                    value={booking.cancelled_at ? prettyDate(watDate(booking.cancelled_at)) : null}
                  />
                </dl>
              </section>
            )}

            {/* Confirmation form: required before a booking can be confirmed */}
            {showConfirmForm && (
              <form
                onSubmit={handleConfirmSubmit}
                className="mb-6 space-y-3 rounded-sm border border-gold/40 p-4"
              >
                <h3 className="font-body text-sm text-cream">Confirm this booking</h3>
                <p className="font-body text-xs text-muted">
                  These details are saved on the booking and emailed to the team
                  and to the guest.
                </p>

                <div>
                  <label className="mb-1 block font-body text-xs text-muted">
                    Hotel name
                  </label>
                  <input
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-body text-xs text-muted">
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-body text-xs text-muted">
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-body text-xs text-muted">
                    Amount paid (₦)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={amountNaira}
                    onChange={(e) => setAmountNaira(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block font-body text-xs text-muted">
                    Operator
                  </label>
                  <input
                    value={operatorName}
                    readOnly
                    className={`${inputClass} opacity-70`}
                  />
                  <p className="mt-1 font-body text-xs text-muted">
                    Filled in automatically from the account you're signed in with.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block font-body text-xs text-muted">
                    Notes (optional, not sent to the guest)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {formError && (
                  <p className="font-body text-sm text-red">{formError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading !== null}
                    className="flex-1 rounded-sm bg-teal py-2 font-body text-sm text-ink disabled:opacity-60"
                  >
                    {actionLoading === "confirm" ? "Confirming…" : "Confirm and send emails"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmForm(false)}
                    disabled={actionLoading !== null}
                    className="px-3 py-2 font-body text-sm text-muted hover:text-cream"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Actions */}
            {!showConfirmForm && (
              <section className="space-y-2 border-t border-ink-raised pt-5">
                {canProgress && (
                  <button
                    type="button"
                    onClick={openConfirmForm}
                    disabled={actionLoading !== null}
                    className="w-full rounded-sm bg-teal py-2 font-body text-sm text-ink disabled:opacity-60"
                  >
                    Confirm booking…
                  </button>
                )}

                {booking.status === "new" && (
                  <button
                    type="button"
                    onClick={() =>
                      run("contacted", () => markBookingContacted(booking.reference_number))
                    }
                    disabled={actionLoading !== null}
                    className="w-full rounded-sm border border-ink-raised py-2 font-body text-sm text-muted-on-paper hover:text-cream disabled:opacity-60"
                  >
                    {actionLoading === "contacted" ? "Saving…" : "Mark as contacted"}
                  </button>
                )}

                {booking.status === "confirmed" && (
                  <button
                    type="button"
                    onClick={() =>
                      run("resend", () => resendBookingConfirmation(booking.reference_number))
                    }
                    disabled={actionLoading !== null}
                    className="w-full rounded-sm border border-ink-raised py-2 font-body text-sm text-muted-on-paper hover:text-cream disabled:opacity-60"
                  >
                    {actionLoading === "resend" ? "Sending…" : "Resend confirmation emails"}
                  </button>
                )}

                {booking.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    disabled={actionLoading !== null}
                    className="w-full rounded-sm border border-red py-2 font-body text-sm text-red disabled:opacity-60"
                  >
                    {actionLoading === "cancel" ? "Cancelling…" : "Cancel booking"}
                  </button>
                )}
              </section>
            )}
          </div>
        )}

        {loading && (
          <div className="p-6">
            <p className="font-body text-sm text-muted">Loading…</p>
          </div>
        )}

        {!loading && error && !booking && (
          <div className="p-6">
            <p className="font-body text-sm text-red">{error}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this booking?"
        message={
          booking?.status === "confirmed"
            ? "This booking was already confirmed. Cancelling it won't refund anything automatically, so check whether a refund is due."
            : "Are you sure you want to cancel this booking?"
        }
        confirmText="Cancel booking"
        cancelText="Keep it"
        loading={actionLoading !== null}
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </>
  );
}
