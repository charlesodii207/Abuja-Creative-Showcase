"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// The values below are what the backend stores (general / vip / masterclass /
// vvip). The names people see:
//   general -> General (free)   vip -> VIP   masterclass -> Masterclass   vvip -> VVIP
type TicketType = "general" | "vip" | "masterclass" | "vvip";

const TIERS: {
  value: TicketType;
  label: string;
  price: string;
  blurb: string;
}[] = [
  {
    value: "general",
    label: "General",
    price: "Free",
    blurb:
      "Free entry on both days, 4 and 5 December: fashion runway, film screenings and art, the Creative Market, and the live concert. General seating.",
  },
  {
    value: "vip",
    label: "VIP",
    price: "₦20,000",
    blurb:
      "Everything in General, with priority seating at the runway and the concert.",
  },
  {
    value: "masterclass",
    label: "Masterclass",
    price: "₦50,000",
    blurb:
      "Everything in General, plus the masterclasses on both days. General seating.",
  },
  {
    value: "vvip",
    label: "VVIP",
    price: "₦150,000",
    blurb:
      "Everything included: front reserved seating, a reserved table at the concert and dinner, meet and greet, masterclasses on both days, and Pitch and Deal Room access.",
  },
];

function AttendeeNewRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The pass chosen on /register arrives as ?ticket=vip (general, vip, masterclass, vvip).
  const picked = TIERS.find((t) => t.value === searchParams.get("ticket")) ?? null;

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    ticket_type: (picked?.value ?? "general") as TicketType,
  });

  // Must be ticked before the form can be submitted.
  const [accepted, setAccepted] = useState(false);

  // The reason the server gave when registration fails (if it gave one).
  const [errorMessage, setErrorMessage] = useState("");

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const [confirmation, setConfirmation] = useState<{
    amount_kobo: number;
    email: string;
  } | null>(null);

  // No pass chosen (or an unknown one): send them to pick one first.
  useEffect(() => {
    if (!picked) router.replace("/register#passes");
  }, [picked, router]);

  const selectedTier = TIERS.find((t) => t.value === form.ticket_type)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) return;
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
        throw new Error(
          typeof data?.detail === "string" ? data.detail : "Registration failed"
        );
      }

      // Paid tickets go straight to the payment screen (online or bank
      // transfer): no email step in between. (The payment link is still
      // emailed as a backup.) Free tickets have no payment link, so they
      // fall through to the confirmation screen below.
      if (data.paystack_authorization_url && data.reference_number) {
        window.location.href = `/verify?ref=${encodeURIComponent(
          data.reference_number
        )}&pay=1`;
        return;
      }

      setConfirmation({
        amount_kobo: data.amount_kobo,
        email: form.email,
      });

      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : ""
      );
      setStatus("error");
    }
  }

  if (!picked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#11152F] px-6">
        <p className="text-sm text-[#B8B3AA]/75">Taking you to the passes…</p>
      </main>
    );
  }

  if (status === "success" && confirmation) {
    const amountNaira = (confirmation.amount_kobo / 100).toLocaleString();
    // A free ticket has nothing to pay: it is confirmed and emailed at once.
    const isFree = confirmation.amount_kobo === 0;

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

        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 pt-10 pb-20 sm:px-8 md:pt-14 md:pb-28">
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
                  {isFree ? "You're registered" : "Registration Received"}
                </p>

                <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
                  {isFree ? "Your Free Ticket Is on Its Way" : "Finish Your Registration"}
                </h1>

                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
                  {isFree
                    ? "Your registration is confirmed. We have emailed your free ticket."
                    : "Your registration has been received and your place has been reserved."}
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
                      {isFree ? "Price" : "Amount Due"}
                    </p>

                    <p className="mt-2 font-display text-2xl text-[#E59200]">
                      {isFree ? "Free" : `₦${amountNaira}`}
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
                    {isFree
                      ? "Your ticket is attached to the email we sent. Show it at check-in on either day."
                      : "Check your email for your reference number. Keep it safe — you'll need it to finish your registration and complete payment."}
                  </p>
                </div>

                <div className="mt-8">
                  {isFree ? (
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-full bg-[#00A5A8] px-8 py-3.5 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)]"
                    >
                      Back to homepage
                    </Link>
                  ) : (
                  <Link
                    href="/verify"
                    className="inline-flex items-center justify-center rounded-full bg-[#00A5A8] px-8 py-3.5 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)]"
                  >
                    Finish Registration
                    <span className="ml-3">→</span>
                  </Link>
                  )}
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

      <div className="mx-auto max-w-4xl px-6 pt-10 pb-20 sm:px-8 md:pt-14 md:pb-28">
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
            Check your pass, then tell us who you are. After
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
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#00A5A8]">
                  Step 01
                </p>

                <h2 className="mt-2 font-display text-2xl text-[#F5EFE6] sm:text-3xl">
                  Your ticket
                </h2>
              </div>

              <div className="relative mt-7 overflow-hidden rounded-[1.25rem] border border-[#00A5A8]/50 bg-[#00A5A8]/10 p-5 shadow-[0_15px_40px_rgba(0,165,168,0.07)]">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-1 bg-[#00A5A8]"
                />

                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-base font-medium text-[#F5EFE6]">
                    {selectedTier.label}
                  </span>

                  <span className="font-display text-xl text-[#E59200]">
                    {selectedTier.price}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/70">
                  {selectedTier.blurb}
                </p>

                <Link
                  href="/register#passes"
                  className="mt-4 inline-block text-xs text-[#F5EFE6]/60 underline underline-offset-4 hover:text-[#F5EFE6]"
                >
                  Change pass
                </Link>
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

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    required
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#00A5A8]"
                  />

                  <span className="text-sm leading-relaxed text-[#F5EFE6]/65">
                    I have read and agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00A5A8] underline underline-offset-2 hover:text-[#E59200]"
                    >
                      Terms &amp; Conditions
                    </Link>{" "}
                    and the{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00A5A8] underline underline-offset-2 hover:text-[#E59200]"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                {status === "error" && (
                  <div className="rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-4 py-3">
                    <p className="text-sm leading-relaxed text-[#F5EFE6]/80">
                      {errorMessage ||
                        "Something went wrong — please check your details and try again."}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting" || !accepted}
                  className="w-full rounded-full bg-[#00A5A8] px-7 py-4 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "submitting"
                    ? "Registering..."
                    : selectedTier.value === "general"
                    ? "Get my free ticket →"
                    : "Complete Registration →"}
                </button>

                <p className="text-center text-[10px] leading-relaxed tracking-wide text-[#F5EFE6]/25">
                  After registration, you will choose how to pay: online or by bank
                  transfer. Your reference number is also emailed to you.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Link to the group (bulk) ticket page */}
        <div className="mt-8 rounded-[1.5rem] border border-[#E59200]/20 bg-[#151A3A] px-6 py-6 text-center">
          <p className="text-sm text-[#F5EFE6]/75">
            Buying for a team, school or group?
          </p>
          <Link
            href="/group"
            className="mt-3 inline-flex items-center justify-center rounded-full border border-[#E59200]/50 px-6 py-2.5 text-sm font-semibold text-[#E59200] transition-colors hover:bg-[#E59200]/10"
          >
            Buy Multiple Tickets <span className="ml-2">→</span>
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
    </main>
  );
}

// useSearchParams needs a Suspense boundary so the page can still be built.
export default function AttendeeNewRegistrationPage() {
  return (
    <Suspense fallback={null}>
      <AttendeeNewRegistrationForm />
    </Suspense>
  );
}
