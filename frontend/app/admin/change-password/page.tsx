// app/admin/change-password/page.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  changePassword,
  getToken,
  getAdminProfile,
  saveSession,
  ApiError,
} from "../../../lib/admin/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // No token at all -> straight back to login
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    setChecking(false);
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);

      // Refresh the stored profile flag so route guards elsewhere know
      // must_change_password is now resolved.
      const profile = getAdminProfile();
      const token = getToken();
      if (profile && token) {
        saveSession(token, profile);
      }

      router.push("/admin/dashboard");
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

  if (checking) return null;

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="tricolor-rule mx-auto mb-6">
            <span />
            <span />
            <span />
          </div>
          <h1 className="font-display text-3xl text-cream">
            Set a new password
          </h1>
          <p className="mt-2 font-body text-sm text-muted">
            You're using a temporary password. Choose a permanent one to
            continue.
          </p>
        </div>

        <div className="border border-ink-raised bg-ink-raised/40 rounded-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="current"
                className="block font-body text-sm text-muted-on-paper mb-2"
              >
                Temporary password
              </label>
              <input
                id="current"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-ink border border-ink-raised rounded-sm px-4 py-2.5 font-body text-cream placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="new"
                className="block font-body text-sm text-muted-on-paper mb-2"
              >
                New password
              </label>
              <input
                id="new"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-ink border border-ink-raised rounded-sm px-4 py-2.5 font-body text-cream placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
              />
              <p className="mt-1.5 font-body text-xs text-muted">
                At least 8 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block font-body text-sm text-muted-on-paper mb-2"
              >
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
