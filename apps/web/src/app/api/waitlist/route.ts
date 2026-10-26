import { appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { waitlistSubmissionSchema } from "@codeorbit/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

const isLocalHost = (host: string | null) => {
  if (!host) {
    return false;
  }

  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
};

export async function POST(request: Request) {
  const input = await request.json().catch(() => null);
  const parsed = waitlistSubmissionSchema.safeParse({
    ...input,
    createdAtIso: new Date().toISOString(),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please complete all required fields with valid details." },
      { status: 400 }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.NODE_ENV !== "production" || isLocalHost(request.headers.get("host"))) {
      await appendFile(join(tmpdir(), "codeorbit-waitlist.ndjson"), `${JSON.stringify(parsed.data)}\n`, "utf8");
      return NextResponse.json({
        message: "Request captured in the local development inbox. Add Supabase credentials to persist waitlists in production.",
      });
    }

    return NextResponse.json(
      {
        message:
          "Waitlist capture is ready, but storage is not configured in this environment yet. Add Supabase server credentials to enable submissions.",
      },
      { status: 503 }
    );
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist_submissions`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization,
      role: parsed.data.role,
      target: parsed.data.target,
      team_size: parsed.data.teamSize ?? null,
      message: parsed.data.message ?? null,
      created_at: parsed.data.createdAtIso,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      {
        message: `Unable to store the request right now. ${detail || "Please try again shortly."}`.trim(),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Request received. We will reach out when the beta matches your use case.",
  });
}
