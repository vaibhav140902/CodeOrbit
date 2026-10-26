"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePlatformAuth } from "@/lib/auth-context";
import { getFirebaseAuthMessage } from "@/lib/firebase/auth-errors";
import { BRAND } from "@codeorbit/ui";

export function LoginForm() {
  const router = useRouter();
  const { authEnabled, signInWithEmail, signInWithGoogle } = usePlatformAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(getFirebaseAuthMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
          <h1 className="text-2xl font-bold sm:text-3xl">Sign in</h1>
          <p className="text-muted mt-2 mb-8">Continue to your private readiness, resume, and application workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            {errorMessage && <p className="text-sm text-rose-500">{errorMessage}</p>}

            <button
              type="submit"
              disabled={loading || !authEnabled}
              className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted">
            <span className="h-px flex-1 bg-[color:var(--border)]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[color:var(--border)]" />
          </div>

          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={googleLoading || !authEnabled}
            className="btn-secondary flex w-full items-center justify-center gap-3 py-3 disabled:cursor-not-allowed disabled:opacity-65"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-800">
              G
            </span>
            {googleLoading ? "Connecting Google..." : "Continue with Google"}
          </button>

          <div className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-[color:var(--accent)] hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
