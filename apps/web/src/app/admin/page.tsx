import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminOverview } from "@/components/admin/admin-overview";
import { AppFrame } from "@/components/layout/app-frame";

export default function AdminPage() {
  return (
    <AppFrame>
      <AuthGuard requireAdmin={true}>
        <AdminOverview />
      </AuthGuard>
    </AppFrame>
  );
}
