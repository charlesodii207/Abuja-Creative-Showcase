"use client";

import { useState } from "react";
import Link from "next/link";

type Phase = "enter-ref" | "loading" | "unpaid" | "paid" | "error";

const UPGRADE_OPTIONS: Record<string, { value: string; label: string }[]> = {
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

  const [fullName, setFullName] = useState("");
  const [ticketType, setTicketType] = useState("");

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const [payAmount, setPayAmount] = useState<number | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  async function checkStatus(e: React.FormEvent) {
    e.preventDefault();
    setPhase("loading");
    setError("");
    setShowUpgrade(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/attendee/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_number: referenceNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "No matching registration found.");
        setPhase("error");
        return;
      }

      setFullName(data.full_name);
      setTicketType(data.ticket_type);
      setPhase(data.is_paid ? "paid" : "unpaid");
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("error");
    }
  }

  async function resumePayment() {
    setResuming(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/attendee/resume-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_number: referenceNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Could not start payment.");
        setResuming(false);
        return;
      }

      setPayAmount(data.amount_kobo);
      setPayUrl(data.paystack_authorization_url);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_number: referenceNumber, ticket_type: upgradeTier }),
      });
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
    <main className="mx-auto max-w-xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Check Status, Pay, or Upgrade
      </h1>
      <p className="mt-3 text-muted">
        Enter the reference number from your registration email.
      </p>

      <form
        onSubmit={checkStatus}
        className="mt-10 rounded-2xl border border-teal/20 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10"
      >
        <label className="block text-sm text-muted">Reference Number</label>
        <input
          required
          type="text"
          placeholder="e.g. ACS-7K2M9XQP"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
          className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-teal"
        />

        <button
          type="submit"
          disabled={phase === "loading"}
          className="mt-6 w-full rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105 disabled:opacity-50"
        >
          {phase === "loading" ? "Checking..." : "Check"}
        </button>
      </form>

      {phase === "error" && (
        <p className="mt-6 text-center text-sm text-red">{error}</p>
      )}

      {phase === "unpaid" && (
        <div className="mt-8 rounded-2xl border border-gold/30 bg-ink-raised px-8 py-10 text-center">
          <p className="text-muted">Hi {fullName},</p>
          <p className="mt-3 font-display text-xl text-cream">
            Attendee — <span className="capitalize text-gold">{ticketType}</span>
          </p>
          <p className="mt-4 text-muted">
            Your registration is still awaiting payment. Complete payment to secure your slot.
          </p>

          <button
            onClick={resumePayment}
            disabled={resuming}
            className="mt-6 w-full rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105 disabled:opacity-50"
          >
            {resuming ? "Starting payment..." : "Complete Payment & Secure Your Slot"}
          </button>

          {error && <p className="mt-4 text-sm text-red">{error}</p>}
        </div>
      )}

      {phase === "paid" && (
        <div className="mt-8 rounded-2xl border border-teal/30 bg-ink-raised px-8 py-10 text-center">
          <p className="text-muted">Hi {fullName},</p>
          <p className="mt-3 font-display text-xl text-cream">
            Attendee — <span className="capitalize text-teal">{ticketType}</span>{" "}
            <span className="text-teal">Confirmed</span>
          </p>

          {upgradeChoices.length > 0 && !showUpgrade && (
            <p className="mt-4 text-xs text-muted">
              Want to upgrade your status?{" "}
              <button
                onClick={() => setShowUpgrade(true)}
                className="underline underline-offset-4 hover:text-cream"
              >
                Click here
              </button>
            </p>
          )}

          {showUpgrade && (
            <div className="mt-6 rounded-xl border border-white/10 bg-ink px-5 py-6 text-left">
              <label className="block text-sm text-muted">Upgrade to</label>
              <select
                value={upgradeTier}
                onChange={(e) => setUpgradeTier(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-raised px-4 py-3 text-cream outline-none focus:border-teal"
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
                className="mt-4 w-full rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105 disabled:opacity-50"
              >
                {upgrading ? "Starting upgrade..." : "Upgrade & Pay Difference"}
              </button>

              {error && <p className="mt-3 text-sm text-red">{error}</p>}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-cream">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}