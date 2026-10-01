"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const BOOKING_ENDPOINT = `${API_URL}/hotel-bookings`;

const BUDGET_OPTIONS = [
  "Under ₦50,000",
  "₦50,000 – ₦100,000",
  "₦100,000 – ₦200,000",
  "₦200,000 – ₦350,000",
  "₦350,000+",
];

const AREA_OPTIONS = ["Close to the venue", "City centre", "No preference"];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  rooms: string;
  budgetRange: string;
  preferredArea: string;
  notes: string;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  checkIn: "",
  checkOut: "",
  guests: "1",
  rooms: "1",
  budgetRange: "",
  preferredArea: "",
  notes: "",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#F5EFE6] placeholder:text-white/30 outline-none transition-colors duration-200 focus:border-[#E59200]/70 [color-scheme:dark]";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F5EFE6]/50">
        {label}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
        active
          ? "border-[#E59200] bg-[#E59200]/15 text-[#F5EFE6]"
          : "border-white/10 bg-white/5 text-white/65 hover:border-white/30 hover:text-[#F5EFE6]"
      }`}
    >
      {children}
    </button>
  );
}

export default function HotelBookingSection() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reference, setReference] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep1 = () => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (form.fullName.trim().length < 2) next.fullName = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a valid phone number.";
    if (!form.checkIn) next.checkIn = "Choose a check-in date.";
    if (!form.checkOut) next.checkOut = "Choose a check-out date.";
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      next.checkOut = "Check-out must be after check-in.";
    }
    if (Number(form.guests) < 1) next.guests = "At least 1 guest.";
    if (Number(form.rooms) < 1) next.rooms = "At least 1 room.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.budgetRange) next.budgetRange = "Select a budget range.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(BOOKING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          check_in: form.checkIn,
          check_out: form.checkOut,
          guests: Number(form.guests),
          rooms: Number(form.rooms),
          budget_range: form.budgetRange,
          preferred_area: form.preferredArea || null,
          notes: form.notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json().catch(() => ({}));
      setReference(String(data.reference ?? data.id ?? ""));
      setStep(3);
    } catch {
      setSubmitError(
        "We couldn't send your request. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setErrors({});
    setReference("");
    setSubmitError("");
    setStep(1);
  };

  const steps = ["Your details", "Budget & preferences"];

  return (
    <section
      id="accommodation"
      className="overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Left: copy */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="tricolor-rule">
                <span />
                <span />
                <span />
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
                Accommodation
              </span>
            </div>

            <Reveal delay={80}>
              <h2 className="max-w-xl font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
                Find a place to stay in Abuja
              </h2>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                Tell us your dates and budget, and our team will match you with
                a hotel that suits you and get back to you with options.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <ul className="mt-8 space-y-4 text-sm text-white/65 sm:text-base">
                {[
                  "Share your dates and who is travelling",
                  "Set a budget range and preferred area",
                  "We confirm availability and reply by email",
                ].map((item, i) => (
                  <li key={item} className="flex items-center gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E59200]/40 text-xs font-semibold text-[#E59200]">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Right: form card */}
          <Reveal delay={120}>
            <div className="relative px-3 pb-3 sm:px-5 sm:pb-5">
              <div className="absolute inset-3 rounded-[2.5rem] border border-[#E59200]/30 sm:inset-5" />

              <div className="absolute -bottom-1 -left-1 h-24 w-24 rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10 blur-[1px] sm:h-28 sm:w-28" />

              <div className="relative rounded-[2.5rem] rounded-br-[5rem] rounded-tl-[1rem] border border-white/10 bg-[#0D1128] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.22)] sm:p-10">
                {step !== 3 && (
                  <div className="mb-8 flex items-center gap-3">
                    {steps.map((label, i) => {
                      const n = i + 1;
                      const active = step === n;
                      const done = step > n;
                      return (
                        <div key={label} className="flex flex-1 items-center gap-3">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                              active || done
                                ? "border-[#E59200] bg-[#E59200] text-[#0D1128]"
                                : "border-white/20 text-white/40"
                            }`}
                          >
                            {done ? "✓" : n}
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                              active ? "text-[#F5EFE6]" : "text-[#F5EFE6]/40"
                            }`}
                          >
                            {label}
                          </span>
                          {i === 0 && <span className="hidden h-px flex-1 bg-white/10 sm:block" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Step 1 */}
                {step === 1 && (
                  <div className="space-y-5">
                    <Field label="Full name" error={errors.fullName}>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                        placeholder="Your full name"
                        autoComplete="name"
                        className={inputClass}
                      />
                    </Field>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Email" error={errors.email}>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => update("email", e.target.value)}
                          placeholder="you@example.com"
                          autoComplete="email"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Phone / WhatsApp" error={errors.phone}>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => update("phone", e.target.value)}
                          placeholder="+234 ..."
                          autoComplete="tel"
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Check-in" error={errors.checkIn}>
                        <input
                          type="date"
                          min={today}
                          value={form.checkIn}
                          onChange={(e) => update("checkIn", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Check-out" error={errors.checkOut}>
                        <input
                          type="date"
                          min={form.checkIn || today}
                          value={form.checkOut}
                          onChange={(e) => update("checkOut", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Guests" error={errors.guests}>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={form.guests}
                          onChange={(e) => update("guests", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Rooms" error={errors.rooms}>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={form.rooms}
                          onChange={(e) => update("rooms", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <button
                      type="button"
                      onClick={goNext}
                      className="group mt-2 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#E59200] px-8 py-4 text-sm font-semibold text-[#0D1128] transition-colors duration-300 hover:bg-[#F5EFE6]"
                    >
                      <span>Continue</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                    <div>
                      <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F5EFE6]/50">
                        Budget per night
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {BUDGET_OPTIONS.map((option) => (
                          <Chip
                            key={option}
                            active={form.budgetRange === option}
                            onClick={() => update("budgetRange", option)}
                          >
                            {option}
                          </Chip>
                        ))}
                      </div>
                      {errors.budgetRange && (
                        <span className="mt-2 block text-xs text-red-400">
                          {errors.budgetRange}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F5EFE6]/50">
                        Preferred area (optional)
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {AREA_OPTIONS.map((option) => (
                          <Chip
                            key={option}
                            active={form.preferredArea === option}
                            onClick={() =>
                              update(
                                "preferredArea",
                                form.preferredArea === option ? "" : option
                              )
                            }
                          >
                            {option}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <Field label="Special requests (optional)">
                      <textarea
                        rows={3}
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        placeholder="Airport pickup, accessibility needs, breakfast included..."
                        className={`${inputClass} resize-none`}
                      />
                    </Field>

                    {submitError && (
                      <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        {submitError}
                      </p>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={submitting}
                        className="rounded-full border border-white/15 px-8 py-4 text-sm font-medium text-[#F5EFE6]/80 transition-colors duration-300 hover:border-white/40 hover:text-[#F5EFE6] disabled:opacity-50"
                      >
                        ← Back
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 rounded-full bg-[#E59200] px-8 py-4 text-sm font-semibold text-[#0D1128] transition-colors duration-300 hover:bg-[#F5EFE6] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Sending..." : "Submit booking request"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#00A5A8]/50 bg-[#00A5A8]/10 text-2xl text-[#00A5A8]">
                      ✓
                    </div>

                    <h3 className="font-display text-3xl text-[#F5EFE6]">
                      Request received
                    </h3>

                    <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/65 sm:text-base">
                      Thank you, {form.fullName.split(" ")[0]}. Our team will
                      review your request and reply to {form.email} with
                      available options.
                    </p>

                    {reference && (
                      <p className="mt-6 inline-block rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.25em] text-[#F5EFE6]/80">
                        Ref: {reference}
                      </p>
                    )}

                    <div>
                      <button
                        type="button"
                        onClick={reset}
                        className="mt-8 text-sm font-medium text-[#00A5A8] transition-colors duration-300 hover:text-[#F5EFE6]"
                      >
                        Make another request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}