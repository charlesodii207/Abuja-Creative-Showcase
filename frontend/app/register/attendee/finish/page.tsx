"use client";

import { useState } from "react";
import Link from "next/link";

type Phase = "enter-ref" | "loading" | "unpaid" | "paid" | "rejected" | "error";

const UPGRADE_OPTIONS: Record<
  string,
  { value: string; label: string }[]
> = {
  general: [
    { value: "vip", label: "VIP" },
    { value: "masterclass", label: "Masterclass" },
  ],
  vip: [{ value: "masterclass", label: "Masterclass" }],
  masterclass: [],
};

export default function AttendeeFinishPage() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [phase, setPhase] = useState<Phase>("enter-ref");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [ticketType, setTicketType] = useState("");

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const [resuming, setResuming] = useState(false);

  async function checkStatus(e: React.FormEvent) {
    e.preventDefault();
    setPhase("loading");
    setError("");
    setShowUpgrade(false);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register/attendee/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference_number: referenceNumber,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "No matching registration found.");
        setPhase("error");
        return;
      }

      setFullName(data.full_name);
      setTicketType(data.ticket_type);
      setStatusMessage(data.message);

      // Status (rejected) always wins over is_paid — a registrant can
      // be paid and still rejected, pending a refund.
      if (data.status === "rejected") {
        setPhase("rejected");
      } else {
        setPhase(data.is_paid ? "paid" : "unpaid");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("error");
    }
  }

  async function resumePayment() {
    setResuming(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register/attendee/resume-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference_number: referenceNumber,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Could not start payment.");
        setResuming(false);
        return;
      }

      window.location.href = data.paystack_authorization_url;
    } catch {
      setError("Something went wrong starting payment.");
      setResuming(false);
    }
  }

  async function submitUpgrade() {
    if (!upgradeTier) return;

    setUpgrading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upgrade`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference_number: referenceNumber,
            ticket_type: upgradeTier,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Could not start upgrade.");
        setUpgrading(false);
        return;
      }

      window.location.href = data.paystack_authorization_url;
    } catch {
      setError("Something went wrong starting the upgrade.");
      setUpgrading(false);
    }
  }

  const upgradeChoices = UPGRADE_OPTIONS[ticketType] || [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
      {/* Editorial background details */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-20 h-44 w-44 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8 md:py-28">
        <div className="text-center">
          <div className="tricolor-rule mx-auto mb-7">
            <span />
            <span />
            <span />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
            Attendee Portal
          </p>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
            Check Status, Pay, or Upgrade
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
            Enter the reference number from your registration email.
          </p>
        </div>

        <form
          onSubmit={checkStatus}
          className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.16)] sm:px-8 sm:py-10"
        >
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
          />

          <label className="block text-sm font-medium text-[#F5EFE6]/75">
            Reference Number
          </label>

          <input
            required
            type="text"
            placeholder="e.g. ACS-7K2M9XQP"
            value={referenceNumber}
            onChange={(e) =>
              setReferenceNumber(e.target.value.toUpperCase())
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
          />

          <button
            type="submit"
            disabled={phase === "loading"}
            className="mt-6 w-full rounded-full bg-[#00A5A8] px-7 py-4 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === "loading" ? "Checking..." : "Check Status"}
          </button>
        </form>

        {phase === "error" && (
          <div className="mt-6 rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-5 py-4 text-center">
            <p className="text-sm text-[#F5EFE6]/80">{error}</p>
          </div>
        )}

        {phase === "rejected" && (
          <div className="mt-8 rounded-[2rem] border border-[#B80319]/25 bg-[#151A3A] px-6 py-9 text-center shadow-[0_25px_60px_rgba(0,0,0,0.14)] sm:px-8">
            <p className="text-sm text-[#B8B3AA]/65">Hi {fullName},</p>

            <p className="mt-3 font-display text-2xl text-[#F5EFE6]">
              Registration Status
            </p>

            <div className="mx-auto mt-5 h-px w-16 bg-[#B80319]/40" />

            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#B8B3AA]/70">
              {statusMessage ||
                "Your registration was not approved for this edition."}
            </p>
          </div>
        )}

        {phase === "unpaid" && (
          <div className="mt-8 rounded-[2rem] border border-[#E59200]/25 bg-[#151A3A] px-6 py-9 text-center shadow-[0_25px_60px_rgba(0,0,0,0.14)] sm:px-8">
            <p className="text-sm text-[#B8B3AA]/65">
              Hi {fullName},
            </p>

            <p className="mt-3 font-display text-2xl text-[#F5EFE6]">
              Attendee —{" "}
              <span className="capitalize text-[#E59200]">
                {ticketType}
              </span>
            </p>

            <div className="mx-auto mt-5 h-px w-16 bg-[#E59200]/40" />

            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#B8B3AA]/70">
              Your registration is still awaiting payment. Complete payment
              to secure your slot.
            </p>

            <button
              onClick={resumePayment}
              disabled={resuming}
              className="mt-7 w-full rounded-full bg-[#E59200] px-7 py-4 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(229,146,0,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resuming
                ? "Starting payment..."
                : "Complete Payment & Secure Your Slot"}
            </button>

            {error && (
              <p className="mt-4 text-sm text-[#B80319]">{error}</p>
            )}
          </div>
        )}

        {phase === "paid" && (
          <div className="mt-8 rounded-[2rem] border border-[#00A5A8]/25 bg-[#151A3A] px-6 py-9 text-center shadow-[0_25px_60px_rgba(0,0,0,0.14)] sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00A5A8]" />
            </div>

            <p className="mt-5 text-sm text-[#B8B3AA]/65">
              Hi {fullName},
            </p>

            <p className="mt-3 font-display text-2xl text-[#F5EFE6]">
              Attendee —{" "}
              <span className="capitalize text-[#00A5A8]">
                {ticketType}
              </span>
            </p>

            <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-[#00A5A8]">
              Confirmed
            </p>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#B8B3AA]/70">
              Your ticket has been sent to your email.
            </p>

            {upgradeChoices.length > 0 && !showUpgrade && (
              <p className="mt-6 text-xs text-[#B8B3AA]/60">
                Want to upgrade your status?{" "}
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="text-[#F5EFE6]/80 underline underline-offset-4 transition-colors hover:text-[#00A5A8]"
                >
                  Click here
                </button>
              </p>
            )}

            {showUpgrade && (
              <div className="mt-7 rounded-[1.25rem] border border-white/10 bg-[#11152F] px-5 py-6 text-left">
                <p className="text-sm font-medium text-[#F5EFE6]/75">
                  Upgrade your ticket
                </p>

                <p className="mt-2 text-xs leading-relaxed text-[#B8B3AA]/55">
                  Your ticket number and QR code stay the same — only your
                  access type changes. A new ticket will be emailed once
                  payment is confirmed.
                </p>

                <label className="mt-4 block text-xs uppercase tracking-[0.15em] text-[#B8B3AA]/50">
                  Upgrade to
                </label>

                <select
                  value={upgradeTier}
                  onChange={(e) => setUpgradeTier(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#151A3A] px-4 py-3 text-[#F5EFE6] outline-none transition-colors focus:border-[#00A5A8]/60"
                >
                  <option value="">Select a tier</option>

                  {upgradeChoices.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={submitUpgrade}
                  disabled={!upgradeTier || upgrading}
                  className="mt-4 w-full rounded-full bg-[#00A5A8] px-7 py-3.5 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,165,168,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {upgrading
                    ? "Starting upgrade..."
                    : "Upgrade & Pay Difference"}
                </button>

                {error && (
                  <p className="mt-3 text-sm text-[#B80319]">{error}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-white/10" />

          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/35 transition-colors hover:text-[#F5EFE6]/70"
          >
            Back to homepage
          </Link>

          <span className="h-px w-10 bg-white/10" />
        </div>
      </div>
    </main>
  );
}
