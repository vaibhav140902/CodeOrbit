"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@codeorbit/ui";
import { usePlatformAuth } from "@/lib/auth-context";

export default function ForgotPasswordPage() {
  const { authEnabled, sendPasswordReset } = usePlatformAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMessage(null);

    if (!authEnabled) {
      setErrorMessage("Authentication service is connecting. Please check back shortly.");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setErrorMessage((err as Error).message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 brand-gradient text-xl font-bold sm:text-2xl">
            <Image src={BRAND.markPath} alt={`${BRAND.name} logo`} width={24} height={24} className="h-6 w-6 rounded-md" />
            {BRAND.name}
          </Link>
        </div>

        <div className="surface-card p-5 sm:p-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Reset Password</h1>
          <p className="text-muted mt-2 mb-6 text-sm">
            Enter your account email address and we will send you a password reset link.
          </p>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
                <p className="font-bold">Password Reset Email Dispatched</p>
                <p className="mt-1 text-slate-300">
                  If an account exists for <span className="font-mono text-emerald-200">{email}</span>, you will receive password reset instructions.
                </p>
              </div>
              <Link href="/login" className="btn-primary block w-full py-2.5 text-center text-xs font-semibold">
                Back to Sign in →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-soft">Account Email</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input w-full"
                  required
                  disabled={loading}
                />
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-65"
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>

              <div className="text-center text-xs text-muted pt-2">
                Remember your password?{" "}
                <Link href="/login" className="font-semibold text-[color:var(--accent)] hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
