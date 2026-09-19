"use client";

import { useState } from "react";
import Reveal from "./Reveal";

export default function ContactSection() {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    question: "",
  });

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
      }

      const res = await fetch(`${apiUrl}/contact/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Request failed");

      setStatus("success");

      setForm({
        full_name: "",
        email: "",
        phone: "",
        question: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
    }
  }

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-16 h-56 w-56 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-16 h-40 w-40 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8 md:py-28">
        <div className="text-center">
          <Reveal>
            <div className="tricolor-rule mx-auto mb-6">
              <span />
              <span />
              <span />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
              Connect With Us
            </p>
          </Reveal>

          <Reveal delay={140}>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
              Get in Touch
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#B8B3AA]/70 sm:text-lg">
              Whether you have a question, partnership idea, media enquiry, or
              simply want to connect, we&apos;d love to hear from you.
            </p>
          </Reveal>
        </div>

        {!open && status !== "success" && (
          <Reveal delay={280} distance={20}>
            <div className="mt-9 text-center">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="relative z-20 inline-flex cursor-pointer touch-manipulation items-center justify-center rounded-full bg-[#B80319] px-7 py-3.5 text-sm font-medium text-[#F5EFE6] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(184,3,25,0.18)]"
              >
                Start a Conversation →
              </button>
            </div>
          </Reveal>
        )}

        {status === "success" && (
          <Reveal distance={20}>
            <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-[#00A5A8]/25 bg-[#151A3A] px-6 py-9 text-center shadow-[0_25px_60px_rgba(0,0,0,0.14)] sm:px-8">
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 h-1 w-full bg-[#00A5A8]"
              />

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10 text-[#00A5A8]">
                ✓
              </div>

              <h3 className="mt-5 font-display text-2xl text-[#F5EFE6]">
                Message Received
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#B8B3AA]/65">
                Thanks for reaching out. Our team will get back to you shortly
                — keep an eye on your email for our response.
              </p>
            </div>
          </Reveal>
        )}

        {open && status !== "success" && (
          <Reveal distance={20}>
            <form
              onSubmit={handleSubmit}
              className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.16)] sm:p-8"
            >
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
              />

              <div className="space-y-6">
                {/* Full Name + Phone */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="full_name"
                      className="block text-sm font-medium text-[#F5EFE6]/75"
                    >
                      Full Name
                    </label>

                    <input
                      id="full_name"
                      required
                      type="text"
                      value={form.full_name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          full_name: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] outline-none transition-colors duration-300 placeholder:text-[#B8B3AA]/35 focus:border-[#00A5A8]/60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-[#F5EFE6]/75"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          phone: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] outline-none transition-colors duration-300 placeholder:text-[#B8B3AA]/35 focus:border-[#00A5A8]/60"
                    />
                  </div>
                </div>

                {/* Email — full width */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#F5EFE6]/75"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] outline-none transition-colors duration-300 placeholder:text-[#B8B3AA]/35 focus:border-[#00A5A8]/60"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="question"
                    className="block text-sm font-medium text-[#F5EFE6]/75"
                  >
                    Your Message
                  </label>

                  <textarea
                    id="question"
                    required
                    rows={5}
                    placeholder="Tell us how we can help or what you'd like to discuss."
                    value={form.question}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        question: e.target.value,
                      })
                    }
                    className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#11152F] px-4 py-3.5 text-[#F5EFE6] outline-none transition-colors duration-300 placeholder:text-[#B8B3AA]/35 focus:border-[#00A5A8]/60"
                  />
                </div>

                {status === "error" && (
                  <div className="rounded-xl border border-[#B80319]/30 bg-[#B80319]/10 px-4 py-3">
                    <p className="text-sm text-[#F5EFE6]/80">
                      Something went wrong — please try again.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="relative z-20 cursor-pointer touch-manipulation rounded-full bg-[#B80319] px-7 py-3.5 text-sm font-medium text-[#F5EFE6] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(184,3,25,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "submitting"
                      ? "Sending..."
                      : "Send Message →"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="relative z-20 cursor-pointer touch-manipulation rounded-full border border-white/10 px-6 py-3.5 text-sm text-[#B8B3AA]/60 transition-colors duration-300 hover:border-white/20 hover:text-[#F5EFE6]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </Reveal>
        )}

        <Reveal delay={360}>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/30">
              Abuja · Africa
            </span>
            <span className="h-px w-10 bg-white/10" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}