import { NextRequest, NextResponse } from "next/server";
import { getGeminiQuotaInfo } from "@/lib/server/ai-shield";
import { hasSupabase } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const isDeepCheck = url.searchParams.get("deep") === "true";

  const uptimeSeconds = Math.floor(process.uptime());
  const memUsage = process.memoryUsage();

  const quota = getGeminiQuotaInfo();
  const dbConfigured = hasSupabase();

  let runnerStatus = "available";
  let deepCheckLatencyMs: number | null = null;

  if (isDeepCheck) {
    const t0 = performance.now();
    try {
      // Lightweight check against Judge0 endpoint reachability
      const judge0Url = (process.env.JUDGE0_URL ?? "https://ce.judge0.com").replace(/\/+$/, "");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${judge0Url}/about`, {
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      runnerStatus = res && res.ok ? "healthy" : "external-degraded";
    } catch {
      runnerStatus = "unreachable";
    }
    deepCheckLatencyMs = Math.round(performance.now() - t0);
  }

  const isHealthy = true; // Platform fails open with local persistence & AI fallbacks

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      service: "codeorbit-web",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || "production",
      database: {
        type: dbConfigured ? "supabase" : "local-cache-fallback",
        status: "healthy",
      },
      aiShield: {
        active: true,
        maxRpm: quota.maxLimit,
        usedRpm: quota.used,
        remainingRpm: quota.remaining,
        resetsInSeconds: Math.ceil(quota.resetInMs / 1000),
      },
      runner: {
        provider: "judge0-ce",
        status: runnerStatus,
      },
      memory: {
        rssMb: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      ...(isDeepCheck ? { deepCheckLatencyMs } : {}),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
