"use client";

import { useState } from "react";
import Link from "next/link";

type TicketType = "general" | "vip" | "masterclass";

const TIERS: { value: TicketType; label: string; price: string; blurb: string }[] = [
  {
    value: "general",
    label: "General",
    price: "₦5,000",
    blurb: "Full access to the Showcase — screenings, performances, and the Creative Market.",
  },
  {
    value: "vip",
    label: "VIP",
    price: "₦10,000",
    blurb: "Everything General includes, plus priority seating and VIP-only areas.",
  },
  {
    value: "masterclass",
    label: "Masterclass",
    price: "₦25,000",
    blurb: "Everything VIP includes, plus full access to all masterclasses and workshops.",
  },
];

export default function AttendeeNewRegistrationPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    ticket_type: "general" as TicketType,
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [payment, setPayment] = useState<{ amount_kobo: number; authorization_url: string } | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");

  const selectedTier = TIERS.find((t) => t.value === form.ticket_type)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/attendee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setReferenceNumber(data.reference_number);
      setPayment({
        amount_kobo: data.amount_kobo,
        authorization_url: data.paystack_authorization_url,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success" && payment) {
    const amountNaira = (payment.amount_kobo / 100).toLocaleString();
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <div className="tricolor-rule mx-auto mb-6">
          <span /><span /><span />
        </div>
        <h1 className="font-display text-3xl text-cream sm:text-4xl">
          Complete Your Payment
        </h1>
        <div className="mt-8 rounded-2xl border border-teal/30 bg-ink-raised px-8 py-10">
          <p className="text-muted">Reference number</p>
          <p className="mt-2 font-display text-xl text-teal">{referenceNumber}</p>
          <p className="mt-4 text-muted">
            Your {selectedTier.label} ticket is reserved but not yet confirmed. Complete payment of
          </p>
          <p className="mt-1 font-display text-2xl text-cream">₦{amountNaira}</p>
          <p className="mt-4 text-muted">
            to confirm it — you&apos;ll receive an email once payment is received.
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={payment.authorization_url}
            className="rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            Complete Payment
          </a>
          <Link
            href="/register/lookup"
            className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
          >
            Check Status Later
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Attendee Registration
      </h1>
      <p className="mt-3 text-muted">
        Choose your ticket and fill in your details to get your reference number.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border border-teal/20 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-muted">Ticket</label>
            <div className="mt-2 space-y-3">
              {TIERS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setForm({ ...form, ticket_type: tier.value })}
                  className={`flex w-full flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors ${
                    form.ticket_type === tier.value
                      ? "border-teal bg-teal/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        form.ticket_type === tier.value ? "text-teal" : "text-cream"
                      }`}
                    >
                      {tier.label}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        form.ticket_type === tier.value ? "text-teal" : "text-muted"
                      }`}
                    >
                      {tier.price}
                    </span>
                  </div>
                  <span className="mt-1 text-xs text-muted">{tier.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted">Full Name</label>
            <input
              required
              type="text"
              placeholder="e.g. John Doe"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Email</label>
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Phone</label>
            <input
              required
              type="tel"
              placeholder="080X XXX XXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-teal"
            />
          </div>

          <div className="rounded-lg border border-teal/30 bg-ink px-4 py-3 text-center">
            <p className="text-xs text-muted">Amount due</p>
            <p className="font-display text-lg text-teal">{selectedTier.price}</p>
          </div>

          {status === "error" && (
            <p className="text-sm text-red">Something went wrong — please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105 disabled:opacity-50"
          >
            {status === "submitting" ? "Registering..." : "Continue to Payment"}
          </button>
        </div>
      </form>
    </main>
  );
}
