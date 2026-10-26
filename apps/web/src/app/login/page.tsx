import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Login | CodeOrbit",
  description: "Sign in to access your private readiness, resume, interview, and application workspace.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginForm />;
}
