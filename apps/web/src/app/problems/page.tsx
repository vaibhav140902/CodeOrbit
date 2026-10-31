import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { ProblemBank } from "@/components/problems/problem-bank";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Problem Library & Placement DSA | CodeOrbit",
  description:
    "Explore company-wise placement coding problems filtered by TCS, Infosys, Amazon, and Flipkart hiring patterns with Monaco IDE solving.",
  path: "/problems",
});

export default function ProblemsPage() {
  return (
    <AppFrame>
      <ProblemBank />
    </AppFrame>
  );
}
