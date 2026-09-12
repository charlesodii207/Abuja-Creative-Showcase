"use client";

import { useState } from "react";
import Link from "next/link";

type TicketType = "general" | "vip";

export default function AttendeeNewRegistrationPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    ticket_type: "general" as TicketType,
    wants_masterclass: false,
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

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

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <div className="tricolor-rule mx-auto mb-6">
          <span /><span /><span />
        </div>
        <h1 className="font-display text-3xl text-cream sm:text-4xl">
          Almost there
        </h1>
        <div className="mt-8 rounded-2xl border border-teal/30 bg-ink-raised px-8 py-10">
          <p className="text-muted">
            Check your email at
          </p>
          <p className="mt-2 font-display text-xl text-teal">{form.email}</p>
          <p className="mt-4 text-muted">
            for your reference number, then use it to proceed with payment.
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register/lookup"
            className="rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            Proceed to Payment
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
          >
            Back to homepage
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
        Fill in your details to get your reference number.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border border-teal/20 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10">
        <div className="space-y-6">
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

          <div>
            <label className="block text-sm text-muted">Ticket Type</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(["general", "vip"] as TicketType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, ticket_type: type })}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                    form.ticket_type === type
                      ? "border-teal bg-teal/10 text-teal"
                      : "border-white/10 text-muted hover:border-white/30"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.wants_masterclass}
              onChange={(e) => setForm({ ...form, wants_masterclass: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-ink accent-teal"
            />
            Add a Masterclass Pass
          </label>

          {status === "error" && (
            <p className="text-sm text-red">Something went wrong — please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105 disabled:opacity-50"
          >
            {status === "submitting" ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
    </main>
  );
}
