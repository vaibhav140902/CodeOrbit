import { NextRequest, NextResponse } from "next/server";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { extractViewerFromHeaders } from "@/lib/server/auth-guard";

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
    const fileName = uploadedFile.name || "resume.pdf";
    const extension = fileName.split(".").pop()?.toLowerCase();

    // Check file size (5MB maximum)
    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File exceeds 5MB size limit. Please upload a smaller resume file." },
        { status: 400 }
      );
    }

    let extractedText = "";

    if (extension === "pdf") {
      // Dynamic import to prevent bundler bundling issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = await import("pdf-parse" as any);
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || "";
    } else if (extension === "docx") {
      const mammothModule = await import("mammoth");
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (extension === "txt" || extension === "md") {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { message: `Unsupported file type (.${extension}). Please upload a PDF, DOCX, or TXT resume.` },
        { status: 400 }
      );
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
      fileName,
      wordCount,
      text: cleanedText,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    console.error("Resume file parsing error:", error);
    return NextResponse.json(
      { message: "Failed to parse document. Please ensure the file is not password-protected or corrupted." },
      { status: 500 }
    );
  }
}
