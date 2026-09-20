"use client";

import { useState } from "react";
import Link from "next/link";

export default function InvestorNewRegistrationPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    organization_name: "",
    investment_interest: "",
    budget_range: "",
    portfolio_url: "",
  });

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register/investor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Request failed");
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full border border-[#E59200]/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 bottom-20 h-44 w-44 rounded-full border border-[#00A5A8]/10"
        />

        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-20 sm:px-8 md:py-28">
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
                  Registration Received
                </p>

                <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
                  Thank You
                </h1>

                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
                  Your investor application has been received. Our team will
                  review your details and contact you with the next steps.
                </p>

                <div className="mx-auto mt-8 max-w-md rounded-[1.5rem] border border-[#00A5A8]/20 bg-[#11152F]/60 px-6 py-6 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B8B3AA]/45">
                    Confirmation Email
                  </p>

                  <p className="mt-2 break-all text-base font-medium text-[#F5EFE6]">
                    {form.email}
                  </p>

                  <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/65">
                    Check your email for your reference number. Keep it safe —
                    you&apos;ll need it to check your application status and
                    receive updates from ACS.
                  </p>
                </div>

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/register/lookup"
                    className="inline-flex items-center justify-center rounded-full bg-[#00A5A8] px-7 py-3.5 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)]"
                  >
                    Check Status
                    <span className="ml-3">→</span>
                  </Link>

                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-[#11152F]/40 px-7 py-3.5 text-sm font-medium text-[#F5EFE6]/80 transition-all duration-300 hover:border-[#00A5A8]/40 hover:text-[#F5EFE6]"
                  >
                    Back to Homepage
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
            Creative Finance & Deal Room
          </p>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
            Investor Registration
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
            Tell us about yourself, your organization, and the creative
            opportunities you are interested in exploring.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.16)] sm:px-8 sm:py-10"
        >
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
          />

          <div className="space-y-7">
            <div className="grid gap-6 sm:grid-cols-2">
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
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5EFE6]/75">
                  Organization Name
                </label>

                <input
                  required
                  type="text"
                  placeholder="Company or institution"
                  value={form.organization_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      organization_name: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
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
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
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
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F5EFE6]/75">
                Investment Interest
              </label>

              <textarea
                required
                rows={4}
                placeholder="Tell us about the creative sectors, projects, or opportunities you are interested in."
                value={form.investment_interest}
                onChange={(e) =>
                  setForm({
                    ...form,
                    investment_interest: e.target.value,
                  })
                }
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#11152F] px-4 py-3 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#F5EFE6]/75">
                  Budget Range
                </label>

                <select
                  required
                  value={form.budget_range}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      budget_range: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3 text-[#F5EFE6] outline-none transition-colors focus:border-[#00A5A8]/60"
                >
                  <option value="">Select a range</option>
                  <option value="under_10m">Under ₦10 million</option>
                  <option value="10m_50m">₦10 million – ₦50 million</option>
                  <option value="50m_100m">₦50 million – ₦100 million</option>
                  <option value="100m_500m">₦100 million – ₦500 million</option>
                  <option value="500m_plus">₦500 million+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5EFE6]/75">
                  Portfolio URL
                </label>

                <input
                  type="url"
                  placeholder="https://example.com"
                  value={form.portfolio_url}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      portfolio_url: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>
            </div>

            {status === "error" && (
              <div className="rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-4 py-3">
                <p className="text-sm text-[#F5EFE6]/80">
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
                ? "Submitting..."
                : "Submit Registration"}
            </button>
          </div>
        </form>

        <div className="mt-10 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-white/10" />

          <Link
            href="/register/investor"
            className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/35 transition-colors hover:text-[#F5EFE6]/70"
          >
            Back to Investor Registration
          </Link>

          <span className="h-px w-10 bg-white/10" />
        </div>
      </div>
    </main>
  );
}