// app/admin/login/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login, saveSession, ApiError } from "../../../lib/admin/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(username.trim(), password);
      saveSession(result.token, {
        full_name: result.full_name,
        role: result.role,
      });

      if (result.must_change_password) {
        router.push("/admin/change-password");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Couldn't reach the server. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="tricolor-rule mx-auto mb-6">
            <span />
            <span />
            <span />
          </div>
          <h1 className="font-display text-3xl text-cream">Admin access</h1>
          <p className="mt-2 font-body text-sm text-muted">
            Sign in to manage the showcase.
          </p>
        </div>

        <div className="border border-ink-raised bg-ink-raised/40 rounded-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block font-body text-sm text-muted-on-paper mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-ink border border-ink-raised rounded-sm px-4 py-2.5 font-body text-cream placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-body text-sm text-muted-on-paper mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink border border-ink-raised rounded-sm px-4 py-2.5 font-body text-cream placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
              />
            </div>

            {error && (
              <p className="font-body text-sm text-red" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-ink font-body font-medium rounded-sm py-2.5 mt-2 hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ink disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
