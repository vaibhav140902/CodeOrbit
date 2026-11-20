"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND } from "@codeorbit/ui";
import { getFirebaseClientServices } from "@/lib/firebase/client";
import { confirmPasswordReset } from "firebase/auth";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || "";

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (!oobCode) {
      setErrorMessage("Invalid or expired password reset link. Please request a new one.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const services = await getFirebaseClientServices();
      if (!services) throw new Error("Firebase auth services unavailable.");
      await confirmPasswordReset(services.auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err) {
      setErrorMessage((err as Error).message || "Failed to reset password.");
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
          <h1 className="text-2xl font-bold sm:text-3xl">Set New Password</h1>
          <p className="text-muted mt-2 mb-6 text-sm">Create a strong new password for your CodeOrbit account.</p>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
                <p className="font-bold">Password Reset Successful</p>
                <p className="mt-1 text-slate-300">Your password has been updated. You can now log in with your new credentials.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="btn-primary block w-full py-2.5 text-center text-xs font-semibold"
              >
                Sign In Now →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-soft">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="field-input w-full"
                  required
                  minLength={6}
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
                {loading ? "Updating password..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell flex items-center justify-center p-8">
          <div className="surface-card p-6 text-center animate-pulse text-xs text-muted">
            Loading reset session...
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
