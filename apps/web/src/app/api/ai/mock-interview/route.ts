import { NextRequest, NextResponse } from "next/server";
import { mockInterviewInputSchema, mockInterviewResponseSchema } from "@codeorbit/schema";
import { AccessControlError, assertPaidFeatureAccess } from "@/lib/server/access-control";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { callGeminiJson, sanitizePromptInput } from "@/lib/server/gemini";
import { getViewerContextFromHeaders, recordInterviewSessionData } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let baselineScore = 72;
  const viewer = await getViewerContextFromHeaders(request.headers);

  try {
    await assertTierRateLimit(request, "mock_interview", viewer);
    await assertPaidFeatureAccess(request.headers, viewer);

    const payload = mockInterviewInputSchema.parse(await request.json());
    const transcript = sanitizePromptInput(payload.transcript, 20_000);
    const notes = sanitizePromptInput(payload.notes ?? "", 6_000);
    const words = transcript.split(/\s+/).filter(Boolean).length;
    baselineScore = Math.max(52, Math.min(94, 48 + Math.round(words / 9)));

    const response = await callGeminiJson({
      systemPrompt:
        "You are CodeOrbit's interview coach. Score Indian tech interview transcripts fairly and return JSON only.",
      userPrompt: [
        "Review this mock interview transcript for an India-focused coding interview candidate.",
        `Target company: ${payload.company}`,
        `Target role: ${payload.role}`,
        `Transcript:\n${transcript}`,
        notes ? `Notes:\n${notes}` : "",
        "Return JSON with keys overallScore, communicationScore, problemSolvingScore, confidenceScore, summary, strengths, improvements, nextSteps, provider.",
        "Use numbers from 0 to 100. strengths, improvements, and nextSteps must each contain exactly 3 concise strings.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      schema: mockInterviewResponseSchema,
    });

    if (viewer.uid || viewer.email) {
      void recordInterviewSessionData(viewer, {
        company: payload.company,
        role: payload.role,
        overallScore: response.overallScore,
        transcript: payload.transcript,
        feedback: response as unknown as Record<string, unknown>,
      });
    }

    return NextResponse.json({
      ...response,
      provider: "gemini",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    if (error instanceof AccessControlError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Mock interview scoring failed:", error);
    const message = (error as Error).message || "Mock interview scoring failed.";

    if (message.includes("JSON") || message.includes("Gemini")) {
      return NextResponse.json({
        overallScore: baselineScore,
        communicationScore: Math.min(96, baselineScore + 2),
        problemSolvingScore: Math.max(50, baselineScore - 1),
        confidenceScore: baselineScore,
        summary: "You have a solid base. Tighten your structure, quantify your decisions, and end each answer with a crisp outcome.",
        strengths: [
          "Stayed focused on the target role and company context",
          "Showed practical intent instead of only theoretical memorization",
          "Created enough signal to coach the next practice round",
        ],
        improvements: [
          "Use the structure: context, approach, tradeoff, outcome",
          "State time complexity and edge cases earlier",
          "Close answers more confidently with a clear recommendation",
        ],
        nextSteps: [
          "Repeat one shorter interview round and focus on concise answers",
          "Practice one medium coding solution aloud before the next session",
          "Prepare 3 quantified project stories for India-focused interviews",
        ],
        provider: "heuristic",
      });
    }

    return NextResponse.json({ message }, { status: 400 });
  }
}
