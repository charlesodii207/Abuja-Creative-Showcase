"use client";

import { useState } from "react";
import Link from "next/link";

export default function ExhibitorRegistrationPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    category: "",
    what_bringing: "",
    portfolio_url: "",
    goal: "",
    booth_size: "",
    wants_auction: false,
    auction_item_description: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const payload = {
        ...form,
        // Don't send a stale description if the user unchecked the auction option
        auction_item_description: form.wants_auction ? form.auction_item_description : "",
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/exhibitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          Application Submitted
        </h1>
        <div className="mt-8 rounded-2xl border border-gold/30 bg-ink-raised px-8 py-10">
          <p className="text-muted">Check your email at</p>
          <p className="mt-2 font-display text-xl text-gold">{form.email}</p>
          <p className="mt-4 text-muted">
            for your reference number. Your application is pending review — applying does not guarantee a spot.
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register/lookup"
            className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            Check Status Later
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
        Exhibitor Application
      </h1>
      <p className="mt-3 text-muted">
        Showcase your creative business at the Creative Market. Applying does not guarantee a spot.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border border-gold/20 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-muted">Full Name</label>
            <input
              required
              type="text"
              placeholder="e.g. John Doe"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
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
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
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
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Company / Business Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Zaria Prints Studio"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Category</label>
            <input
              required
              type="text"
              placeholder="e.g. Fashion, Film, Music, Tech"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">What Are You Bringing?</label>
            <textarea
              rows={3}
              placeholder="Briefly describe your products, services, or what you'll showcase"
              value={form.what_bringing}
              onChange={(e) => setForm({ ...form, what_bringing: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Portfolio / Work Sample Link</label>
            <input
              type="url"
              placeholder="https://your-portfolio.com"
              value={form.portfolio_url}
              onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Your Goal at the Market</label>
            <input
              type="text"
              placeholder="e.g. Sell products, showcase work, network"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Booth Size</label>
            <select
              required
              value={form.booth_size}
              onChange={(e) => setForm({ ...form, booth_size: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-gold"
            >
              <option value="" disabled>
                Select a booth size
              </option>
              <option value="small">Small — ₦250,000</option>
              <option value="big">Big — ₦500,000</option>
            </select>
          </div>

          <div className="rounded-lg border border-white/10 bg-ink px-4 py-3">
            <label className="flex items-center gap-3 text-sm text-cream">
              <input
                type="checkbox"
                checked={form.wants_auction}
                onChange={(e) =>
                  setForm({
                    ...form,
                    wants_auction: e.target.checked,
                    // Clear any previously entered description if unchecked
                    auction_item_description: e.target.checked ? form.auction_item_description : "",
                  })
                }
                className="h-4 w-4 rounded border-white/20 bg-ink accent-gold"
              />
              Include an auction of my own items
            </label>

            {form.wants_auction && (
              <div className="mt-4">
                <label className="block text-sm text-muted">Auction Item Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the item(s) you'd like to auction"
                  value={form.auction_item_description}
                  onChange={(e) => setForm({ ...form, auction_item_description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
                />
              </div>
            )}
          </div>

          {status === "error" && (
            <p className="text-sm text-red">Something went wrong — please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105 disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </main>
  );
}
