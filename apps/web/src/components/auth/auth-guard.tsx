"use client";

import Link from "next/link";
import { usePlatformAuth } from "@/lib/auth-context";

export function AuthGuard({
  children,
  requireAdmin = false,
  requiredRoles,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredRoles?: string[];
}) {
  const { authEnabled, loading, profile, signOutCurrentUser, user } = usePlatformAuth();

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-4 border-[color:var(--accent)]" />
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authEnabled) {
    return (
      <div className="app-shell flex items-center justify-center px-4 py-10">
        <div className="surface-card w-full max-w-xl p-6 text-center sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Setup Needed</p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Firebase env is not configured.</h1>
          <p className="text-muted mt-3 text-sm sm:text-base">
            Add the values from <code>apps/web/.env.example</code> to run the secure auth flow.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell flex items-center justify-center px-4 py-10">
        <div className="surface-card w-full max-w-xl p-6 text-center sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Sign In Required</p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Open this area after signing in.</h1>
          <p className="text-muted mt-3 text-sm sm:text-base">
            Private readiness, interview, resume, and application data stay behind authenticated access.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/login" className="btn-primary text-center">
              Login
            </Link>
            <Link href="/signup" className="btn-secondary text-center">
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (requireAdmin && !profile?.isAdmin) {
    return (
      <div className="app-shell flex items-center justify-center px-4 py-10">
        <div className="surface-card w-full max-w-xl p-6 text-center sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Admin Only</p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">This screen is reserved for admins.</h1>
          <p className="text-muted mt-3 text-sm sm:text-base">
            Signed in as <span className="font-mono font-medium text-[color:var(--text-main)]">{profile?.email || user.email}</span>. Your current profile does not have the admin claim or role.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/dashboard" className="btn-secondary text-center text-sm">
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                void signOutCurrentUser();
              }}
              className="btn-primary text-center text-sm"
            >
              Switch / Re-login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRoles && requiredRoles.length > 0 && !profile?.isAdmin) {
    const allowed = requiredRoles.includes(profile?.role ?? "");
    if (!allowed) {
      return (
        <div className="app-shell flex items-center justify-center px-4 py-10">
          <div className="surface-card w-full max-w-xl p-6 text-center sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Restricted Workspace</p>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Your account does not have access to this beta.</h1>
            <p className="text-muted mt-3 text-sm sm:text-base">
              This workspace is currently limited to approved recruiter or campus beta roles.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
