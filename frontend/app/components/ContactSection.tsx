"use client";

import { useState } from "react";

export default function ContactSection() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", question: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Request failed");

      setStatus("success");
      setForm({ full_name: "", email: "", phone: "", question: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="border-b border-white/10 bg-ink-raised">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <div className="tricolor-rule mx-auto mb-6">
          <span /><span /><span />
        </div>
        <h2 className="font-display text-3xl text-cream sm:text-4xl">
          Have a question?
        </h2>
        <p className="mt-3 text-muted">
          Send us a quick message and we&apos;ll get back to you.
        </p>

        {!open && status !== "success" && (
          <button
            onClick={() => setOpen(true)}
            className="mt-8 rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-transform hover:scale-105"
          >
            Ask a question
          </button>
        )}

        {status === "success" && (
          <div className="mt-8 rounded-2xl border border-teal/30 bg-ink px-6 py-8">
            <p className="text-cream">Thanks for reaching out! We&apos;ll get back to you shortly — keep an eye on your email for our response.</p>
          </div>
        )}

        {open && status !== "success" && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left">
            <div>
              <label className="block text-sm text-muted">Full Name</label>
              <input
                required
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-sm text-muted">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-sm text-muted">Phone</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-sm text-muted">Your Question</label>
              <textarea
                required
                rows={4}
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-teal"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red">Something went wrong — please try again.</p>
            )}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-transform hover:scale-105 disabled:opacity-50"
              >
                {status === "submitting" ? "Sending..." : "Send message"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted hover:text-cream"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}