"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Kora switch. While Kora isn't ready, keep this false: the Kora button is
// greyed out and people are told to use bank transfer. Change it to true
// (and redeploy the frontend) once Kora is working.
const KORA_AVAILABLE = true;

type Action =
  | "payment_required"
  | "under_review"
  | "approved"
  | "confirmed"
  | "rejected"
  | "manual_pending";

type RegistrationStatus = {
  reference_number: string;
  full_name: string;
  category: string;
  status: string;
  action: Action;
  message: string;
  amount_kobo: number | null;
};

type PageState =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "paying"
  | "choose"
  | "bank"
  | "claimed";

type BankInfo = {
  reference_number: string;
  full_name: string;
  category: string;
  amount_kobo: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  pending_claim: boolean;
};

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

function VerifyContent() {
  const searchParams = useSearchParams();

  const [pageState, setPageState] = useState<PageState>("idle");
  const [registration, setRegistration] =
    useState<RegistrationStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [referenceInput, setReferenceInput] = useState("");
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [copied, setCopied] = useState("");

  // Our own return link looks like /verify?ref=ACS-XXXX, and the payment
  // provider (Kora) adds its own `reference` after it. If the provider ever
  // glues that on with a second "?" instead of "&", the whole tail ends up
  // inside `ref`, so split it back apart here to be safe.
  const rawRef = searchParams.get("ref")?.trim() || "";
  const [reference, embeddedQuery] = rawRef.split("?");
  const embeddedPaymentReference = embeddedQuery
    ? new URLSearchParams(embeddedQuery).get("reference")?.trim() || ""
    : "";

  const paymentReference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    embeddedPaymentReference ||
    "";

  async function loadStatus(referenceNumber: string) {
    if (!referenceNumber) return null;

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

    return data as RegistrationStatus;
  }

  useEffect(() => {
    if (!reference) {
      setPageState("idle");
      setRegistration(null);
      setErrorMessage("");
      setPaymentNotice("");
      setReferenceInput("");
      return;
    }

    setReferenceInput(reference);

    let cancelled = false;

    async function resolveRegistration() {
      try {
        setErrorMessage("");
        setPaymentNotice("");

        /*
         * If the payment provider sent the customer back here, confirm the
         * transaction first. A failed or unrecognised payment must NOT
         * kill the page: we still load the registration status so the
         * person can see where they stand and try again.
         */
        if (paymentReference) {
          setPageState("paying");

          try {
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

            if (response.ok && data.status !== "confirmed") {
              setPaymentNotice(
                data?.message || "Your payment was not successful."
              );
            } else if (!response.ok && response.status !== 404) {
              // 404 just means this reference was already processed
              // (e.g. page refreshed after an upgrade), so stay quiet.
              setPaymentNotice(
                "We could not confirm your payment yet. Your current status is below."
              );
            }
          } catch {
            setPaymentNotice(
              "We could not confirm your payment yet. Your current status is below."
            );
          }
        }

        if (cancelled) return;

        setPageState("loading");

        await loadStatus(reference);

        if (cancelled) return;

        setPageState("ready");
      } catch (error) {
        if (cancelled) return;

        setPageState("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong while checking your registration."
        );
      }
    }

    resolveRegistration();

    return () => {
      cancelled = true;
    };
  }, [reference, paymentReference]);

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
    setPaymentNotice("");
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

      // The backend field is still named paystack_authorization_url so the
      // site keeps working unchanged; it now holds Kora's checkout link.
      if (!data.paystack_authorization_url) {
        throw new Error("We did not get a payment link. Please try again.");
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

  // Bank transfer: load our account details and the amount for this person.
  async function openBankDetails() {
    if (!reference) return;

    try {
      setPageState("paying");
      setErrorMessage("");
      setClaimError("");

      const response = await fetch(
        `${API_URL}/payments/manual/instructions?ref=${encodeURIComponent(
          reference
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "We could not load the bank details."
        );
      }

      setBankInfo(data as BankInfo);

      // They already told us they paid: skip straight to the waiting message.
      setPageState(data.pending_claim ? "claimed" : "bank");
    } catch (error) {
      setPageState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading the bank details."
      );
    }
  }

  // "I've paid": tells our team to check the bank account.
  async function submitClaim() {
    if (!reference || claiming) return;

    try {
      setClaiming(true);
      setClaimError("");

      const response = await fetch(`${API_URL}/payments/manual/claim`, {
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
          data?.detail || "We could not send your payment notice."
        );
      }

      setPageState("claimed");
    } catch (error) {
      setClaimError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setClaiming(false);
    }
  }

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // Copying isn't available in this browser; the value is still on screen.
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pt-10 pb-20 md:pt-14 md:pb-28">
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

      {pageState === "choose" && registration && (
        <section className="mt-10 rounded-2xl border border-white/10 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Payment
            </p>

            <h2 className="mt-3 font-display text-2xl text-cream sm:text-3xl">
              How would you like to pay?
            </h2>
          </div>

          {registration.amount_kobo !== null && (
            <div className="mt-8 flex items-center justify-between rounded-xl border border-gold/20 bg-gold/5 px-5 py-4">
              <span className="text-sm text-muted">Amount due</span>

              <span className="font-display text-xl text-cream">
                {formatNaira(registration.amount_kobo)}
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-5">
            <div>
              <p className="mb-2 text-center">
                <span className="inline-block rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-teal">
                  Fastest · confirmed instantly
                </span>

                {!KORA_AVAILABLE && (
                  <span className="ml-2 inline-block rounded-full border border-red/40 bg-red/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-red">
                    Unavailable for now
                  </span>
                )}
              </p>

              <button
                type="button"
                onClick={continueToPayment}
                disabled={!KORA_AVAILABLE}
                className="w-full rounded-full bg-gold px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                Pay with Kora
              </button>

              {!KORA_AVAILABLE && (
                <p className="mt-2 text-center text-xs text-muted">
                  Online payment is temporarily unavailable. Please use bank
                  transfer for now.
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-center">
                <span className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                  Popular
                </span>
              </p>

              <button
                type="button"
                onClick={openBankDetails}
                className="w-full rounded-full bg-gold px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.01]"
              >
                Pay with bank transfer
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPageState("ready")}
            className="mt-6 block w-full text-center text-xs text-muted transition-colors hover:text-cream"
          >
            Back
          </button>
        </section>
      )}

      {pageState === "bank" && bankInfo && (
        <section className="mt-10 rounded-2xl border border-white/10 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Bank transfer
            </p>

            <h2 className="mt-3 font-display text-2xl text-cream sm:text-3xl">
              Transfer to our account
            </h2>
          </div>

          <div className="mt-8 divide-y divide-white/10 rounded-xl border border-white/10 bg-ink">
            {[
              { label: "Bank", value: bankInfo.bank_name, copy: false },
              { label: "Account name", value: bankInfo.account_name, copy: false },
              { label: "Account number", value: bankInfo.account_number, copy: true },
              { label: "Amount", value: formatNaira(bankInfo.amount_kobo), copy: false },
              { label: "Narration", value: bankInfo.reference_number, copy: true },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">
                    {row.label}
                  </p>

                  <p className="mt-1 break-all font-mono text-sm text-cream">
                    {row.value}
                  </p>
                </div>

                {row.copy && (
                  <button
                    type="button"
                    onClick={() => copyValue(row.label, row.value)}
                    className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-cream transition-colors hover:border-white/40"
                  >
                    {copied === row.label ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm leading-7 text-muted">
            Send exactly {formatNaira(bankInfo.amount_kobo)} and put your
            reference number in the transfer narration, so we can match your
            payment. When you have sent it, tap{" "}
            <span className="text-cream">I&apos;ve paid</span>.
          </p>

          {claimError && (
            <div className="mt-5 rounded-xl border border-red/30 bg-red/5 px-5 py-4">
              <p className="text-sm leading-6 text-cream">{claimError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={submitClaim}
            disabled={claiming}
            className="mt-6 w-full rounded-full bg-gold px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {claiming ? "Sending…" : "I've paid"}
          </button>

          <button
            type="button"
            onClick={() => setPageState("choose")}
            disabled={claiming}
            className="mt-5 block w-full text-center text-xs text-muted transition-colors hover:text-cream"
          >
            Back to payment options
          </button>
        </section>
      )}

      {pageState === "claimed" && (
        <section className="mt-10 rounded-2xl border border-teal/30 bg-ink-raised px-6 py-8 text-center sm:px-8 sm:py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-teal/40 text-xl text-teal">
            ✓
          </div>

          <h2 className="mt-6 font-display text-2xl text-cream sm:text-3xl">
            Payment notice received
          </h2>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted">
            Thank you. We&apos;ll check our bank account and confirm your
            payment, usually within 10 minutes. Once it&apos;s confirmed,
            your ticket will be emailed to you.
          </p>

          <div className="mx-auto mt-6 max-w-sm rounded-xl border border-white/10 bg-ink px-5 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Reference number
            </p>

            <p className="mt-2 break-all font-mono text-sm text-cream">
              {reference}
            </p>
          </div>

          <p className="mx-auto mt-6 max-w-md text-xs leading-6 text-muted">
            All payments and registrations remain subject to review. If a
            registration has to be cancelled, any amount we received from you
            will be refunded.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                window.location.href = `/verify?ref=${encodeURIComponent(reference)}`;
              }}
              className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
            >
              Check status
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
          {paymentNotice && (
            <div className="mb-6 rounded-xl border border-red/30 bg-red/5 px-5 py-4">
              <p className="text-sm leading-6 text-cream">{paymentNotice}</p>
            </div>
          )}

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

            {/* The confirmed state has its own message below, so the
                generic backend message is hidden to avoid saying it twice. */}
            {registration.action !== "confirmed" &&
              registration.action !== "manual_pending" && (
              <div className="mt-8 rounded-xl border border-white/10 bg-ink px-5 py-5">
                <p className="text-sm leading-7 text-muted">
                  {registration.message}
                </p>
              </div>
            )}

            {registration.action === "payment_required" && (
              <div className="mt-8">
                {registration.amount_kobo !== null && (
                  <div className="mb-5 flex items-center justify-between rounded-xl border border-gold/20 bg-gold/5 px-5 py-4">
                    <span className="text-sm text-muted">Amount due</span>

                    <span className="font-display text-xl text-cream">
                      {formatNaira(registration.amount_kobo)}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPageState("choose")}
                  className="w-full rounded-full bg-gold px-7 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.01]"
                >
                  Continue to payment
                </button>

                <p className="mt-4 text-center text-xs leading-6 text-muted">
                  Next, you&apos;ll choose how you&apos;d like to pay.
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
                  Please check your email for the latest instructions from
                  Afriqa Creative Showcase.
                </p>
              </div>
            )}

            {registration.action === "confirmed" && (
              <div className="mt-8 rounded-xl border border-teal/30 bg-teal/5 px-5 py-6">
                <p className="text-base font-medium text-teal">
                  Registration Confirmed
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Your registration and payment have been successfully
                  confirmed.
                </p>

                <p className="mt-4 text-sm leading-6 text-muted">
                  Your official ticket has been sent to your email.
                </p>
              </div>
            )}

            {registration.action === "manual_pending" && (
              <div className="mt-8 rounded-xl border border-gold/20 bg-gold/5 px-5 py-5">
                <p className="text-sm font-medium text-cream">
                  Payment under verification
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  We&apos;ve received your bank transfer notice and are
                  checking our account. This usually takes about 10 minutes.
                  Your ticket will be emailed to you once it&apos;s confirmed.
                </p>
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

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}
