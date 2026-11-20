import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { LeaderboardOverview } from "@/components/leaderboard/leaderboard-overview";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Leaderboard & Role Certification | CodeOrbit",
  description:
    "Explore transparent rankings: 1,000-Point Practical Fit Index (PFI) role certifications and the 44-problem free open DSA arena.",
  path: "/leaderboard",
});

export default function LeaderboardPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <LeaderboardOverview />
        </div>
      </div>
    </AppFrame>
  );
}
