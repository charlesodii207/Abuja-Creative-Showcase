"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Phase = "enter-ref" | "loading" | "unpaid" | "paid" | "rejected" | "error";

// The values below are what the backend stores (general / vip / masterclass).
// Only the names people see changed:
//   general     -> 1-Day Pass
//   vip         -> 2-Day Pass
//   masterclass -> Masterclass Pass
// Ticket names are translated: see messages/*.json (Register.tiers).
const KNOWN_TICKETS = ["general", "vip", "masterclass", "vvip"];

// Ticket prices in naira (General is free). Used to show what an upgrade costs.
const PRICES: Record<string, number> = {
  general: 0,
  vip: 20000,
  masterclass: 50000,
  vvip: 150000,
};

const UPGRADE_OPTIONS: Record<
  string,
  { value: string; label: string }[]
> = {
  general: [
    { value: "vip", label: "VIP" },
    { value: "masterclass", label: "Masterclass" },
    { value: "vvip", label: "VVIP" },
  ],
  vip: [
    { value: "masterclass", label: "Masterclass" },
    { value: "vvip", label: "VVIP" },
  ],
  masterclass: [{ value: "vvip", label: "VVIP" }],
  vvip: [],
};

export default function AttendeeFinishPage() {
  const t = useTranslations("Register");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [phase, setPhase] = useState<Phase>("enter-ref");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [ticketType, setTicketType] = useState("");

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  async function checkStatus(e: React.FormEvent) {
    e.preventDefault();
    setPhase("loading");
    setError("");
    setShowUpgrade(false);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register/attendee/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference_number: referenceNumber,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || t("attendeeFinish.errNotFound"));
        setPhase("error");
        return;
      }

      setFullName(data.full_name);
      setTicketType(data.ticket_type);
      setStatusMessage(data.message);

      // Status (rejected) always wins over is_paid — a registrant can
      // be paid and still rejected, pending a refund.
      if (data.status === "rejected") {
        setPhase("rejected");
      } else {
        setPhase(data.is_paid ? "paid" : "unpaid");
      }
    } catch {
      setError(t("attendeeFinish.errGeneric"));
      setPhase("error");
    }
  }

  async function submitUpgrade() {
    if (!upgradeTier) return;

    setUpgrading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upgrade`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference_number: referenceNumber,
            ticket_type: upgradeTier,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || t("attendeeFinish.errUpgrade"));
        setUpgrading(false);
        return;
      }

      window.location.href = data.paystack_authorization_url;
    } catch {
      setError(t("attendeeFinish.errUpgradeStart"));
      setUpgrading(false);
    }
  }

  const upgradeChoices = UPGRADE_OPTIONS[ticketType] || [];
  const ticketLabel = KNOWN_TICKETS.includes(ticketType)
    ? t(`tiers.${ticketType}.label`)
    : ticketType;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
      {/* Editorial background details */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-20 h-44 w-44 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto max-w-3xl px-6 pt-10 pb-20 sm:px-8 md:pt-14 md:pb-28">
        <div className="text-center">
          <div className="tricolor-rule mx-auto mb-7">
            <span />
            <span />
            <span />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
            {t("attendeeFinish.eyebrow")}
          </p>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
            {t("attendeeFinish.heading")}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
            {t("attendeeFinish.intro")}
          </p>
        </div>

        <form
          onSubmit={checkStatus}
          className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.16)] sm:px-8 sm:py-10"
        >
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
          />

          <label className="block text-sm font-medium text-[#F5EFE6]/75">
            {t("attendeeFinish.refLabel")}
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

          <button
            type="submit"
            disabled={phase === "loading"}
            className="mt-6 w-full rounded-full bg-[#00A5A8] px-7 py-4 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,165,168,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === "loading"
              ? t("attendeeFinish.checking")
              : t("attendeeFinish.check")}
          </button>
        </form>

        {phase === "error" && (
          <div className="mt-6 rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-5 py-4 text-center">
            <p className="text-sm text-[#F5EFE6]/80">{error}</p>
          </div>
        )}

        {phase === "rejected" && (
          <div className="mt-8 rounded-[2rem] border border-[#B80319]/25 bg-[#151A3A] px-6 py-9 text-center shadow-[0_25px_60px_rgba(0,0,0,0.14)] sm:px-8">
            <p className="text-sm text-[#B8B3AA]/65">{t("attendeeFinish.hi", { name: fullName })}</p>

            <p className="mt-3 font-display text-2xl text-[#F5EFE6]">
              {t("attendeeFinish.regStatus")}
            </p>

            <div className="mx-auto mt-5 h-px w-16 bg-[#B80319]/40" />

            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#B8B3AA]/70">
              {statusMessage ||
                t("attendeeFinish.rejectedDefault")}
            </p>
          </div>
        )}

        {phase === "unpaid" && (
          <div className="mt-8 rounded-[2rem] border border-[#E59200]/25 bg-[#151A3A] px-6 py-9 text-center shadow-[0_25px_60px_rgba(0,0,0,0.14)] sm:px-8">
            <p className="text-sm text-[#B8B3AA]/65">
              {t("attendeeFinish.hi", { name: fullName })}
            </p>

            <p className="mt-3 font-display text-2xl text-[#F5EFE6]">
              {t("attendeeFinish.attendee")} —{" "}
              <span className="text-[#E59200]">
                {ticketLabel}
              </span>
            </p>

            <div className="mx-auto mt-5 h-px w-16 bg-[#E59200]/40" />

            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#B8B3AA]/70">
              {t("attendeeFinish.unpaidText")}
            </p>

            {/* The payment choice (Kora or bank transfer) lives on /verify. */}
            <Link
              href={`/verify?ref=${encodeURIComponent(referenceNumber)}`}
              className="mt-7 block w-full rounded-full bg-[#E59200] px-7 py-4 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(229,146,0,0.18)]"
            >
              {t("attendeeFinish.completePay")}
            </Link>
          </div>
        )}

        {phase === "paid" && (
          <div className="mt-8 rounded-[2rem] border border-[#00A5A8]/25 bg-[#151A3A] px-6 py-9 text-center shadow-[0_25px_60px_rgba(0,0,0,0.14)] sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00A5A8]" />
            </div>

            <p className="mt-5 text-sm text-[#B8B3AA]/65">
              {t("attendeeFinish.hi", { name: fullName })}
            </p>

            <p className="mt-3 font-display text-2xl text-[#F5EFE6]">
              {t("attendeeFinish.attendee")} —{" "}
              <span className="text-[#00A5A8]">
                {ticketLabel}
              </span>
            </p>

            <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-[#00A5A8]">
              {t("attendeeFinish.confirmed")}
            </p>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#B8B3AA]/70">
              {t("attendeeFinish.ticketSent")}
            </p>

            {upgradeChoices.length > 0 && !showUpgrade && (
              <p className="mt-6 text-xs text-[#B8B3AA]/60">
                {t("attendeeFinish.wantUpgrade")}{" "}
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="text-[#F5EFE6]/80 underline underline-offset-4 transition-colors hover:text-[#00A5A8]"
                >
                  {t("attendeeFinish.clickHere")}
                </button>
              </p>
            )}

            {showUpgrade && (
              <div className="mt-7 rounded-[1.25rem] border border-white/10 bg-[#11152F] px-5 py-6 text-left">
                <p className="text-sm font-medium text-[#F5EFE6]/75">
                  {t("attendeeFinish.upgradeTitle")}
                </p>

                <p className="mt-2 text-xs leading-relaxed text-[#B8B3AA]/55">
                  {t("attendeeFinish.upgradeNote")}
                </p>

                <label className="mt-4 block text-xs uppercase tracking-[0.15em] text-[#B8B3AA]/50">
                  {t("attendeeFinish.upgradeTo")}
                </label>

                <select
                  value={upgradeTier}
                  onChange={(e) => setUpgradeTier(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#151A3A] px-4 py-3 text-[#F5EFE6] outline-none transition-colors focus:border-[#00A5A8]/60"
                >
                  <option value="">{t("attendeeFinish.selectTicket")}</option>

                  {upgradeChoices.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t("attendeeFinish.optionPay", {
                        label: t(`tiers.${opt.value}.label`),
                        amount: (
                          (PRICES[opt.value] ?? 0) - (PRICES[ticketType] ?? 0)
                        ).toLocaleString(),
                      })}
                    </option>
                  ))}
                </select>

                <button
                  onClick={submitUpgrade}
                  disabled={!upgradeTier || upgrading}
                  className="mt-4 w-full rounded-full bg-[#00A5A8] px-7 py-3.5 text-sm font-semibold text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,165,168,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {upgrading
                    ? t("attendeeFinish.starting")
                    : t("attendeeFinish.upgradeBtn")}
                </button>

                {error && (
                  <p className="mt-3 text-sm text-[#B80319]">{error}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-white/10" />

          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/35 transition-colors hover:text-[#F5EFE6]/70"
          >
            {t("attendeeFinish.backHome")}
          </Link>

          <span className="h-px w-10 bg-white/10" />
        </div>
      </div>
    </main>
  );
}
