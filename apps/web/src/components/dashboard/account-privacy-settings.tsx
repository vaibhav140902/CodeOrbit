"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatformAuth } from "@/lib/auth-context";
import { platformApi } from "@/lib/platform-api";
import { Button } from "@codeorbit/ui";

export function AccountPrivacySettings() {
  const router = useRouter();
  const { user, profile, signOutCurrentUser } = usePlatformAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setErrorMessage(null);
    try {
      const result = await platformApi.deleteAccountAndData();
      setStatusMessage(result.message);

      // Attempt to delete client Firebase auth credentials if supported
      try {
        await user.delete();
      } catch (authErr) {
        console.warn("Client auth delete fallback to signOut:", authErr);
      }

      await signOutCurrentUser();
      setTimeout(() => {
        router.push("/?deleted=true");
      }, 2000);
    } catch (err) {
      console.error("Account deletion failed:", err);
      setErrorMessage(
        (err as Error).message || "Could not complete account deletion. Please try again."
      );
      setDeleting(false);
    }
  };

  return (
    <section className="surface-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
        <div>
          <span className="eyebrow-chip">DPDP Act 2023 Compliance</span>
          <h2 className="text-xl font-bold sm:text-2xl mt-1">Data Privacy & Account Controls</h2>
          <p className="text-xs text-soft mt-1">
            Under India's Digital Personal Data Protection Act 2023, you have full control over your candidate personal data, code telemetry, and account lifecycle.
          </p>
        </div>
        <div className="text-xs text-muted font-mono">
          UID: {user.uid.slice(0, 12)}...
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)] space-y-1.5">
          <h3 className="text-sm font-semibold text-[color:var(--text-main)]">Right to Purpose Limitation</h3>
          <p className="text-xs text-soft leading-relaxed">
            Your code submissions and mock interview recordings are evaluated solely to calculate your candidate readiness score and campus placement eligibility. They are never sold to external data brokers.
          </p>
        </div>

        <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)] space-y-1.5">
          <h3 className="text-sm font-semibold text-[color:var(--text-main)]">Right to Data Erasure (Section 12)</h3>
          <p className="text-xs text-soft leading-relaxed">
            You may request complete and permanent deletion of your profile, code submissions, proctoring events, and assessment history at any time without fee or restriction.
          </p>
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs text-emerald-300">
          ✓ {statusMessage} Redirecting to homepage...
        </div>
      ) : (
        <div className="border-t border-rose-500/20 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-rose-400">Danger Zone: Permanent Account & Data Erasure</h4>
            <p className="text-xs text-soft mt-0.5">
              Permanently purges all profile records, IDE submissions, interview scorecards, and billing links. This action cannot be reversed.
            </p>
          </div>

          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              Delete My Data & Account
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                {deleting ? "Purging Data..." : "Confirm Permanent Erasure"}
              </Button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="px-3 py-2 text-xs rounded-lg border border-[color:var(--border)] text-muted hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-rose-400">{errorMessage}</p>
      )}
    </section>
  );
}
