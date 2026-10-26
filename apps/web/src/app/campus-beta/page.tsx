import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CampusBetaWorkspace } from "@/components/beta/campus-beta-workspace";
import { AppFrame } from "@/components/layout/app-frame";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Campus beta workspace | CodeOrbit",
    description: "Preview the authenticated campus beta workspace for placement and readiness operations.",
    path: "/campus-beta",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function CampusBetaPage() {
  return (
    <AppFrame>
      <AuthGuard requiredRoles={["campus_beta"]}>
        <div className="app-shell">
          <div className="page-container space-y-6">
            <section className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">Authenticated campus beta</span>
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Help placement teams spot who is actually ready.</h1>
              <p className="section-copy">
                This beta workspace previews cohort-level readiness, application tracking, and top weak areas so placement
                cells can move beyond manual spreadsheets and noisy self-reporting.
              </p>
            </section>
            <CampusBetaWorkspace />
          </div>
        </div>
      </AuthGuard>
    </AppFrame>
  );
}
