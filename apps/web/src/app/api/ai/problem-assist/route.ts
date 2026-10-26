import { NextRequest, NextResponse } from "next/server";
import { aiAssistInputSchema, type AiAssistMode } from "@codeorbit/schema";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { callGeminiText, sanitizePromptInput } from "@/lib/server/gemini";

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

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(`problem-assist:${getRequestKey(request)}`, 20, 60_000);

    const payload = aiAssistInputSchema.parse(await request.json());
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

    return NextResponse.json({
      title: modeTitle[payload.mode],
      content,
      provider: "gemini",
    });
  } catch (error) {
    console.error("Problem assist route failed:", error);
    return NextResponse.json(
      {
        message: (error as Error).message || "AI problem assist failed.",
      },
      { status: 400 }
    );
  }
}
