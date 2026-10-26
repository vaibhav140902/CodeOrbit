"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePlatformAuth } from "@/lib/auth-context";
import { getFirebaseAuthMessage } from "@/lib/firebase/auth-errors";
import { BRAND } from "@codeorbit/ui";

export function SignupForm() {
  const router = useRouter();
  const { authEnabled, signInWithGoogle, signUpWithEmail } = usePlatformAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await signUpWithEmail(email, password, displayName.trim() || email.split("@")[0] || "User");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(getFirebaseAuthMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);

    try {
      await signInWithGoogle();
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(getFirebaseAuthMessage(error));
    } finally {
      setGoogleLoading(false);
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
          <h1 className="text-2xl font-bold sm:text-3xl">Create account</h1>
          <p className="text-muted mt-2 mb-8">Start your private readiness workspace and build recruiter-safe proof.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-soft">Display name</label>
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="field-input"
                required
                disabled={!authEnabled}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-soft">Email</label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field-input"
                required
                disabled={!authEnabled}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-soft">Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-input"
                required
                minLength={6}
                disabled={!authEnabled}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-soft">Confirm password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="field-input"
                required
                minLength={6}
                disabled={!authEnabled}
              />
            </div>

            {errorMessage && <p className="text-sm text-rose-500">{errorMessage}</p>}

            <button
              type="submit"
              disabled={loading || !authEnabled}
              className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted">
            <span className="h-px flex-1 bg-[color:var(--border)]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[color:var(--border)]" />
          </div>

          <button
            type="button"
            onClick={() => void handleGoogleSignup()}
            disabled={googleLoading || !authEnabled}
            className="btn-secondary flex w-full items-center justify-center gap-3 py-3 disabled:cursor-not-allowed disabled:opacity-65"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-800">
              G
            </span>
            {googleLoading ? "Connecting Google..." : "Continue with Google"}
          </button>

          <div className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[color:var(--accent)] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
