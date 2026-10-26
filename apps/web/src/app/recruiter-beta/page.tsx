import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { RecruiterBetaWorkspace } from "@/components/beta/recruiter-beta-workspace";
import { AppFrame } from "@/components/layout/app-frame";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Recruiter beta workspace | CodeOrbit",
    description: "Preview the authenticated recruiter beta workspace for readiness-based candidate review.",
    path: "/recruiter-beta",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function RecruiterBetaPage() {
  return (
    <AppFrame>
      <AuthGuard requiredRoles={["recruiter_beta"]}>
        <div className="app-shell">
          <div className="page-container space-y-6">
            <section className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">Authenticated recruiter beta</span>
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Review candidates by readiness, intent, and proof.</h1>
              <p className="section-copy">
                This beta workspace previews how recruiter users can filter for role fit, company alignment, interview
                momentum, and proof-profile sharing without relying only on polished resumes.
              </p>
            </section>
            <RecruiterBetaWorkspace />
          </div>
        </div>
      </AuthGuard>
    </AppFrame>
  );
}
