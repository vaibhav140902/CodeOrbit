import { NextRequest, NextResponse } from "next/server";
import { mockInterviewInputSchema, mockInterviewLiveResponseSchema } from "@codeorbit/schema";
import { AccessControlError, assertPaidFeatureAccess } from "@/lib/server/access-control";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { callGeminiJson, sanitizePromptInput } from "@/lib/server/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getRequestKey = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(`mock-interview-live:${getRequestKey(request)}`, 20, 60_000);
    await assertPaidFeatureAccess(request.headers);

    const payload = mockInterviewInputSchema.parse(await request.json());
    const transcript = sanitizePromptInput(payload.transcript, 10_000);

    const response = await callGeminiJson({
      systemPrompt:
        "You are CodeOrbit's real-time interview coach. Return fast, concise, JSON-only coaching while the student is speaking.",
      userPrompt: [
        `Target company: ${payload.company}`,
        `Target role: ${payload.role}`,
        `Live transcript so far:\n${transcript}`,
        payload.notes ? `Interviewer notes:\n${sanitizePromptInput(payload.notes, 3_000)}` : "",
        "Return JSON with keys headline, bullets, provider.",
        "bullets must contain 3 concise coaching actions for the next 30 seconds of the interview.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      schema: mockInterviewLiveResponseSchema,
    });

    return NextResponse.json({
      ...response,
      provider: "gemini",
    });
  } catch (error) {
    console.error("Live mock interview feedback failed:", error);
    if (error instanceof AccessControlError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({
      headline: "Live Gemini Coach",
      bullets: [
        "Slow down slightly and structure the next answer in 3 short steps.",
        "Say the time complexity out loud before moving to implementation details.",
        "End with one confident conclusion instead of trailing off.",
      ],
      provider: "fallback",
    });
  }
}
