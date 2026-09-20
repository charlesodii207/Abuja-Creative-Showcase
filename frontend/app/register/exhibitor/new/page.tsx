"use client";

import { useState } from "react";
import Link from "next/link";

type ExhibitType = "booth" | "auction";
type BoothSize = "small" | "big";

const BOOTH_PRICES: Record<BoothSize, string> = {
  small: "₦250,000",
  big: "₦500,000",
};

const AUCTION_PRICE_PER_ITEM = 10000;

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
    auction_quantity: 1,
  });

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const [confirmation, setConfirmation] = useState<{
    amount_kobo: number;
    email: string;
  } | null>(null);

  const priceLabel =
    exhibitType === "booth"
      ? form.booth_size
        ? BOOTH_PRICES[form.booth_size as BoothSize]
        : null
      : exhibitType === "auction"
        ? `₦${(
            AUCTION_PRICE_PER_ITEM * form.auction_quantity
          ).toLocaleString()} (${form.auction_quantity} × ₦${AUCTION_PRICE_PER_ITEM.toLocaleString()})`
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
        auction_item_description:
          exhibitType === "auction"
            ? form.auction_item_description
            : null,
        auction_quantity:
          exhibitType === "auction" ? form.auction_quantity : null,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register/exhibitor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Registration failed");
      }

      setConfirmation({
        amount_kobo: data.amount_kobo,
        email: form.email,
      });

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success" && confirmation) {
    const amountNaira = (confirmation.amount_kobo / 100).toLocaleString();

    return (
      <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-16 h-72 w-72 rounded-full border border-[#E59200]/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-16 h-52 w-52 rounded-full border border-[#00A5A8]/10"
        />

        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-20 sm:px-8 md:py-28">
          <div className="relative w-full">
            <div
              aria-hidden="true"
              className="absolute -inset-5 rounded-[2rem] border border-white/[0.06] sm:-inset-8"
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] px-6 py-12 text-center shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:px-10 sm:py-14">
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
              />

              <div className="mx-auto max-w-2xl">
                <div className="tricolor-rule mx-auto mb-7">
                  <span />
                  <span />
                  <span />
                </div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
                  Registration Complete
                </p>

                <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
                  You&apos;re Almost There
                </h1>

                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
                  Your Creative Market registration has been received. To
                  confirm your participation at ACS, continue through
                  registration verification.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[#E59200]/20 bg-[#11152F]/60 px-6 py-6 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B8B3AA]/45">
                      Participation
                    </p>

                    <p className="mt-2 font-display text-2xl capitalize text-[#F5EFE6]">
                      {exhibitType === "booth"
                        ? `${form.booth_size} Booth`
                        : "Auction"}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-[#00A5A8]/20 bg-[#11152F]/60 px-6 py-6 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B8B3AA]/45">
                      Amount Due
                    </p>

                    <p className="mt-2 font-display text-2xl text-[#E59200]">
                      ₦{amountNaira}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#11152F]/40 px-6 py-6 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B8B3AA]/45">
                    Confirmation Email
                  </p>

                  <p className="mt-2 break-all font-mono text-sm text-[#F5EFE6]">
                    {confirmation.email}
                  </p>

                  <p className="mt-3 text-sm leading-relaxed text-[#B8B3AA]/65">
                    Check your email for your reference number. Keep it safe —
                    you&apos;ll need it to finish your registration, check your
                    status later, and confirm your payment.
                  </p>
                </div>

                <div className="mt-8">
                  <Link
                    href="/verify"
                    className="inline-flex items-center justify-center rounded-full bg-[#00A5A8] px-8 py-3.5 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)]"
                  >
                    Finish Registration
                    <span className="ml-3">→</span>
                  </Link>
                </div>

                <div className="mt-10 flex items-center justify-center gap-3">
                  <span className="h-px w-10 bg-white/10" />

                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/30">
                    Abuja · 04–05 December 2026
                  </span>

                  <span className="h-px w-10 bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!exhibitType) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-16 h-72 w-72 rounded-full border border-[#E59200]/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-16 h-52 w-52 rounded-full border border-[#00A5A8]/10"
        />

        <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8 md:py-28">
          <div className="text-center">
            <div className="tricolor-rule mx-auto mb-7">
              <span />
              <span />
              <span />
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
              Creative Market
            </p>

            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl md:text-6xl">
              Exhibit at ACS
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              Bring your work into the room. Choose how you want to participate
              in the Creative Market.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setExhibitType("booth")}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] p-7 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#E59200]/40 hover:shadow-[0_25px_60px_rgba(0,0,0,0.16)] sm:p-9"
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-1 w-0 bg-[#E59200] transition-all duration-500 group-hover:w-full"
              />

              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E59200]/30 bg-[#E59200]/10">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E59200]" />
                </div>

                <span className="text-[10px] font-semibold tracking-[0.2em] text-[#F5EFE6]/20">
                  01
                </span>
              </div>

              <div className="mt-12">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E59200]">
                  Creative Market
                </p>

                <h2 className="mt-2 font-display text-3xl text-[#F5EFE6]">
                  Buy a Booth
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/65">
                  Get a dedicated space to sell products, showcase your
                  business, and meet buyers, brands, and visitors directly.
                </p>

                <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#B8B3AA]/40">
                    From
                  </span>

                  <span className="font-display text-xl text-[#E59200]">
                    ₦250,000
                  </span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExhibitType("auction")}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] p-7 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#00A5A8]/40 hover:shadow-[0_25px_60px_rgba(0,0,0,0.16)] sm:p-9"
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-1 w-0 bg-[#00A5A8] transition-all duration-500 group-hover:w-full"
              />

              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00A5A8]" />
                </div>

                <span className="text-[10px] font-semibold tracking-[0.2em] text-[#F5EFE6]/20">
                  02
                </span>
              </div>

              <div className="mt-12">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00A5A8]">
                  Creative Market
                </p>

                <h2 className="mt-2 font-display text-3xl text-[#F5EFE6]">
                  Auction Your Work
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/65">
                  No booth needed. Put one or more pieces of art or fashion up
                  for auction at the Showcase.
                </p>

                <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#B8B3AA]/40">
                    Per item
                  </span>

                  <span className="font-display text-xl text-[#00A5A8]">
                    ₦10,000
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-white/10" />

            <Link
              href="/register/exhibitor"
              className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/30 transition-colors hover:text-[#F5EFE6]/70"
            >
              Back to Exhibitor Registration
            </Link>

            <span className="h-px w-10 bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-16 h-72 w-72 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-16 h-52 w-52 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8 md:py-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="tricolor-rule mb-7">
              <span />
              <span />
              <span />
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#00A5A8]">
              Creative Market · Step 02
            </p>

            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
              {exhibitType === "booth"
                ? "Book Your Booth"
                : "Auction Your Work"}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#B8B3AA]/70">
              {exhibitType === "booth"
                ? "Tell us about your business and choose the booth space that fits your showcase."
                : "Tell us about your work and the pieces you would like to place in the auction."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExhibitType(null)}
            className="hidden shrink-0 text-xs font-medium text-[#B8B3AA]/50 underline underline-offset-4 transition-colors hover:text-[#F5EFE6] sm:block"
          >
            Change
          </button>
        </div>

        <button
          type="button"
          onClick={() => setExhibitType(null)}
          className="mt-5 text-xs font-medium text-[#B8B3AA]/50 underline underline-offset-4 transition-colors hover:text-[#F5EFE6] sm:hidden"
        >
          Change participation type
        </button>

        <form
          onSubmit={handleSubmit}
          className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] shadow-[0_30px_80px_rgba(0,0,0,0.16)]"
        >
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
          />

          <div className="grid lg:grid-cols-[1fr_0.85fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00A5A8]">
                Your details
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#F5EFE6]/75">
                    Full Name
                  </label>

                  <input
                    required
                    type="text"
                    placeholder="e.g. John Doe"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F5EFE6]/75">
                    Company / Business Name
                  </label>

                  <input
                    required
                    type="text"
                    placeholder="e.g. Zaria Prints Studio"
                    value={form.company_name}
                    onChange={(e) =>
                      setForm({ ...form, company_name: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F5EFE6]/75">
                    Email
                  </label>

                  <input
                    required
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F5EFE6]/75">
                    Phone
                  </label>

                  <input
                    required
                    type="tel"
                    placeholder="080X XXX XXXX"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-[#F5EFE6]/75">
                  Category
                </label>

                <input
                  required
                  type="text"
                  placeholder="e.g. Fashion, Film, Music, Tech"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-[#F5EFE6]/75">
                  What Are You Bringing?
                </label>

                <textarea
                  required
                  rows={4}
                  placeholder="Briefly describe your products, services, or what you'll showcase."
                  value={form.what_bringing}
                  onChange={(e) =>
                    setForm({ ...form, what_bringing: e.target.value })
                  }
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-[#F5EFE6]/75">
                  Portfolio / Work Sample Link
                </label>

                <input
                  type="url"
                  placeholder="https://your-portfolio.com"
                  value={form.portfolio_url}
                  onChange={(e) =>
                    setForm({ ...form, portfolio_url: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-[#F5EFE6]/75">
                  Your Goal at the Market
                </label>

                <input
                  type="text"
                  placeholder="e.g. Sell products, showcase work, network"
                  value={form.goal}
                  onChange={(e) =>
                    setForm({ ...form, goal: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>

              {exhibitType === "booth" ? (
                <div className="mt-5">
                  <label className="block text-sm font-medium text-[#F5EFE6]/75">
                    Booth Size
                  </label>

                  <select
                    required
                    value={form.booth_size}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        booth_size: e.target.value as BoothSize,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] outline-none transition-colors focus:border-[#00A5A8]/60"
                  >
                    <option value="" disabled>
                      Select a booth size
                    </option>

                    <option value="small">Small — ₦250,000</option>
                    <option value="big">Big — ₦500,000</option>
                  </select>
                </div>
              ) : (
                <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_180px]">
                  <div>
                    <label className="block text-sm font-medium text-[#F5EFE6]/75">
                      Auction Item Description
                    </label>

                    <textarea
                      required
                      rows={3}
                      placeholder="Describe the item(s) you'd like to auction."
                      value={form.auction_item_description}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          auction_item_description: e.target.value,
                        })
                      }
                      className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#F5EFE6]/75">
                      Number of Items
                    </label>

                    <input
                      required
                      type="number"
                      min={1}
                      value={form.auction_quantity}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          auction_quantity: Math.max(
                            1,
                            Number(e.target.value)
                          ),
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] outline-none transition-colors focus:border-[#00A5A8]/60"
                    />

                    <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-[#B8B3AA]/40">
                      ₦10,000 per item
                    </p>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="mt-6 rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-4 py-3">
                  <p className="text-sm text-[#F5EFE6]/80">
                    Something went wrong — please check your details and try
                    again.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-7 w-full rounded-full bg-[#00A5A8] px-7 py-4 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "submitting"
                  ? "Submitting..."
                  : "Complete Registration →"}
              </button>
            </div>

            <div className="border-t border-white/10 bg-[#11152F]/30 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E59200]">
                Your selection
              </p>

              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#151A3A] p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#B8B3AA]/40">
                  Participation
                </p>

                <p className="mt-2 font-display text-2xl capitalize text-[#F5EFE6]">
                  {exhibitType === "booth"
                    ? `${form.booth_size || "Booth"}`
                    : "Auction"}
                </p>

                {exhibitType === "booth" && (
                  <p className="mt-2 text-sm text-[#B8B3AA]/60">
                    A dedicated Creative Market space for your business and
                    work.
                  </p>
                )}

                {exhibitType === "auction" && (
                  <p className="mt-2 text-sm text-[#B8B3AA]/60">
                    Your work will be submitted for auction at the Showcase.
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-[#E59200]/20 bg-[#11152F]/60 p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#B8B3AA]/40">
                  Amount Due
                </p>

                <p className="mt-2 font-display text-3xl text-[#E59200]">
                  {priceLabel || "Select your option"}
                </p>

                {!priceLabel && (
                  <p className="mt-2 text-xs leading-relaxed text-[#B8B3AA]/45">
                    Your amount will appear here once you select your booth
                    size.
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-xs leading-relaxed text-[#B8B3AA]/50">
                  After submitting your registration, check your email for
                  your reference number and continue through verification.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-10 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-white/10" />

          <span className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/30">
            Abuja · 04–05 December 2026
          </span>

          <span className="h-px w-10 bg-white/10" />
        </div>
      </div>
    </main>
  );
}