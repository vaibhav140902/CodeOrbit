import { AuthGuard } from "@/components/auth/auth-guard";
import { AppFrame } from "@/components/layout/app-frame";
import { ResumeBuilderOverview } from "@/components/resume/resume-builder-overview";

export default function ResumeBuilderPage() {
  return (
    <AppFrame>
      <AuthGuard>
        <ResumeBuilderOverview />
      </AuthGuard>
    </AppFrame>
  );
}
