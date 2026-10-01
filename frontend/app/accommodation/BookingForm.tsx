"use client";

import { Fragment, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const BOOKING_ENDPOINT = `${API_URL}/hotel-bookings`;

// Change this to wherever your privacy policy page lives
const PRIVACY_POLICY_URL = "/privacy-policy";

// Room and guest rules
const ADULTS_PER_ROOM = 2; // standard room
const ADULTS_PER_ROOM_EXTRA_BED = 3; // with an extra bed / rollaway
const CHILD_MAX_AGE = 12; // children under this age share the parents' bed
const MAX_ADULTS = 20;
const MAX_CHILDREN = 10;
const MAX_ROOMS = 10;
const MAX_NIGHTS = 30;

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
  nights: string;
  adults: string;
  children: string;
  rooms: string;
  extraBed: boolean;
  budgetRange: string;
  preferredArea: string;
  notes: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  checkIn: "",
  nights: "1",
  adults: "1",
  children: "0",
  rooms: "1",
  extraBed: false,
  budgetRange: "",
  preferredArea: "",
  notes: "",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#F5EFE6] placeholder:text-white/30 outline-none transition-colors duration-200 focus:border-[#E59200]/70 [color-scheme:dark]";

function toDateString(date: Date): string {
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Adds days to a YYYY-MM-DD date using local time (avoids timezone shifts)
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toDateString(new Date(y, m - 1, d + days));
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function minRoomsFor(adults: number, extraBed: boolean) {
  const perRoom = extraBed ? ADULTS_PER_ROOM_EXTRA_BED : ADULTS_PER_ROOM;
  return Math.ceil(adults / perRoom);
}

// Keeps rooms between "enough for all adults" and "one adult per room"
function normalizeRooms(adults: number, rooms: number, extraBed: boolean) {
  const min = minRoomsFor(adults, extraBed);
  const max = Math.min(MAX_ROOMS, adults);
  return Math.min(Math.max(rooms, min), max);
}

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

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  singular,
  plural,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  singular: string;
  plural: string;
  onChange: (next: number) => void;
}) {
  const buttonClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-xl leading-none text-[#F5EFE6] transition-colors duration-200 hover:border-[#E59200] hover:text-[#E59200] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-[#F5EFE6]";

  return (
    <div>
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F5EFE6]/50">
        {label}
      </span>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={buttonClass}
        >
          −
        </button>

        <div className="text-center" aria-live="polite">
          <span className="block text-xl font-semibold text-[#F5EFE6]">{value}</span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40">
            {value === 1 ? singular : plural}
          </span>
        </div>

        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={buttonClass}
        >
          +
        </button>
      </div>

      {hint && (
        <span className="mt-2 block text-xs leading-relaxed text-white/40">{hint}</span>
      )}
    </div>
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

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F5EFE6]/50">
          {title}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-[#00A5A8] transition-colors duration-300 hover:text-[#F5EFE6]"
        >
          Edit
        </button>
      </div>

      <dl className="space-y-3">{children}</dl>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="text-sm text-white/45">{label}</dt>
      <dd className="break-words text-sm text-[#F5EFE6] sm:text-right">{value}</dd>
    </div>
  );
}

export default function BookingForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reference, setReference] = useState("");

  const today = toDateString(new Date());

  const adults = Number(form.adults);
  const children = Number(form.children);
  const rooms = Number(form.rooms);
  const nights = Number(form.nights);

  const minRooms = minRoomsFor(adults, form.extraBed);
  const maxRooms = Math.min(MAX_ROOMS, adults);

  const checkOut = form.checkIn ? addDays(form.checkIn, nights) : "";

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const changeAdults = (next: number) => {
    setForm((prev) => ({
      ...prev,
      adults: String(next),
      rooms: String(normalizeRooms(next, Number(prev.rooms), prev.extraBed)),
    }));
  };

  const toggleExtraBed = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      extraBed: checked,
      rooms: String(normalizeRooms(Number(prev.adults), Number(prev.rooms), checked)),
    }));
  };

  const validateStep1 = () => {
    const next: Errors = {};

    if (form.fullName.trim().length < 2) next.fullName = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a valid phone number.";
    if (!form.checkIn) next.checkIn = "Choose your arrival date.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = () => {
    const next: Errors = {};
    if (!form.budgetRange) next.budgetRange = "Select a budget range.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (validateStep1()) setStep(2);
  };

  const goReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consent) {
      setConsentError("Please accept the privacy policy to submit your request.");
      return;
    }

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
          check_out: checkOut,
          nights,
          adults,
          children,
          guests: adults + children,
          rooms,
          extra_bed_requested: form.extraBed,
          budget_range: form.budgetRange,
          preferred_area: form.preferredArea || null,
          notes: form.notes.trim() || null,
          privacy_accepted: true,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json().catch(() => ({}));
      setReference(String(data.reference ?? data.id ?? ""));
      setStep(4);
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
    setConsent(false);
    setConsentError("");
    setReference("");
    setSubmitError("");
    setStep(1);
  };

  const steps = ["Details", "Preferences", "Review"];

  const summary = [
    `${nights} ${nights === 1 ? "night" : "nights"}`,
    `${adults} ${adults === 1 ? "adult" : "adults"}`,
    children > 0 ? `${children} ${children === 1 ? "child" : "children"}` : null,
    `${rooms} ${rooms === 1 ? "room" : "rooms"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="absolute inset-3 rounded-[2.5rem] border border-[#E59200]/30 sm:inset-5" />

      <div className="absolute -bottom-1 -left-1 h-24 w-24 rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10 blur-[1px] sm:h-28 sm:w-28" />

      <div className="relative rounded-[2.5rem] rounded-br-[5rem] rounded-tl-[1rem] border border-white/10 bg-[#0D1128] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.22)] sm:p-10">
        {step !== 4 && (
          <div className="mb-8 flex items-center gap-3">
            {steps.map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <Fragment key={label}>
                  <div className="flex items-center gap-2.5">
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
                        active ? "inline text-[#F5EFE6]" : "hidden text-[#F5EFE6]/40 sm:inline"
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  {i < steps.length - 1 && (
                    <span className="h-px min-w-3 flex-1 bg-white/10" />
                  )}
                </Fragment>
              );
            })}
          </div>
        )}

        {/* Step 1: details */}
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

            {/* Dates: arrival + nights */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Arrival date" error={errors.checkIn}>
                <input
                  type="date"
                  min={today}
                  value={form.checkIn}
                  onChange={(e) => update("checkIn", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Stepper
                label="Nights"
                value={nights}
                min={1}
                max={MAX_NIGHTS}
                singular="night"
                plural="nights"
                onChange={(n) => update("nights", String(n))}
              />
            </div>

            {checkOut && (
              <p className="-mt-1 rounded-xl border border-[#00A5A8]/25 bg-[#00A5A8]/10 px-4 py-3 text-sm text-[#F5EFE6]/80">
                Check-out: <span className="font-semibold">{formatDate(checkOut)}</span>
              </p>
            )}

            {/* Guests */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Stepper
                label="Adults"
                hint={`Aged ${CHILD_MAX_AGE} and above. A standard room fits ${ADULTS_PER_ROOM} adults.`}
                value={adults}
                min={1}
                max={MAX_ADULTS}
                singular="adult"
                plural="adults"
                onChange={changeAdults}
              />

              <Stepper
                label={`Children (under ${CHILD_MAX_AGE})`}
                hint="Usually stay free when sharing a bed with parents. Policies vary by hotel."
                value={children}
                min={0}
                max={MAX_CHILDREN}
                singular="child"
                plural="children"
                onChange={(n) => update("children", String(n))}
              />
            </div>

            <Stepper
              label="Rooms needed"
              hint="Each room needs at least 1 adult. Rooms are set to fit all adults."
              value={rooms}
              min={minRooms}
              max={maxRooms}
              singular="room"
              plural="rooms"
              onChange={(n) => update("rooms", String(n))}
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <input
                type="checkbox"
                checked={form.extraBed}
                onChange={(e) => toggleExtraBed(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#E59200]"
              />
              <span className="text-sm leading-relaxed text-white/65">
                <span className="font-medium text-[#F5EFE6]">
                  A third adult can share a room (extra bed)
                </span>
                <br />
                An extra person fee may apply, depending on the hotel and room size.
              </span>
            </label>

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

        {/* Step 2: budget and preferences */}
        {step === 2 && (
          <form onSubmit={goReview} className="space-y-7" noValidate>
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

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-white/15 px-8 py-4 text-sm font-medium text-[#F5EFE6]/80 transition-colors duration-300 hover:border-white/40 hover:text-[#F5EFE6]"
              >
                ← Back
              </button>

              <button
                type="submit"
                className="group flex-1 rounded-full bg-[#E59200] px-8 py-4 text-sm font-semibold text-[#0D1128] transition-colors duration-300 hover:bg-[#F5EFE6]"
              >
                <span>Review request</span>
                <span className="ml-3 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Step 3: review and consent */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <h3 className="font-display text-2xl text-[#F5EFE6]">
                Review your request
              </h3>
              <p className="mt-2 text-sm text-white/55">
                Check everything below before you submit.
              </p>
            </div>

            <div className="space-y-4">
              <ReviewBlock title="Contact" onEdit={() => setStep(1)}>
                <ReviewRow label="Name" value={form.fullName.trim()} />
                <ReviewRow label="Email" value={form.email.trim()} />
                <ReviewRow label="Phone" value={form.phone.trim()} />
              </ReviewBlock>

              <ReviewBlock title="Your stay" onEdit={() => setStep(1)}>
                <ReviewRow label="Arrival" value={formatDate(form.checkIn)} />
                <ReviewRow label="Check-out" value={formatDate(checkOut)} />
                <ReviewRow
                  label="Length of stay"
                  value={`${nights} ${nights === 1 ? "night" : "nights"}`}
                />
                <ReviewRow
                  label="Adults"
                  value={`${adults}`}
                />
                <ReviewRow
                  label={`Children (under ${CHILD_MAX_AGE})`}
                  value={`${children}`}
                />
                <ReviewRow
                  label="Rooms"
                  value={`${rooms}`}
                />
                {form.extraBed && (
                  <ReviewRow
                    label="Extra bed"
                    value="Third adult may share a room (extra fee may apply)"
                  />
                )}
              </ReviewBlock>

              <ReviewBlock title="Preferences" onEdit={() => setStep(2)}>
                <ReviewRow label="Budget per night" value={form.budgetRange} />
                <ReviewRow
                  label="Preferred area"
                  value={form.preferredArea || "Not specified"}
                />
                <ReviewRow
                  label="Special requests"
                  value={form.notes.trim() || "None"}
                />
              </ReviewBlock>
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked) setConsentError("");
                  }}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#E59200]"
                />
                <span className="text-sm leading-relaxed text-white/65">
                  I have read and agree to the{" "}
                  <Link
                    href={PRIVACY_POLICY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#00A5A8] underline underline-offset-2 transition-colors duration-300 hover:text-[#F5EFE6]"
                  >
                    Privacy Policy
                  </Link>
                  . I understand my details will be used to process this request and
                  may be shared with partner hotels.
                </span>
              </label>

              {consentError && (
                <span className="mt-2 block text-xs text-red-400">{consentError}</span>
              )}
            </div>

            {submitError && (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {submitError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(2)}
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

        {/* Step 4: confirmation */}
        {step === 4 && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#00A5A8]/50 bg-[#00A5A8]/10 text-2xl text-[#00A5A8]">
              ✓
            </div>

            <h3 className="font-display text-3xl text-[#F5EFE6]">
              Request received
            </h3>

            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/65 sm:text-base">
              Thank you, {form.fullName.trim().split(" ")[0]}. Our team will review
              your request and reply to {form.email.trim()} with available options.
            </p>

            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[#F5EFE6]/50">
              {summary}
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
  );
}