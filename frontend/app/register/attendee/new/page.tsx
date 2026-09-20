"use client";

import { useState } from "react";
import Link from "next/link";

type TicketType = "general" | "vip" | "masterclass";

const TIERS: {
  value: TicketType;
  label: string;
  price: string;
  blurb: string;
}[] = [
  {
    value: "general",
    label: "General",
    price: "₦5,000",
    blurb:
      "Full access to the Showcase — screenings, performances, and the Creative Market.",
  },
  {
    value: "vip",
    label: "VIP",
    price: "₦10,000",
    blurb:
      "Everything General includes, plus priority seating and VIP-only areas.",
  },
  {
    value: "masterclass",
    label: "Masterclass",
    price: "₦25,000",
    blurb:
      "Everything VIP includes, plus full access to all masterclasses and workshops.",
  },
];

export default function AttendeeNewRegistrationPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    ticket_type: "general" as TicketType,
  });

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const [confirmation, setConfirmation] = useState<{
    amount_kobo: number;
    email: string;
  } | null>(null);

  const selectedTier = TIERS.find((t) => t.value === form.ticket_type)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register/attendee`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
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

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] px-6 py-12 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:px-10 sm:py-14">
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
              />

              <div className="mx-auto max-w-2xl text-center">
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
                  Your {selectedTier.label} ticket registration has been
                  received. To confirm your place at ACS, continue through
                  registration verification.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[#E59200]/20 bg-[#11152F]/60 px-6 py-6 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B8B3AA]/45">
                      Ticket
                    </p>

                    <p className="mt-2 font-display text-2xl text-[#F5EFE6]">
                      {selectedTier.label}
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
            Join the Showcase
          </p>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl md:text-6xl">
            Attendee Registration
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
            Choose your experience, then tell us who you are. After
            registration, you&apos;ll receive your reference number by email.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] shadow-[0_30px_80px_rgba(0,0,0,0.16)]"
        >
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
          />

          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#00A5A8]">
                    Step 01
                  </p>

                  <h2 className="mt-2 font-display text-2xl text-[#F5EFE6] sm:text-3xl">
                    Choose your ticket
                  </h2>
                </div>

                <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[#F5EFE6]/25 sm:block">
                  Your experience
                </span>
              </div>

              <div className="mt-7 space-y-3">
                {TIERS.map((tier, index) => {
                  const isSelected = form.ticket_type === tier.value;

                  return (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, ticket_type: tier.value })
                      }
                      className={`group relative flex w-full flex-col items-start overflow-hidden rounded-[1.25rem] border p-5 text-left transition-all duration-300 ${
                        isSelected
                          ? "border-[#00A5A8]/50 bg-[#00A5A8]/10 shadow-[0_15px_40px_rgba(0,165,168,0.07)]"
                          : "border-white/10 bg-[#11152F]/40 hover:border-white/20 hover:bg-[#11152F]/65"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-0 h-full w-1 bg-[#00A5A8]" />
                      )}

                      <div className="flex w-full items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold ${
                              isSelected
                                ? "border-[#00A5A8]/40 text-[#00A5A8]"
                                : "border-white/10 text-[#F5EFE6]/25"
                            }`}
                          >
                            0{index + 1}
                          </span>

                          <span
                            className={`text-base font-medium ${
                              isSelected
                                ? "text-[#F5EFE6]"
                                : "text-[#F5EFE6]/80"
                            }`}
                          >
                            {tier.label}
                          </span>
                        </div>

                        <span
                          className={`font-display text-xl ${
                            isSelected
                              ? "text-[#E59200]"
                              : "text-[#B8B3AA]/65"
                          }`}
                        >
                          {tier.price}
                        </span>
                      </div>

                      <span className="mt-4 pl-11 text-sm leading-relaxed text-[#B8B3AA]/60">
                        {tier.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl border border-[#E59200]/20 bg-[#11152F]/60 px-5 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#B8B3AA]/45">
                    Amount due
                  </p>

                  <p className="mt-1 font-display text-2xl text-[#E59200]">
                    {selectedTier.price}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#E59200]" />

                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#F5EFE6]/30">
                    Selected
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#11152F]/30 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#00A5A8]">
                  Step 02
                </p>

                <h2 className="mt-2 font-display text-2xl text-[#F5EFE6] sm:text-3xl">
                  Your details
                </h2>
              </div>

              <div className="mt-7 space-y-5">
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

                {status === "error" && (
                  <div className="rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-4 py-3">
                    <p className="text-sm leading-relaxed text-[#F5EFE6]/80">
                      Something went wrong — please check your details and try
                      again.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full rounded-full bg-[#00A5A8] px-7 py-4 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "submitting"
                    ? "Registering..."
                    : "Complete Registration →"}
                </button>

                <p className="text-center text-[10px] leading-relaxed tracking-wide text-[#F5EFE6]/25">
                  After registration, check your email for your reference
                  number and continue through verification.
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