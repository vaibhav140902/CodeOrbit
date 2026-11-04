import { NextRequest, NextResponse } from "next/server";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { extractViewerFromHeaders } from "@/lib/server/auth-guard";
import {
  validateResumeUpload,
  UploadSecurityError,
} from "@/lib/server/upload-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await extractViewerFromHeaders(request.headers);
    await assertTierRateLimit(request, "resume_generation", viewer);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { message: "No file uploaded. Please select a PDF, DOCX, or TXT resume." },
        { status: 400 }
      );
    }

    const uploadedFile = file as File;
    const rawFileName = uploadedFile.name || "resume.pdf";

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cryptographic & magic bytes inspection (size <= 5MB, non-executable, validated magic bytes)
    const validatedUpload = validateResumeUpload(buffer, rawFileName);

    let extractedText = "";

    if (validatedUpload.type === "pdf") {
      // Dynamic import to prevent bundler bundling issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = await import("pdf-parse" as any);
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || "";
    } else if (validatedUpload.type === "docx") {
      const mammothModule = await import("mammoth");
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (validatedUpload.type === "text") {
      extractedText = buffer.toString("utf-8");
    }

    const cleanedText = extractedText.replace(/\r\n/g, "\n").trim();

    if (!cleanedText || cleanedText.length < 30) {
      return NextResponse.json(
        { message: "Could not extract sufficient text from the uploaded document. Please check the file or paste text directly." },
        { status: 400 }
      );
    }

    const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      fileName: validatedUpload.sanitizedFileName,
      wordCount,
      text: cleanedText,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    if (error instanceof UploadSecurityError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("Resume file parsing error:", error);
    return NextResponse.json(
      { message: "Failed to parse document. Please ensure the file is not password-protected or corrupted." },
      { status: 500 }
    );
  }
}
