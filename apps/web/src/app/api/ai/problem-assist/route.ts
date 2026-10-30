import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { aiAssistInputSchema, type AiAssistMode } from "@codeorbit/schema";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { callGeminiText, sanitizePromptInput } from "@/lib/server/gemini";
import { getViewerContextFromHeaders } from "@/lib/server/platform-data";
import {
  canExecuteGeminiCall,
  createAiCacheKey,
  generateDeterministicProblemAssist,
  getCachedAiResponse,
  setCachedAiResponse,
} from "@/lib/server/ai-shield";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const modeTitle: Record<AiAssistMode, string> = {
  hint: "Smart Hint",
  eli5: "Explain Like I'm 5",
  solver: "AI Auto-Solver",
  review: "Submission Review + Complexity",
};

const modeInstruction: Record<AiAssistMode, string> = {
  hint: "Give three progressive hints only. Do not reveal the full solution or full code. Mention the target time complexity in one line.",
  eli5: "Explain the problem like the student is 5 years old. Use a simple analogy, then 3 tiny steps, then a tiny example.",
  solver:
    "Provide a guarded premium solution with these sections: Strategy, Step-by-step algorithm, Time and space complexity, Edge cases, and a reference solution in the requested language. Keep it concise but complete.",
  review:
    "Review the student's submission with these sections: Verdict, Complexity Analysis, What Works, Risks or Bugs, and Next Improvement. Use the code and runner output, and estimate time and space complexity explicitly.",
};

const getRequestKey = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

const computeCodeHash = (code?: string): string | undefined => {
  if (!code || !code.trim()) return undefined;
  return crypto.createHash("sha256").update(code.trim()).digest("hex").slice(0, 16);
};

export async function POST(request: NextRequest) {
  let rawPayload: unknown = null;

  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    await assertTierRateLimit(request, "problem_assist", viewer);

    rawPayload = await request.json();
    const payload = aiAssistInputSchema.parse(rawPayload);

    // 1. Build semantic cache key
    // Hints, ELI5, and Solver are invariant for the same problem + language.
    // Review incorporates code hash to preserve review uniqueness.
    const cacheKey = createAiCacheKey("problem-assist", {
      problemId: payload.problemId.toLowerCase().trim(),
      mode: payload.mode,
      language: payload.language?.toLowerCase().trim() || "default",
      codeHash: payload.mode === "review" ? computeCodeHash(payload.code) : undefined,
    });

    // 2. Query persistent semantic cache first (<5ms, ₹0 marginal cost)
    const cached = getCachedAiResponse(cacheKey);
    if (cached) {
      return NextResponse.json({
        title: cached.title || modeTitle[payload.mode],
        content: cached.content,
        provider: `${cached.provider} (cached)`,
      });
    }

    // 3. Try Gemini API if key is set and global 15 RPM quota is available
    let responseData: { title: string; content: string; provider: string } | null = null;
    const isGeminiAvailable = Boolean(process.env.GEMINI_API_KEY?.trim()) && canExecuteGeminiCall();

    if (isGeminiAvailable) {
      try {
        const prompt = [
          `Mode: ${payload.mode}`,
          `Problem ID: ${payload.problemId}`,
          payload.problemName ? `Problem: ${payload.problemName}` : "",
          payload.problemDifficulty ? `Difficulty: ${payload.problemDifficulty}` : "",
          payload.problemTags?.length ? `Tags: ${payload.problemTags.join(", ")}` : "",
          payload.problemDescription ? `Description: ${sanitizePromptInput(payload.problemDescription, 8_000)}` : "",
          payload.problemConstraints?.length ? `Constraints: ${payload.problemConstraints.join("; ")}` : "",
          payload.language ? `Language: ${payload.language}` : "",
          payload.stdin ? `Sample Input / stdin:\n${sanitizePromptInput(payload.stdin, 6_000)}` : "",
          payload.expectedOutput ? `Expected Output:\n${sanitizePromptInput(payload.expectedOutput, 4_000)}` : "",
          payload.actualOutput ? `Actual Output:\n${sanitizePromptInput(payload.actualOutput, 4_000)}` : "",
          payload.stderr ? `stderr:\n${sanitizePromptInput(payload.stderr, 3_000)}` : "",
          payload.compileOutput ? `compile_output:\n${sanitizePromptInput(payload.compileOutput, 3_000)}` : "",
          payload.judgeStatus ? `Judge status: ${payload.judgeStatus}` : "",
          payload.code ? `Student code:\n${sanitizePromptInput(payload.code, 12_000)}` : "",
          `Instruction: ${modeInstruction[payload.mode]}`,
        ]
          .filter(Boolean)
          .join("\n\n");

        const content = await callGeminiText({
          systemPrompt:
            "You are CodeOrbit's paid AI coding coach for Indian students. Be concise, practical, recruiter-grade, and supportive. Use plain text only.",
          userPrompt: prompt,
        });

        if (content && content.trim()) {
          responseData = {
            title: modeTitle[payload.mode],
            content: content.trim(),
            provider: "gemini",
          };

          // Store successful Gemini response in cache with 24h TTL
          setCachedAiResponse(cacheKey, responseData, 86_400_000);
        }
      } catch (geminiError) {
        console.warn(
          "Gemini call bypassed/failed, engaging deterministic fallback shield:",
          (geminiError as Error).message
        );
      }
    }

    // 4. If Gemini was skipped, timed out, or threw, engage Deterministic Fallback Engine
    if (!responseData) {
      const fallback = generateDeterministicProblemAssist(payload);
      responseData = {
        title: fallback.title,
        content: fallback.content,
        provider: fallback.provider,
      };

      // Store fallback in cache with 2h TTL so platform remains fast and resilient
      setCachedAiResponse(cacheKey, responseData, 7_200_000);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    console.error("Problem assist route error:", error);

    // If parsing failed on malformed request input:
    if ((error as { name?: string }).name === "ZodError") {
      return NextResponse.json(
        { message: "Invalid problem assist input payload.", errors: error },
        { status: 400 }
      );
    }

    // For any unexpected runtime errors, attempt deterministic fallback before failing:
    if (rawPayload && typeof rawPayload === "object") {
      try {
        const fallback = generateDeterministicProblemAssist(rawPayload as Parameters<typeof generateDeterministicProblemAssist>[0]);
        return NextResponse.json({
          title: fallback.title,
          content: fallback.content,
          provider: fallback.provider,
        });
      } catch {
        // Fall through to error response
      }
    }

    return NextResponse.json(
      {
        message: (error as Error).message || "AI problem assist temporarily unavailable.",
      },
      { status: 503 }
    );
  }
}
