"use client";

import { useState } from "react";
import Link from "next/link";

export default function PitcherRegistrationPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    project_name: "",
    category: "",
    pitch_summary: "",
    work_sample_url: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/pitcher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Request failed");

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <div className="tricolor-rule mx-auto mb-6">
          <span /><span /><span />
        </div>
        <h1 className="font-display text-3xl text-cream sm:text-4xl">
          Application Submitted
        </h1>
        <div className="mt-8 rounded-2xl border border-gold/30 bg-ink-raised px-8 py-10">
          <p className="text-muted">Check your email at</p>
          <p className="mt-2 font-display text-xl text-gold">{form.email}</p>
          <p className="mt-4 text-muted">
            for your reference number. Your application is pending review — applying does not guarantee a pitching slot.
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register/lookup"
            className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            Check Status Later
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
          >
            Back to homepage
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Pitching Application
      </h1>
      <p className="mt-3 text-muted">
        Pitch your project in the Deal Room. Applying does not guarantee a pitching slot.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border border-gold/20 bg-ink-raised px-6 py-8 sm:px-8 sm:py-10">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-muted">Full Name</label>
            <input
              required
              type="text"
              placeholder="e.g. John Doe"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Email</label>
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Phone</label>
            <input
              required
              type="tel"
              placeholder="080X XXX XXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Project Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Naija Stream Studios"
              value={form.project_name}
              onChange={(e) => setForm({ ...form, project_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Category</label>
            <input
              required
              type="text"
              placeholder="e.g. Film, TV Series, Music, Tech, Fashion"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Pitch Summary</label>
            <textarea
              rows={4}
              placeholder="Briefly summarize what you're pitching and why it matters"
              value={form.pitch_summary}
              onChange={(e) => setForm({ ...form, pitch_summary: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-muted">Work Sample Link</label>
            <input
              type="url"
              placeholder="https://link-to-your-sample.com"
              value={form.work_sample_url}
              onChange={(e) => setForm({ ...form, work_sample_url: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-gold"
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red">Something went wrong — please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105 disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </main>
  );
}