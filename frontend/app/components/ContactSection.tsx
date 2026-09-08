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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

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
      className="relative z-10 border-b border-white/10 bg-ink-raised"
    >
      <div className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        {/* Intro */}
        <Reveal>
          <div className="tricolor-rule mx-auto mb-6">
            <span />
            <span />
            <span />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display text-3xl text-cream sm:text-4xl">
            Have a question?
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <p className="mt-3 text-muted">
            Send us a quick message and we&apos;ll get back to you.
          </p>
        </Reveal>

        {/* Open button */}
        {!open && status !== "success" && (
          <Reveal delay={230} distance={20}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative z-20 mt-8 inline-flex cursor-pointer touch-manipulation items-center justify-center rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-red/90"
            >
              Ask a question
            </button>
          </Reveal>
        )}

        {/* Success */}
        {status === "success" && (
          <Reveal distance={20}>
            <div className="relative z-20 mt-8 rounded-2xl border border-teal/30 bg-ink px-6 py-8">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-teal/40 text-teal">
                ✓
              </div>

              <p className="mt-4 text-cream">
                Thanks for reaching out! We&apos;ll get back to you shortly —
                keep an eye on your email for our response.
              </p>
            </div>
          </Reveal>
        )}

        {/* Form */}
        {open && status !== "success" && (
          <Reveal distance={20}>
            <form
              onSubmit={handleSubmit}
              className="relative z-20 mt-8 space-y-5 text-left"
            >
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm text-muted"
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
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none transition-colors duration-300 placeholder:text-muted/50 focus:border-teal"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm text-muted"
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
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none transition-colors duration-300 focus:border-teal"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm text-muted"
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
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none transition-colors duration-300 focus:border-teal"
                />
              </div>

              <div>
                <label
                  htmlFor="question"
                  className="block text-sm text-muted"
                >
                  Your Question
                </label>

                <textarea
                  id="question"
                  required
                  rows={4}
                  value={form.question}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      question: e.target.value,
                    })
                  }
                  className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none transition-colors duration-300 focus:border-teal"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red">
                  Something went wrong — please try again.
                </p>
              )}

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="relative z-20 cursor-pointer touch-manipulation rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-red/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "submitting"
                    ? "Sending..."
                    : "Send message"}
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="relative z-20 cursor-pointer touch-manipulation text-sm text-muted transition-colors duration-300 hover:text-cream"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Reveal>
        )}
      </div>
    </section>
  );
}