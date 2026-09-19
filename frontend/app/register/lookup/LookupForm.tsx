"use client";

import { useState } from "react";
import Link from "next/link";

interface LookupResult {
  full_name: string;
  category: string;
  status: string;
  reference_number: string;
}

export default function LookupForm() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<LookupResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference_number: referenceNumber,
          }),
        }
      );

      if (!res.ok) throw new Error("Not found");

      const data: LookupResult = await res.json();

      setResult(data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function statusMessage(s: string, category: string) {
    if (s === "pending") {
      return "Your application is still under review.";
    }

    if (s === "approved" && category === "exhibitor") {
      return "You're approved! Payment is not yet open — we'll notify you when it is.";
    }

    if (s === "approved") {
      return "You're approved! No further action is needed on your end.";
    }

    if (s === "rejected") {
      return "We're unable to offer you a spot this time. Thank you for applying.";
    }

    return "";
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
            Registration Portal
          </p>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
            Check Your Status
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
            Enter the reference number we emailed you to view your application
            status.
          </p>
        </div>

        {status === "success" && result ? (
          <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-[#00A5A8]/25 bg-[#151A3A] px-6 py-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:px-10 sm:py-12">
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
            />

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00A5A8]" />
            </div>

            <p className="mt-5 text-sm text-[#B8B3AA]/65">
              Hi {result.full_name},
            </p>

            <p className="mt-3 font-display text-2xl capitalize text-[#F5EFE6] sm:text-3xl">
              {result.category}{" "}
              <span className="text-[#00A5A8]">
                — {result.status}
              </span>
            </p>

            <div className="mx-auto mt-5 h-px w-16 bg-[#00A5A8]/40" />

            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#B8B3AA]/70">
              {statusMessage(result.status, result.category)}
            </p>

            <div className="mx-auto mt-7 max-w-sm rounded-xl border border-white/10 bg-[#11152F]/60 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#B8B3AA]/45">
                Reference Number
              </p>

              <p className="mt-1 font-mono text-sm font-medium tracking-wide text-[#F5EFE6]/80">
                {result.reference_number}
              </p>
            </div>

            <button
              onClick={() => {
                setStatus("idle");
                setResult(null);
                setReferenceNumber("");
              }}
              className="mt-8 rounded-full border border-white/15 bg-[#11152F]/40 px-6 py-3 text-sm font-medium text-[#F5EFE6]/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00A5A8]/40 hover:text-[#F5EFE6]"
            >
              Check Another Reference Number
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.16)] sm:px-8 sm:py-10"
          >
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
            />

            <div className="space-y-6">
              <div>
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
              </div>

              {status === "error" && (
                <div className="rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-4 py-3">
                  <p className="text-sm text-[#F5EFE6]/80">
                    No matching registration found. Check your reference
                    number and try again.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-full bg-[#00A5A8] px-7 py-4 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "submitting" ? "Checking..." : "Check Status"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-10 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-white/10" />

          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/35 transition-colors hover:text-[#F5EFE6]/70"
          >
            Back to Homepage
          </Link>

          <span className="h-px w-10 bg-white/10" />
        </div>
      </div>
    </main>
  );
}