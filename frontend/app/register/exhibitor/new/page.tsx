"use client";

import { useState } from "react";
import Link from "next/link";

type ExhibitType = "booth" | "auction";
type BoothSize = "small" | "big";

const BOOTH_PRICES: Record<BoothSize, string> = {
  small: "₦250,000",
  big: "₦500,000",
};

const AUCTION_PRICE = "₦10,000";

export default function ExhibitorRegistrationPage() {
  const [exhibitType, setExhibitType] = useState<ExhibitType | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    category: "",
    what_bringing: "",
    portfolio_url: "",
    goal: "",
    booth_size: "" as BoothSize | "",
    auction_item_description: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [payment, setPayment] = useState<{ amount_kobo: number; authorization_url: string } | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");

  const priceLabel =
    exhibitType === "booth"
      ? form.booth_size
        ? BOOTH_PRICES[form.booth_size as BoothSize]
        : null
      : exhibitType === "auction"
      ? AUCTION_PRICE
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        company_name: form.company_name,
        category: form.category,
        what_bringing: form.what_bringing,
        portfolio_url: form.portfolio_url,
        goal: form.goal,
        exhibit_type: exhibitType,
        booth_size: exhibitType === "booth" ? form.booth_size : null,
        auction_item_description: exhibitType === "auction" ? form.auction_item_description : null,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/exhibitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // --- Success / payment step ---
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
        <div className="mt-8 rounded-2xl border border-gold/30 bg-ink-raised px-8 py-10">
          <p className="text-muted">Reference number</p>
          <p className="mt-2 font-display text-xl text-gold">{referenceNumber}</p>
          <p className="mt-4 text-muted">
            Your spot is reserved but not yet confirmed. Complete payment of
          </p>
          <p className="mt-1 font-display text-2xl text-cream">₦{amountNaira}</p>
          <p className="mt-4 text-muted">
            to secure it — you&apos;ll receive an email confirmation once payment is received.
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={payment.authorization_url}
            className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
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

  // --- Step 1: choose booth vs auction ---
  if (!exhibitType) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <div className="tricolor-rule mx-auto mb-6">
          <span /><span /><span />
        </div>
        <h1 className="font-display text-3xl text-cream sm:text-4xl">
          Exhibit at ACS
        </h1>
        <p className="mt-3 text-muted">
          Choose how you&apos;d like to take part in the Creative Market.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setExhibitType("booth")}
            className="flex flex-col items-start rounded-2xl border border-white/10 bg-ink-raised px-6 py-8 text-left transition-colors hover:border-gold/40"
          >
            <p className="font-display text-xl text-cream">Buy a Booth</p>
            <p className="mt-3 text-sm text-muted">
              A dedicated space at the Creative Market to sell products, showcase your
              business, and meet buyers and brands directly.
            </p>
            <p className="mt-4 text-xs text-gold">Small ₦250,000 · Big ₦500,000</p>
          </button>

          <button
            type="button"
            onClick={() => setExhibitType("auction")}
            className="flex flex-col items-start rounded-2xl border border-white/10 bg-ink-raised px-6 py-8 text-left transition-colors hover:border-gold/40"
          >
            <p className="font-display text-xl text-cream">Auction Your Work</p>
            <p className="mt-3 text-sm text-muted">
              No booth needed — put a single piece of art or fashion up for auction at
              the Showcase instead.
            </p>
            <p className="mt-4 text-xs text-gold">₦10,000 per item</p>
          </button>
        </div>
      </main>
    );
  }

  // --- Step 2: the actual form, once a path is chosen ---
  return (
    <main className="mx-auto max-w-xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-cream sm:text-4xl">
          {exhibitType === "booth" ? "Book Your Booth" : "Auction Your Work"}
        </h1>
        <button
          type="button"
          onClick={() => setExhibitType(null)}
          className="text-sm text-muted underline underline-offset-4 hover:text-cream"
        >
          Change
        </button>
      </div>
      <p className="mt-3 text-muted">
        Fill in your details below to reserve your spot.
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

          {exhibitType === "booth" ? (
            <div>
              <label className="block text-sm text-muted">Booth Size</label>
              <select
                required
                value={form.booth_size}
                onChange={(e) => setForm({ ...form, booth_size: e.target.value as BoothSize })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-gold"
              >
                <option value="" disabled>
                  Select a booth size
                </option>
                <option value="small">Small — ₦250,000</option>
                <option value="big">Big — ₦500,000</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-muted">Auction Item Description</label>
              <textarea
                required
                rows={3}
                placeholder="Describe the item you'd like to auction"
                value={form.auction_item_description}
                onChange={(e) => setForm({ ...form, auction_item_description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
              />
            </div>
          )}

          {priceLabel && (
            <div className="rounded-lg border border-gold/30 bg-ink px-4 py-3 text-center">
              <p className="text-xs text-muted">Amount due</p>
              <p className="font-display text-lg text-gold">{priceLabel}</p>
            </div>
          )}

          {status === "error" && (
            <p className="text-sm text-red">Something went wrong — please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105 disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Continue to Payment"}
          </button>
        </div>
      </form>
    </main>
  );
}
