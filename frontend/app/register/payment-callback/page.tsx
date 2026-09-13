"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type VerifyStatus = "verifying" | "confirmed" | "failed" | "error";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Paystack appends "reference" (and sometimes "trxref") to the
    // callback_url after payment — this is what we verify against.
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found in the URL.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference_number: reference }),
        });

        const data = await res.json();

        if (res.ok && data.status === "confirmed") {
          setStatus("confirmed");
          setMessage(data.message);
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment could not be confirmed.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong while confirming your payment.");
      }
    }

    verify();
  }, [searchParams]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
      <div className="tricolor-rule mx-auto mb-6">
        <span /><span /><span />
      </div>

      {status === "verifying" && (
        <>
          <h1 className="font-display text-3xl text-cream sm:text-4xl">Confirming Payment</h1>
          <p className="mt-4 text-muted">Please wait a moment while we confirm your payment with Paystack...</p>
        </>
      )}

      {status === "confirmed" && (
        <>
          <h1 className="font-display text-3xl text-cream sm:text-4xl">Payment Confirmed</h1>
          <div className="mt-8 rounded-2xl border border-teal/30 bg-ink-raised px-8 py-10">
            <p className="text-muted">{message}</p>
            <p className="mt-4 text-muted">
              A confirmation email is on its way — keep an eye on your inbox for your reference number.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/"
              className="rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
            >
              Back to homepage
            </Link>
          </div>
        </>
      )}

      {(status === "failed" || status === "error") && (
        <>
          <h1 className="font-display text-3xl text-cream sm:text-4xl">Payment Not Confirmed</h1>
          <div className="mt-8 rounded-2xl border border-red/30 bg-ink-raised px-8 py-10">
            <p className="text-muted">{message}</p>
            <p className="mt-4 text-muted">
              If you completed payment and are seeing this, check your status using the reference
              number from your email — it may just need a moment to sync.
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register/lookup"
              className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
            >
              Check Status
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
            >
              Back to homepage
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
