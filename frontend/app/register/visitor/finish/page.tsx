"use client";

import { useState } from "react";
import Link from "next/link";

interface LookupResult {
  full_name: string;
  category: string;
  status: string;
  reference_number: string;
}

export default function FinishRegistrationPage() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [result, setResult] = useState<LookupResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_number: referenceNumber }),
      });

      if (!res.ok) throw new Error("Not found");

      const data: LookupResult = await res.json();
      setResult(data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Finish Registration
      </h1>
      <p className="mt-3 text-muted">
        Enter the reference number we emailed you to continue.
      </p>

      {status === "success" && result ? (
        <div className="mt-10 rounded-2xl border border-teal/30 bg-ink-raised px-8 py-10 text-center">
          <p className="text-muted">Hi {result.full_name},</p>
          <p className="mt-4 text-muted">
            Payment is not yet open — we&apos;ll notify you when it is.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border border-teal/20 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-muted">Reference Number</label>
              <input
                required
                type="text"
                placeholder="e.g. ACS-7K2M9XQP"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-teal"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red">
                No matching registration found. Check your reference number.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105 disabled:opacity-50"
            >
              {status === "submitting" ? "Checking..." : "Proceed to Payment"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-cream">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}