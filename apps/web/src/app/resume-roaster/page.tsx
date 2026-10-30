import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { ResumeRoasterView } from "@/components/resume/resume-roaster-view";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Free ATS Resume Roaster | CodeOrbit",
  description:
    "Test your resume's ATS compatibility score against Amazon, Infosys, TCS, Flipkart, and Google hiring benchmarks. Get brutal, constructive feedback and 3 critical fixes.",
  path: "/resume-roaster",
});

export default function ResumeRoasterPage() {
  return (
    <AppFrame>
      <ResumeRoasterView />
    </AppFrame>
  );
}
