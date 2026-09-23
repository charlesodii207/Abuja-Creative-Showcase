"use client";

import { useState } from "react";
import Link from "next/link";

export default function PressRegistrationPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    outlet_name: "",
    proof_type: "",
    proof_url: "",
  });

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register/press`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
                  Press Accreditation
                </p>

                <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
                  Application Received
                </h1>

                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
                  Thank you for applying. A member of our team will reach out
                  to you.
                </p>

                <div className="mt-8 rounded-[1.5rem] border border-[#00A5A8]/20 bg-[#11152F]/60 px-6 py-6 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B8B3AA]/45">
                    Confirmation Email
                  </p>

                  <p className="mt-2 break-all text-base font-medium text-[#F5EFE6]">
                    {form.email}
                  </p>

                  <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/65">
                    Check your email for your reference number. Keep it safe —
                    you&apos;ll need it to check your accreditation status and
                    receive updates from ACS.
                  </p>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#11152F]/40 px-6 py-5">
                  <p className="text-sm leading-relaxed text-[#B8B3AA]/65">
                    Submitting an application does not guarantee accreditation.
                    Each application is reviewed by the ACS team.
                  </p>
                </div>

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/register/lookup"
                    className="inline-flex items-center justify-center rounded-full bg-[#00A5A8] px-8 py-3.5 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)]"
                  >
                    Check Application Status
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
            Media & Press Centre
          </p>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl md:text-6xl">
            Press Accreditation
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
            Cover the Showcase, access the Media & Press Centre, and connect
            with the people and stories shaping Africa&apos;s creative
            ecosystem.
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

          <div className="grid lg:grid-cols-[1fr_0.8fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00A5A8]">
                Accreditation Details
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
                    Outlet Name
                  </label>

                  <input
                    required
                    type="text"
                    placeholder="e.g. The Cable, Pulse Nigeria"
                    value={form.outlet_name}
                    onChange={(e) =>
                      setForm({ ...form, outlet_name: e.target.value })
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
                  Proof of Editorial Role
                </label>

                <input
                  type="text"
                  placeholder="e.g. Byline, Staff ID, Publication Link"
                  value={form.proof_type}
                  onChange={(e) =>
                    setForm({ ...form, proof_type: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-[#F5EFE6]/75">
                  Link to Proof
                </label>

                <input
                  type="url"
                  placeholder="https://link-to-your-article-or-profile.com"
                  value={form.proof_url}
                  onChange={(e) =>
                    setForm({ ...form, proof_url: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60"
                />
              </div>

              {status === "error" && (
                <div className="mt-6 rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-4 py-3">
                  <p className="text-sm leading-relaxed text-[#F5EFE6]/80">
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
                  : "Submit Application →"}
              </button>
            </div>

            <div className="border-t border-white/10 bg-[#11152F]/30 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E59200]">
                Media Access
              </p>

              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#151A3A] p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#B8B3AA]/40">
                  Accreditation
                </p>

                <p className="mt-2 font-display text-2xl text-[#F5EFE6]">
                  Media & Press
                </p>

                <p className="mt-3 text-sm leading-relaxed text-[#B8B3AA]/60">
                  Apply for access to cover the Showcase and its programme.
                </p>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-[#E59200]/20 bg-[#11152F]/60 p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#B8B3AA]/40">
                  Important
                </p>

                <p className="mt-2 text-sm leading-relaxed text-[#B8B3AA]/65">
                  Accreditation is subject to review. Submitting an application
                  does not guarantee press access.
                </p>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[#151A3A] p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#B8B3AA]/40">
                  Useful to include
                </p>

                <ul className="mt-4 space-y-3 text-sm text-[#B8B3AA]/65">
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00A5A8]" />
                    Your publication or outlet
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E59200]" />
                    Evidence of your editorial role
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B80319]" />
                    A published work or profile link
                  </li>
                </ul>
              </div>

              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-xs leading-relaxed text-[#B8B3AA]/50">
                  Once submitted, your application will be reviewed. Your
                  reference number will be sent to your email.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-10 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-white/10" />

          <Link
            href="/register/press"
            className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/30 transition-colors hover:text-[#F5EFE6]/70"
          >
            Back to Press Registration
          </Link>

          <span className="h-px w-10 bg-white/10" />
        </div>
      </div>
    </main>
  );
}
