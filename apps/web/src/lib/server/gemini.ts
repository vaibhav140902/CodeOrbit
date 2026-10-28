import { ZodType } from "zod";
import { acquireGeminiQuota, fetchWithTimeout, getGeminiQuotaInfo } from "@/lib/server/ai-shield";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const FALLBACK_GEMINI_MODELS = ["gemini-2.0-flash"];

const sanitizeFreeformText = (value: string, limit: number) =>
  value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, limit);

const extractResponseText = (payload: unknown) => {
  const data = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  return data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
};

const extractFirstJsonBlock = (value: string) => {
  const cleaned = value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

export const getGeminiConfig = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured for the web server.");
  }

  return {
    apiKey,
    model,
  };
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async ({
  systemPrompt,
  userPrompt,
  responseMimeType,
}: {
  systemPrompt: string;
  userPrompt: string;
  responseMimeType?: "application/json";
}) => {
  const { apiKey, model } = getGeminiConfig();
  const models = Array.from(new Set([model, DEFAULT_GEMINI_MODEL, ...FALLBACK_GEMINI_MODELS]));
  let lastError: Error | null = null;

  // Protect global 15 RPM free tier ceiling:
  if (!acquireGeminiQuota()) {
    const quota = getGeminiQuotaInfo();
    throw new Error(
      `Gemini rate limit shield active (${quota.used}/${quota.maxLimit} RPM used). Resets in ${Math.ceil(
        quota.resetInMs / 1000
      )}s.`
    );
  }

  for (const currentModel of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      currentModel
    )}:generateContent`;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetchWithTimeout(
          endpoint,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: sanitizeFreeformText(systemPrompt, 8_000) }],
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: sanitizeFreeformText(userPrompt, 30_000) }],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                responseMimeType,
              },
            }),
          },
          7_500
        );

        if (response.ok) {
          const payload = (await response.json()) as unknown;
          const text = extractResponseText(payload);
          if (!text) {
            throw new Error("Gemini returned an empty response.");
          }

          return text;
        }

        const body = await response.text();
        lastError = new Error(`Gemini request failed with ${response.status}: ${body.slice(0, 300)}`);

        if (response.status !== 429 && response.status !== 503) {
          throw lastError;
        }

        await delay(500 * (attempt + 1));
      } catch (err) {
        lastError = err as Error;
        if ((err as Error).message.includes("timed out")) {
          break;
        }
      }
    }
  }

  throw lastError ?? new Error("Gemini request failed.");
};

export const callGeminiText = async (options: {
  systemPrompt: string;
  userPrompt: string;
}) => callGemini(options);

export const callGeminiJson = async <T>({
  systemPrompt,
  userPrompt,
  schema,
}: {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
}) => {
  const text = await callGemini({
    systemPrompt,
    userPrompt,
    responseMimeType: "application/json",
  });
  const raw = extractFirstJsonBlock(text);
  const parsed = JSON.parse(raw) as unknown;
  return schema.parse(parsed);
};

export const sanitizePromptInput = sanitizeFreeformText;
