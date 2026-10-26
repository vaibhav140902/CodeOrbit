import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Sign up | CodeOrbit",
  description: "Create a CodeOrbit account to start readiness scoring, resume variants, and recruiter-safe proof.",
  path: "/signup",
});

export default function SignupPage() {
  return <SignupForm />;
}
