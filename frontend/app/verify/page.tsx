"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Action =
  | "payment_required"
  | "under_review"
  | "approved"
  | "confirmed"
  | "rejected";

type RegistrationStatus = {
  reference_number: string;
  full_name: string;
  category: string;
  status: string;
  action: Action;
  message: string;
  amount_kobo: number | null;
  ticket_number: string | null;
};

type PageState = "idle" | "loading" | "ready" | "error" | "paying";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function formatNaira(amountKobo: number | null) {
  if (amountKobo === null) return "";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amountKobo / 100);
}

function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function VerifyPage() {
  const searchParams = useSearchParams();

  const [pageState, setPageState] = useState<PageState>("idle");
  const [registration, setRegistration] =
    useState<RegistrationStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [referenceInput, setReferenceInput] = useState("");

  const reference = searchParams.get("ref")?.trim() || "";

  const paymentReference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    "";

  async function loadStatus(referenceNumber: string) {
    if (!referenceNumber) return;

    try {
      setPageState("loading");
      setErrorMessage("");
      setRegistration(null);

      const response = await fetch(
        `${API_URL}/payments/status?ref=${encodeURIComponent(
          referenceNumber
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "We could not find that registration."
        );
      }

      setRegistration(data);
      setPageState("ready");
    } catch (error) {
      setPageState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while checking your registration."
      );
    }
  }

  useEffect(() => {
    if (!reference) {
      setPageState("idle");
      setRegistration(null);
      setErrorMessage("");
      return;
    }

    setReferenceInput(reference);
    loadStatus(reference);
  }, [reference]);

  useEffect(() => {
    if (!paymentReference || !reference) return;

    async function verifyReturnedPayment() {
      try {
        setPageState("paying");
        setErrorMessage("");

        const response = await fetch(`${API_URL}/payments/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reference_number: paymentReference,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== "confirmed") {
          throw new Error(
            data?.message || "Payment could not be confirmed."
          );
        }

        await loadStatus(reference);
      } catch (error) {
        setPageState("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong while confirming your payment."
        );
      }
    }

    verifyReturnedPayment();
  }, [paymentReference, reference]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedReference = referenceInput.trim().toUpperCase();

    if (!cleanedReference) {
      setPageState("error");
      setErrorMessage("Please enter your ACS registration reference.");
      return;
    }

    const params = new URLSearchParams();
    params.set("ref", cleanedReference);

    window.location.href = `/verify?${params.toString()}`;
  }

  function startAnotherLookup() {
    setRegistration(null);
    setErrorMessage("");
    setReferenceInput("");
    setPageState("idle");

    window.history.replaceState({}, "", "/verify");
  }

  async function continueToPayment() {
    if (!reference || !registration) return;

    try {
      setPageState("paying");
      setErrorMessage("");

      const response = await fetch(`${API_URL}/payments/resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference_number: reference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "We could not start your payment."
        );
      }

      if (!data.paystack_authorization_url) {
        throw new Error("Paystack did not return a payment link.");
      }

      window.location.href = data.paystack_authorization_url;
    } catch (error) {
      setPageState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while starting your payment."
      );
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 md:py-28">
      <div className="text-center">
        <div className="tricolor-rule mx-auto mb-6">
          <span />
          <span />
          <span />
        </div>

        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
          Afriqa Creative Showcase
        </p>

        <h1 className="mt-4 font-display text-4xl text-cream sm:text-5xl">
          Registration Status
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted sm:text-base">
          Check your registration, continue an incomplete payment, or see
          whether your application has been reviewed.
        </p>
      </div>

      {pageState === "idle" && (
        <section className="mt-10 rounded-2xl border border-white/10 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Check your registration
            </p>

            <h2 className="mt-3 font-display text-2xl text-cream sm:text-3xl">
              Enter your reference number
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
              Enter the ACS reference number sent to your email after
              registration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8">
            <label
              htmlFor="reference"
              className="block text-xs font-medium uppercase tracking-[0.16em] text-muted"
            >
              ACS reference number
            </label>

            <input
              id="reference"
              name="reference"
              type="text"
              value={referenceInput}
              onChange={(event) =>
                setReferenceInput(event.target.value.toUpperCase())
              }
              placeholder="ACS-XXXXXXXX"
              autoComplete="off"
              spellCheck={false}
              className="mt-3 w-full rounded-xl border border-white/10 bg-ink px-5 py-4 font-mono text-sm uppercase tracking-[0.08em] text-cream outline-none transition-colors placeholder:text-white/25 focus:border-gold/60"
            />

            <button
              type="submit"
              className="mt-5 w-full rounded-full bg-gold px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.01]"
            >
              Check Registration
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-6 text-muted">
            Your reference number is in the confirmation email from Afriqa
            Creative Showcase.
          </p>
        </section>
      )}

      {pageState === "loading" && (
        <section className="mt-10 rounded-2xl border border-white/10 bg-ink-raised px-8 py-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-teal" />

          <h2 className="mt-6 font-display text-2xl text-cream">
            Checking your registration
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted">
            Please wait while we retrieve your registration status.
          </p>
        </section>
      )}

      {pageState === "paying" && (
        <section className="mt-10 rounded-2xl border border-gold/30 bg-ink-raised px-8 py-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-gold" />

          <h2 className="mt-6 font-display text-2xl text-cream">
            Processing
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted">
            We&apos;re preparing your payment or confirming your transaction.
          </p>
        </section>
      )}

      {pageState === "error" && (
        <section className="mt-10 rounded-2xl border border-red/30 bg-ink-raised px-8 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red/40 text-xl text-red">
            !
          </div>

          <h2 className="mt-6 font-display text-2xl text-cream">
            We couldn&apos;t complete that request
          </h2>

          <p className="mt-4 text-sm leading-7 text-muted">
            {errorMessage}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={startAnotherLookup}
              className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
            >
              Check Another Reference
            </button>

            <Link
              href="/"
              className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
            >
              Back to homepage
            </Link>
          </div>
        </section>
      )}

      {pageState === "ready" && registration && (
        <section className="mt-10">
          <div className="rounded-2xl border border-white/10 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  Registration
                </p>

                <h2 className="mt-2 font-display text-2xl text-cream sm:text-3xl">
                  {registration.full_name}
                </h2>

                <p className="mt-2 text-sm text-muted">
                  {categoryLabel(registration.category)}
                </p>
              </div>

              <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-cream">
                {registration.status.replaceAll("_", " ")}
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Reference number
              </p>

              <p className="mt-2 break-all font-mono text-sm text-cream">
                {registration.reference_number}
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-ink px-5 py-5">
              <p className="text-sm leading-7 text-muted">
                {registration.message}
              </p>
            </div>

            {registration.action === "payment_required" && (
              <div className="mt-8">
                {registration.amount_kobo !== null && (
                  <div className="mb-5 flex items-center justify-between rounded-xl border border-gold/20 bg-gold/5 px-5 py-4">
                    <span className="text-sm text-muted">
                      Amount due
                    </span>

                    <span className="font-display text-xl text-cream">
                      {formatNaira(registration.amount_kobo)}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={continueToPayment}
                  className="w-full rounded-full bg-gold px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.01]"
                >
                  Continue to payment
                </button>

                <p className="mt-4 text-center text-xs leading-6 text-muted">
                  You&apos;ll be redirected to Paystack to complete your
                  payment securely.
                </p>
              </div>
            )}

            {registration.action === "under_review" && (
              <div className="mt-8 rounded-xl border border-gold/20 bg-gold/5 px-5 py-5">
                <p className="text-sm font-medium text-cream">
                  No action is required right now.
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Your application is being reviewed. Keep your reference
                  number and check this page again when you receive an update.
                </p>
              </div>
            )}

            {registration.action === "approved" && (
              <div className="mt-8 rounded-xl border border-teal/20 bg-teal/5 px-5 py-5">
                <p className="text-sm font-medium text-cream">
                  Your application has been approved.
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  No further payment is required for this registration.
                </p>
              </div>
            )}

            {registration.action === "confirmed" && (
              <div className="mt-8 rounded-xl border border-teal/30 bg-teal/5 px-5 py-6">
                <p className="text-sm font-medium text-teal">
                  Registration confirmed
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Your payment and registration have been successfully
                  recorded.
                </p>

                {registration.ticket_number && (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Ticket number
                    </p>

                    <p className="mt-2 font-mono text-sm text-cream">
                      {registration.ticket_number}
                    </p>
                  </div>
                )}
              </div>
            )}

            {registration.action === "rejected" && (
              <div className="mt-8 rounded-xl border border-red/20 bg-red/5 px-5 py-5">
                <p className="text-sm font-medium text-cream">
                  Application status
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Your application was not approved for this edition.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={startAnotherLookup}
              className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
            >
              Check Another Reference
            </button>

            <Link
              href="/"
              className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
            >
              Back to homepage
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}