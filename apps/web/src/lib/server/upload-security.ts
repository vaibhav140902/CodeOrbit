export class UploadSecurityError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "INVALID_UPLOAD") {
    super(message);
    this.name = "UploadSecurityError";
    this.status = status;
    this.code = code;
  }
}

export type ValidatedUploadType = "pdf" | "docx" | "text";

export interface ValidatedResumeUpload {
  type: ValidatedUploadType;
  sanitizedFileName: string;
  sizeBytes: number;
}

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const DANGEROUS_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "bash", "ps1", "psm1", "msi", "com", "vbs",
  "vbe", "wsf", "wsh", "py", "pyc", "js", "mjs", "jar", "bin", "scr", "pif"
]);

/**
 * Checks for known binary executable headers:
 * - Windows PE (.exe / .dll): 0x4D 0x5A ("MZ")
 * - Linux ELF: 0x7F 0x45 0x4C 0x46 ("\x7fELF")
 * - macOS Mach-O: 0xFE 0xED 0xFA 0xCE/CF, 0xCE/CF 0xFA 0xED 0xFE, 0xCA 0xFE 0xBA 0xBE
 */
const hasExecutableSignature = (buffer: Buffer): boolean => {
  if (buffer.length < 4) return false;

  // DOS / Windows PE "MZ"
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) return true;

  // ELF binary "\x7fELF"
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return true;
  }

  // Mach-O binary signatures
  const u32Be = buffer.readUInt32BE(0);
  const u32Le = buffer.readUInt32LE(0);
  if (
    u32Be === 0xfeedface ||
    u32Be === 0xfeedfacf ||
    u32Le === 0xfeedface ||
    u32Le === 0xfeedfacf ||
    u32Be === 0xcafebabe || // Mach-O Universal / Java class
    u32Le === 0xcafebabe
  ) {
    return true;
  }

  return false;
};

/**
 * Verifies if buffer starts with PDF signature (%PDF-)
 * Standard PDF header can start with %PDF- within the first 1024 bytes.
 */
const isPdfSignature = (buffer: Buffer): boolean => {
  const searchSlice = buffer.subarray(0, Math.min(buffer.length, 1024));
  return searchSlice.includes(Buffer.from("%PDF-"));
};

/**
 * Verifies if buffer has PK zip header and signs of OOXML (.docx)
 * ZIP local file header: 0x50 0x4B 0x03 0x04 ("PK\x03\x04")
 */
const isDocxSignature = (buffer: Buffer): boolean => {
  if (buffer.length < 4) return false;
  const isZip =
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

  if (!isZip) return false;

  // Verify it contains OOXML indicators in the buffer
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1");
  return (
    sample.includes("[Content_Types].xml") ||
    sample.includes("word/") ||
    sample.includes("_rels/")
  );
};

/**
 * Validates text files: ensure UTF-8 without null bytes or shell script shebangs.
 */
const isCleanPlainText = (buffer: Buffer): boolean => {
  // Reject if contains null bytes (binary file)
  if (buffer.includes(0x00)) return false;

  const header = buffer.subarray(0, 128).toString("utf8").trim();
  // Reject shell script shebang
  if (header.startsWith("#!/") || header.startsWith("#! /")) {
    return false;
  }

  return true;
};

export const validateResumeUpload = (
  buffer: Buffer,
  fileName: string
): ValidatedResumeUpload => {
  // 1. Size constraint
  if (!buffer || buffer.length === 0) {
    throw new UploadSecurityError("Uploaded file is empty.", 400, "EMPTY_FILE");
  }

  if (buffer.length > MAX_RESUME_SIZE_BYTES) {
    throw new UploadSecurityError(
      `File exceeds maximum permitted size of 5 MB (size: ${(buffer.length / (1024 * 1024)).toFixed(1)} MB).`,
      400,
      "FILE_TOO_LARGE"
    );
  }

  // 2. Filename sanitize and extension inspection
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const lowerName = sanitizedFileName.toLowerCase();
  const segments = lowerName.split(".").filter(Boolean);

  // Reject double/embedded dangerous extensions (e.g. resume.pdf.exe, cv.sh.docx)
  for (const ext of segments) {
    if (DANGEROUS_EXTENSIONS.has(ext)) {
      throw new UploadSecurityError(
        `Executable or script file type detected (.${ext}) and rejected.`,
        400,
        "DISALLOWED_EXTENSION"
      );
    }
  }

  // 3. Reject binary executables regardless of filename extension
  if (hasExecutableSignature(buffer)) {
    throw new UploadSecurityError(
      "Binary executable format detected and rejected.",
      400,
      "EXECUTABLE_MAGIC_DETECTED"
    );
  }

  const primaryExtension = segments[segments.length - 1] || "";

  // 4. Magic bytes MIME verification matching extension
  if (primaryExtension === "pdf") {
    if (!isPdfSignature(buffer)) {
      throw new UploadSecurityError(
        "File has .pdf extension but does not contain a valid PDF signature header (%PDF-).",
        400,
        "INVALID_PDF_SIGNATURE"
      );
    }
    return {
      type: "pdf",
      sanitizedFileName,
      sizeBytes: buffer.length,
    };
  }

  if (primaryExtension === "docx") {
    if (!isDocxSignature(buffer)) {
      throw new UploadSecurityError(
        "File has .docx extension but does not contain a valid Microsoft Word XML document archive.",
        400,
        "INVALID_DOCX_SIGNATURE"
      );
    }
    return {
      type: "docx",
      sanitizedFileName,
      sizeBytes: buffer.length,
    };
  }

  if (primaryExtension === "txt" || primaryExtension === "md") {
    if (!isCleanPlainText(buffer)) {
      throw new UploadSecurityError(
        "Text resume contains binary or executable content. Please upload plain UTF-8 text.",
        400,
        "INVALID_TEXT_CONTENT"
      );
    }
    return {
      type: "text",
      sanitizedFileName,
      sizeBytes: buffer.length,
    };
  }

  throw new UploadSecurityError(
    `Unsupported file type (.${primaryExtension}). Only .pdf, .docx, and .txt resumes are accepted.`,
    400,
    "UNSUPPORTED_TYPE"
  );
};
