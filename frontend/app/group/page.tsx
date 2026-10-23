"use client";

import { FormEvent, ReactNode, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

type TicketOption = { value: string; label: string; price_kobo: number };
type Options = {
  min_quantity: number;
  max_quantity: number;
  types: TicketOption[];
};

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60";

function Shell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
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
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl md:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] shadow-[0_30px_80px_rgba(0,0,0,0.16)]">
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
          />
          {children}
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

// ---------------------------------------------------------------------------
// After payment: Kora sends the buyer back here with ?ref=GRP-...
// ---------------------------------------------------------------------------

function PaymentResult({ reference }: { reference: string }) {
  const [state, setState] = useState<
    "checking" | "confirmed" | "failed" | "error"
  >("checking");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);

  async function check() {
    setState("checking");
    try {
      const res = await fetch(`${API}/group-orders/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_number: reference }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Could not check your payment.");
      }

      setMessage(data.message || "");
      if (data.status === "confirmed" && data.manage_token) {
        setToken(data.manage_token);
        setState("confirmed");
      } else {
        setState("failed");
      }
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not check your payment."
      );
      setState("error");
    }
  }

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <Shell
      eyebrow="Group Tickets"
      title={
        state === "confirmed"
          ? "Payment Confirmed"
          : state === "checking"
          ? "Checking Payment"
          : "Payment Not Confirmed"
      }
    >
      <div className="mx-auto max-w-2xl px-6 py-12 text-center sm:px-10">
        {state === "checking" && (
          <p className="text-[#B8B3AA]/75">
            Please wait while we confirm your payment and create your tickets.
            This can take up to a minute for large orders.
          </p>
        )}

        {state === "confirmed" && token && (
          <>
            <p className="text-base leading-relaxed text-[#B8B3AA]/75">
              {message} Your tickets are on their way to your email as one PDF.
              You can also send each ticket to the person it is for.
            </p>
            <Link
              href={`/group/manage?token=${encodeURIComponent(token)}`}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#00A5A8] px-8 py-3.5 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-1"
            >
              Manage your tickets <span className="ml-3">→</span>
            </Link>
            <p className="mt-5 text-xs text-[#F5EFE6]/35">
              Order reference: {reference}
            </p>
          </>
        )}

        {(state === "failed" || state === "error") && (
          <>
            <p className="text-base leading-relaxed text-[#B8B3AA]/75">
              {message ||
                "We could not confirm this payment yet. If you have just paid, wait a moment and check again."}
            </p>
            <button
              type="button"
              onClick={check}
              className="mt-8 rounded-full bg-[#00A5A8] px-8 py-3.5 text-sm font-semibold text-[#11152F]"
            >
              Check again
            </button>
            <p className="mt-5 text-xs text-[#F5EFE6]/35">
              Order reference: {reference}. Keep it if you need to contact us.
            </p>
          </>
        )}
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// The Buy Multiple Tickets form
// ---------------------------------------------------------------------------

function GroupForm() {
  const [options, setOptions] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [ticketType, setTicketType] = useState("vip");
  const [qtyText, setQtyText] = useState("10");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/group-orders/options`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setOptions)
      .catch(() => setLoadError(true));
  }, []);

  if (loadError) {
    return (
      <Shell eyebrow="Group Tickets" title="Buy Multiple Tickets">
        <p className="px-6 py-12 text-center text-[#B8B3AA]/75">
          We could not load ticket prices. Please refresh the page and try
          again.
        </p>
      </Shell>
    );
  }

  if (!options) {
    return (
      <Shell eyebrow="Group Tickets" title="Buy Multiple Tickets">
        <p className="px-6 py-12 text-center text-[#B8B3AA]/75">Loading…</p>
      </Shell>
    );
  }

  const selected =
    options.types.find((t) => t.value === ticketType) ?? options.types[0];
  const qty = parseInt(qtyText, 10);
  const qtyValid =
    Number.isFinite(qty) &&
    qty >= options.min_quantity &&
    qty <= options.max_quantity;
  const total = qtyValid ? selected.price_kobo * qty : 0;

  function step(delta: number) {
    const current = Number.isFinite(qty) ? qty : options!.min_quantity;
    const next = Math.min(
      options!.max_quantity,
      Math.max(options!.min_quantity, current + delta)
    );
    setQtyText(String(next));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accepted || !qtyValid) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API}/group-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ticket_type: ticketType,
          quantity: qty,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Please check your details and try again."
        );
      }

      window.location.href = data.payment_url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <Shell
      eyebrow="Group Tickets"
      title="Buy Multiple Tickets"
      subtitle="Pay once for a group. Every ticket gets its own number and QR code, and you can send each one to the person it is for."
    >
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#00A5A8]">
            Step 01
          </p>
          <h2 className="mt-2 font-display text-2xl text-[#F5EFE6] sm:text-3xl">
            Choose tickets
          </h2>

          <div className="mt-7 space-y-3">
            {options.types.map((tier) => {
              const isSelected = tier.value === ticketType;
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setTicketType(tier.value)}
                  className={`relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-[1.25rem] border p-5 text-left transition-all duration-300 ${
                    isSelected
                      ? "border-[#00A5A8]/50 bg-[#00A5A8]/10"
                      : "border-white/10 bg-[#11152F]/40 hover:border-white/20"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute left-0 top-0 h-full w-1 bg-[#00A5A8]" />
                  )}
                  <span className="text-base font-medium text-[#F5EFE6]">
                    {tier.label}
                  </span>
                  <span
                    className={`font-display text-xl ${
                      isSelected ? "text-[#E59200]" : "text-[#B8B3AA]/65"
                    }`}
                  >
                    {naira(tier.price_kobo)} each
                  </span>
                </button>
              );
            })}
          </div>

          <label className="mt-7 block text-sm font-medium text-[#F5EFE6]/75">
            How many tickets? ({options.min_quantity}–{options.max_quantity})
          </label>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              className="h-12 w-12 rounded-xl border border-white/10 bg-[#11152F] text-xl text-[#F5EFE6] hover:border-[#00A5A8]/60"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={options.min_quantity}
              max={options.max_quantity}
              value={qtyText}
              onChange={(e) => setQtyText(e.target.value)}
              className="h-12 w-28 rounded-xl border border-white/10 bg-[#11152F] px-4 text-center text-lg text-[#F5EFE6] outline-none focus:border-[#00A5A8]/60"
            />
            <button
              type="button"
              onClick={() => step(1)}
              className="h-12 w-12 rounded-xl border border-white/10 bg-[#11152F] text-xl text-[#F5EFE6] hover:border-[#00A5A8]/60"
            >
              +
            </button>
          </div>
          {!qtyValid && (
            <p className="mt-2 text-xs text-[#E59200]">
              Enter a number from {options.min_quantity} to{" "}
              {options.max_quantity}.
            </p>
          )}

          <div className="mt-6 rounded-xl border border-[#E59200]/20 bg-[#11152F]/60 px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#B8B3AA]/45">
              Total to pay
            </p>
            <p className="mt-1 font-display text-3xl text-[#E59200]">
              {qtyValid ? naira(total) : "—"}
            </p>
            {qtyValid && (
              <p className="mt-1 text-xs text-[#B8B3AA]/55">
                {qty} × {selected.label} at {naira(selected.price_kobo)}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#11152F]/30 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#00A5A8]">
            Step 02
          </p>
          <h2 className="mt-2 font-display text-2xl text-[#F5EFE6] sm:text-3xl">
            Your details
          </h2>

          <div className="mt-7 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#F5EFE6]/75">
                Your full name
              </label>
              <input
                required
                type="text"
                placeholder="e.g. John Doe"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#F5EFE6]/75">
                Email (your tickets are sent here)
              </label>
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
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
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
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

            {error && (
              <div className="rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-4 py-3">
                <p className="text-sm text-[#F5EFE6]/80">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !accepted || !qtyValid}
              className="w-full rounded-full bg-[#00A5A8] px-7 py-4 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Taking you to payment..."
                : qtyValid
                ? `Pay ${naira(total)} →`
                : "Pay →"}
            </button>

            <p className="text-center text-[10px] leading-relaxed tracking-wide text-[#F5EFE6]/25">
              You pay once. Your tickets are emailed as one PDF, and you can
              send each ticket to the person it is for.
            </p>
          </div>
        </div>
      </form>
    </Shell>
  );
}

function GroupContent() {
  const params = useSearchParams();
  // Kora sends the buyer back with ?ref=GRP-... (and sometimes its own
  // "reference" value), so accept either and trim anything stuck on the end.
  const raw = params.get("ref") || params.get("reference") || "";
  const ref = raw.split("?")[0].trim();

  if (ref) return <PaymentResult reference={ref} />;
  return <GroupForm />;
}

export default function GroupPage() {
  return (
    <Suspense fallback={null}>
      <GroupContent />
    </Suspense>
  );
}
