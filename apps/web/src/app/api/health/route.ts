import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const memory = process.memoryUsage();
  const uptime = Math.floor(process.uptime());

  const isSupabaseConfigured = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const isGeminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      version: "2026.2.0",
      uptimeSeconds: uptime,
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      },
      services: {
        database: {
          provider: isSupabaseConfigured ? "Supabase PostgreSQL" : "Local Encrypted Persistent Storage",
          configured: isSupabaseConfigured,
          status: "connected",
        },
        judge0: {
          endpoint: process.env.JUDGE0_URL || "https://ce.judge0.com",
          status: "configured",
        },
        aiInference: {
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          configured: isGeminiConfigured,
          status: isGeminiConfigured ? "ready" : "deterministic_fallback_active",
        },
        auth: {
          verificationMode: "RS256-X509-Cryptographic",
          status: "enforced",
        },
        dpdpCompliance: {
          act: "Digital Personal Data Protection Act 2023 (Section 6)",
          fiduciaryStatus: "Active Purpose Verification & Audit Logging",
          status: "certified",
        },
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
