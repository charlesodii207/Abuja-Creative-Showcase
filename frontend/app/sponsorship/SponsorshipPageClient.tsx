"use client";

import { useState } from "react";

type Tier = {
  name: string;
  price: string;
  usd: string;
  color: string;
  benefits: string[];
  icon: React.ReactNode;
};

function TitleMark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-14 w-14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 5L29 19L43 24L29 29L24 43L19 29L5 24L19 19L24 5Z"
        stroke={color}
        strokeWidth="1.25"
      />
      <path
        d="M24 13L27.5 20.5L35 24L27.5 27.5L24 35L20.5 27.5L13 24L20.5 20.5L24 13Z"
        stroke={color}
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

function PresentingMark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-14 w-14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 24H17M31 24H42M24 6V17M24 31V42"
        stroke={color}
        strokeWidth="1.25"
      />
      <circle cx="24" cy="24" r="7" stroke={color} strokeWidth="1.25" />
      <circle
        cx="24"
        cy="24"
        r="13"
        stroke={color}
        strokeWidth="1"
        opacity="0.45"
      />
    </svg>
  );
}

function StrategicMark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-14 w-14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 7L39 16V32L24 41L9 32V16L24 7Z"
        stroke={color}
        strokeWidth="1.25"
      />
      <path
        d="M15 24H33M24 15V33"
        stroke={color}
        strokeWidth="1"
        opacity="0.65"
      />
      <circle cx="24" cy="24" r="4" stroke={color} strokeWidth="1" />
    </svg>
  );
}

function ProgrammeMark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-14 w-14"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="9"
        y="9"
        width="30"
        height="30"
        rx="2"
        stroke={color}
        strokeWidth="1.25"
      />
      <path
        d="M16 17H32M16 24H32M16 31H27"
        stroke={color}
        strokeWidth="1"
        opacity="0.7"
      />
    </svg>
  );
}

function SupportingMark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-14 w-14"
      fill="none"
      aria-hidden="true"
    >
      <path d="M8 34L24 9L40 34" stroke={color} strokeWidth="1.25" />
      <path
        d="M15 34L24 19L33 34"
        stroke={color}
        strokeWidth="1"
        opacity="0.55"
      />
      <path
        d="M19 34L24 26L29 34"
        stroke={color}
        strokeWidth="1"
        opacity="0.35"
      />
    </svg>
  );
}

function MediaMark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-14 w-14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="16" stroke={color} strokeWidth="1.25" />
      <path
        d="M19 17L32 24L19 31V17Z"
        stroke={color}
        strokeWidth="1.25"
      />
      <path
        d="M24 8V12M24 36V40M8 24H12M36 24H40"
        stroke={color}
        strokeWidth="1"
        opacity="0.55"
      />
    </svg>
  );
}

const tiers: Tier[] = [
  {
    name: "Title Partner",
    price: "₦100M+",
    usd: "$100K+",
    color: "#E59200",
    benefits: [
      "Naming rights",
      "Premier main-stage branding",
      "Opening speaking slot",
      "Category exclusivity",
      "Largest activation space",
    ],
    icon: <TitleMark color="#E59200" />,
  },
  {
    name: "Presenting Partner",
    price: "₦50M – ₦75M",
    usd: "$50K – $75K",
    color: "#00A5A8",
    benefits: [
      "Co-branding across major touchpoints",
      "Speaking opportunity",
      "Large activation space",
    ],
    icon: <PresentingMark color="#00A5A8" />,
  },
  {
    name: "Strategic Partner",
    price: "₦20M – ₦40M",
    usd: "$20K – $40K",
    color: "#B80319",
    benefits: [
      "Finance Forum or Pitch & Deal Room sponsorship",
      "Branded session naming",
    ],
    icon: <StrategicMark color="#B80319" />,
  },
  {
    name: "Programme Partner",
    price: "₦10M – ₦15M",
    usd: "$10K – $15K",
    color: "#E59200",
    benefits: [
      "Sector-specific branding",
      "Film / Music / Fashion / Tech / Youth",
      "Session sponsorship",
    ],
    icon: <ProgrammeMark color="#E59200" />,
  },
  {
    name: "Supporting Partner",
    price: "₦5M – ₦10M",
    usd: "$5K – $10K",
    color: "#F5EFE6",
    benefits: [
      "Logo placement",
      "Mentions",
      "Limited activation",
      "Ideal for logistics or catering partners",
    ],
    icon: <SupportingMark color="#F5EFE6" />,
  },
  {
    name: "Media Partner",
    price: "In-kind",
    usd: "In-kind",
    color: "#00A5A8",
    benefits: [
      "Official media partner credit",
      "Content collaboration",
      "Interview access",
    ],
    icon: <MediaMark color="#00A5A8" />,
  },
];

export default function SponsorshipPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("");

  function handlePackageSelect(packageName: string) {
    setSelectedPackage(packageName);

    const enquirySection = document.getElementById(
      "partnership-enquiry"
    );

    if (enquirySection) {
      enquirySection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sponsorship/inquiry`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: form.get("full_name"),
            organization_name: form.get("organization_name"),
            role: form.get("role"),
            email: form.get("email"),
            phone: form.get("phone"),
            package_interest: form.get("package_interest") || null,
            message: form.get("message"),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Unable to submit enquiry");
      }

      setSubmitted(true);

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    } catch {
      alert("We couldn't submit your enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-[45%] h-72 w-72 rounded-full border border-[#00A5A8]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-40 h-96 w-96 -translate-x-1/2 rounded-full bg-[#B80319]/[0.035] blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="tricolor-rule mb-7">
            <span />
            <span />
            <span />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#E59200] sm:text-xs">
            Partnerships · ACS 2026
          </p>

          <h1 className="mt-4 font-display text-4xl leading-[1.02] text-[#F5EFE6] sm:text-5xl md:text-6xl">
            Partnership Packages
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/70 sm:text-lg">
            Strategic opportunities for brands, organisations and institutions
            to connect with Africa&apos;s creative ecosystem.
          </p>

          <button
            type="button"
            onClick={() => handlePackageSelect("")}
            className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/45 transition-colors hover:text-[#00A5A8]"
          >
            Start a partnership enquiry
            <span className="text-[#00A5A8]">↓</span>
          </button>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <button
              key={tier.name}
              type="button"
              onClick={() => handlePackageSelect(tier.name)}
              aria-label={`Enquire about ${tier.name}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151A3A] px-6 py-8 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[#181E40] focus:outline-none focus:ring-2 focus:ring-[#00A5A8]/50"
            >
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 h-[2px] w-full opacity-70"
                style={{ backgroundColor: tier.color }}
              />

              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 h-32 w-32 rounded-full blur-3xl opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.12]"
                style={{ backgroundColor: tier.color }}
              />

              <div className="relative flex flex-1 flex-col text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center">
                  {tier.icon}
                </div>

                <p className="mt-5 font-display text-xl text-[#F5EFE6]">
                  {tier.name}
                </p>

                <p
                  className="mt-2 font-display text-2xl"
                  style={{ color: tier.color }}
                >
                  {tier.price}
                </p>

                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#B8B3AA]/40">
                  {tier.usd}
                </p>

                <div className="mt-7 border-t border-dashed border-white/10 pt-6">
                  <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#F5EFE6]/30">
                    Key Benefits
                  </p>

                  <div className="space-y-3">
                    {tier.benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-start justify-center gap-2 text-sm leading-relaxed text-[#B8B3AA]/65"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: tier.color }}
                        />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/35 transition-colors group-hover:text-[#00A5A8]">
                  Explore partnership
                  <span className="transition-transform duration-300 group-hover:translate-y-1">
                    ↓
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <section
          id="partnership-enquiry"
          className="relative mt-10 scroll-mt-8 overflow-hidden rounded-[1.75rem] border border-[#00A5A8]/20 bg-[#151A3A] px-6 py-10 sm:px-8 md:px-10"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A5A8]/50 to-transparent"
          />

          {!submitted ? (
            <>
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
                  Partnership Enquiry
                </p>

                <h2 className="mt-3 font-display text-3xl text-[#F5EFE6] sm:text-4xl">
                  Start a Partnership Conversation
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/65 sm:text-base">
                  Share a few details about your organisation and what you are
                  looking to achieve through a partnership with ACS.
                </p>
              </div>

              {selectedPackage && (
                <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-[#00A5A8]/20 bg-[#11152F] px-4 py-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00A5A8]" />
                  <span className="text-xs text-[#B8B3AA]/60">
                    Package selected:
                  </span>
                  <span className="text-xs font-semibold text-[#F5EFE6]">
                    {selectedPackage}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="full_name"
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/45"
                    >
                      Full Name
                    </label>

                    <input
                      id="full_name"
                      name="full_name"
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-sm text-[#F5EFE6] outline-none transition placeholder:text-[#B8B3AA]/30 focus:border-[#00A5A8]/50"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="organization_name"
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/45"
                    >
                      Organisation
                    </label>

                    <input
                      id="organization_name"
                      name="organization_name"
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-sm text-[#F5EFE6] outline-none transition placeholder:text-[#B8B3AA]/30 focus:border-[#00A5A8]/50"
                      placeholder="Company or organisation"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/45"
                    >
                      Role / Position
                    </label>

                    <input
                      id="role"
                      name="role"
                      className="w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-sm text-[#F5EFE6] outline-none transition placeholder:text-[#B8B3AA]/30 focus:border-[#00A5A8]/50"
                      placeholder="Your role"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/45"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-sm text-[#F5EFE6] outline-none transition placeholder:text-[#B8B3AA]/30 focus:border-[#00A5A8]/50"
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/45"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-sm text-[#F5EFE6] outline-none transition placeholder:text-[#B8B3AA]/30 focus:border-[#00A5A8]/50"
                      placeholder="Work email"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="package_interest"
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/45"
                    >
                      Partnership Package
                      <span className="ml-2 text-[#B8B3AA]/30">
                        Optional
                      </span>
                    </label>

                    <select
                      id="package_interest"
                      name="package_interest"
                      value={selectedPackage}
                      onChange={(event) =>
                        setSelectedPackage(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-sm text-[#F5EFE6] outline-none transition focus:border-[#00A5A8]/50"
                    >
                      <option value="">I&apos;m not sure yet</option>

                      {tiers.map((tier) => (
                        <option key={tier.name} value={tier.name}>
                          {tier.name}
                        </option>
                      ))}
                    </select>

                    <p className="mt-2 text-xs leading-relaxed text-[#B8B3AA]/40">
                      Not sure which package fits? Leave this blank and our
                      team will help you find the right partnership option.
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="message"
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/45"
                    >
                      Brief Details
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-sm text-[#F5EFE6] outline-none transition placeholder:text-[#B8B3AA]/30 focus:border-[#00A5A8]/50"
                      placeholder="Tell us briefly about your organisation and partnership interest..."
                    />
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-md text-xs leading-relaxed text-[#B8B3AA]/35">
                    Your enquiry will be reviewed by the ACS partnerships team.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center justify-center rounded-full bg-[#E59200] px-7 py-3.5 text-sm font-medium text-[#11152F] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(229,146,0,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Submit Partnership Enquiry"}

                    {!loading && (
                      <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#00A5A8]/30">
                <span className="text-2xl text-[#00A5A8]">✓</span>
              </div>

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
                Enquiry Received
              </p>

              <h2 className="mt-3 font-display text-3xl text-[#F5EFE6] sm:text-4xl">
                Thank You
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#B8B3AA]/65">
                Your partnership enquiry has been received. Our team will
                review the details and get back to you.
              </p>
            </div>
          )}
        </section>

        <div className="mx-auto mt-14 flex max-w-xl items-center justify-center gap-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#E59200]" />

          <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/30">
            Abuja · Africa
          </span>

          <span className="h-1.5 w-1.5 rounded-full bg-[#B80319]" />
          <span className="h-px flex-1 bg-white/10" />
        </div>
      </div>
    </main>
  );
}