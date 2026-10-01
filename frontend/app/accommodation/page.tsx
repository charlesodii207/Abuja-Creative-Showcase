import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "../components/Reveal";
import BookingForm from "./BookingForm";

export const metadata: Metadata = {
  title: "Book Accommodation | Afriqa Creative Showcase 2026",
  description:
    "Tell us your dates and budget and we will match you with a hotel in Abuja for Afriqa Creative Showcase 2026.",
};

export default function AccommodationPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#11152F]">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 md:pb-28 md:pt-14 lg:px-10">
        <Link
          href="/"
          className="group mb-10 inline-flex items-center gap-3 text-sm font-medium text-[#00A5A8] transition-colors duration-300 hover:text-[#F5EFE6]"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>
          <span>Back to home</span>
        </Link>

        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Copy */}
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
              <h1 className="max-w-xl font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
                Find a place to stay in Abuja
              </h1>
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

          {/* Form */}
          <Reveal delay={120}>
            <BookingForm />
          </Reveal>
        </div>
      </div>
    </main>
  );
}