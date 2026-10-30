import type { Color, PDFFont, PDFPage } from "pdf-lib";
import type { ResumeResponse } from "@codeorbit/schema";

const normalizeExtractedText = (value: string) =>
  value
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const getFileExtension = (fileName: string) => fileName.toLowerCase().split(".").pop() ?? "";

export const extractResumeText = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name || "resume";
  const mimeType = file.type || "application/octet-stream";
  const extension = getFileExtension(fileName);

  if (mimeType === "application/pdf" || extension === "pdf") {
    const pdfParse = (await import("pdf-parse")).default as (buffer: Buffer) => Promise<{ text?: string }>;
    const result = await pdfParse(buffer);
    return normalizeExtractedText(result.text ?? "");
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    const mammoth = (await import("mammoth")).default as unknown as {
      extractRawText: (options: { buffer: Buffer }) => Promise<{ value: string }>;
    };
    const result = await mammoth.extractRawText({ buffer });
    return normalizeExtractedText(result.value ?? "");
  }

  if (
    mimeType.startsWith("text/") ||
    extension === "txt" ||
    extension === "md" ||
    extension === "markdown"
  ) {
    return normalizeExtractedText(buffer.toString("utf8"));
  }

  if (extension === "doc") {
    throw new Error("Legacy .doc files are not supported yet. Please upload PDF, DOCX, TXT, or MD.");
  }

  throw new Error("Unsupported file type. Please upload PDF, DOCX, TXT, or MD.");
};

const sanitizeForPdf = (value: string) =>
  value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "-")
    .replace(/[^\x00-\x7F]/g, " ");

const drawWrappedText = ({
  page,
  font,
  text,
  fontSize,
  x,
  y,
  maxWidth,
  color,
}: {
  page: PDFPage;
  font: PDFFont;
  text: string;
  fontSize: number;
  x: number;
  y: number;
  maxWidth: number;
  color: Color;
}) => {
  const safeText = sanitizeForPdf(text);
  const words = safeText.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    lines.push(candidate);
    currentLine = "";
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * (fontSize + 4),
      size: fontSize,
      font,
      color,
    });
  });

  return lines.length * (fontSize + 4);
};

export const buildResumePdfBuffer = async (draft: ResumeResponse) => {
  // Use pre-bundled dist for sub-second cold starts
  let pdfLib: typeof import("pdf-lib");
  try {
    // @ts-expect-error - dist bundle lacks d.ts
    const bundle = (await import("pdf-lib/dist/pdf-lib.js")) as unknown as { default?: typeof import("pdf-lib") } & typeof import("pdf-lib");
    pdfLib = bundle.default ?? bundle;
  } catch {
    pdfLib = await import("pdf-lib");
  }
  const { PDFDocument, StandardFonts, rgb } = pdfLib;
  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 50;
  const topMargin = 790;
  const bottomMargin = 60;
  const maxWidth = pageWidth - marginX * 2;
  const ink = rgb(0.09, 0.11, 0.18);
  const muted = rgb(0.33, 0.39, 0.48);

  let page = pdf.addPage([pageWidth, pageHeight]);
  let cursorY = topMargin;

  const ensureSpace = (minimumHeight: number) => {
    if (cursorY - minimumHeight >= bottomMargin) {
      return;
    }

    page = pdf.addPage([pageWidth, pageHeight]);
    cursorY = topMargin;
  };

  const drawHeading = (text: string, fontSize: number, color = ink) => {
    ensureSpace(fontSize + 10);
    page.drawText(text, { x: marginX, y: cursorY, size: fontSize, font: boldFont, color });
    cursorY -= fontSize + 8;
  };

  const drawSectionHeading = (text: string) => {
    ensureSpace(32);
    page.drawText(text.toUpperCase(), {
      x: marginX,
      y: cursorY,
      size: 11,
      font: boldFont,
      color: muted,
    });
    cursorY -= 18;
  };

  const drawParagraph = (text: string, fontSize = 11, color = ink) => {
    ensureSpace(48);
    const heightUsed = drawWrappedText({
      page,
      font: regularFont,
      text,
      fontSize,
      x: marginX,
      y: cursorY,
      maxWidth,
      color,
    });
    cursorY -= heightUsed + 6;
  };

  const drawBullet = (text: string) => {
    ensureSpace(36);
    page.drawText("-", { x: marginX, y: cursorY, size: 12, font: boldFont, color: ink });
    const heightUsed = drawWrappedText({
      page,
      font: regularFont,
      text,
      fontSize: 11,
      x: marginX + 14,
      y: cursorY,
      maxWidth: maxWidth - 14,
      color: ink,
    });
    cursorY -= heightUsed + 4;
  };

  drawHeading(draft.fullName, 20);
  page.drawText(`ATS ${draft.atsScore}%`, {
    x: pageWidth - marginX - 72,
    y: topMargin + 2,
    size: 11,
    font: boldFont,
    color: rgb(0.04, 0.6, 0.85),
  });
  drawParagraph(draft.headline, 12, muted);
  cursorY -= 4;

  drawSectionHeading("Profile Summary");
  drawParagraph(draft.summary);

  drawSectionHeading("Experience");
  draft.experience.forEach((entry) => {
    ensureSpace(48);
    page.drawText(`${entry.title} | ${entry.organization}`, {
      x: marginX,
      y: cursorY,
      size: 12,
      font: boldFont,
      color: ink,
    });
    if (entry.timeline) {
      page.drawText(entry.timeline, {
        x: pageWidth - marginX - regularFont.widthOfTextAtSize(entry.timeline, 10),
        y: cursorY + 1,
        size: 10,
        font: regularFont,
        color: muted,
      });
    }
    cursorY -= 18;
    entry.bullets.forEach(drawBullet);
    cursorY -= 4;
  });

  drawSectionHeading("Projects");
  draft.projects.forEach((project) => {
    ensureSpace(42);
    const titleLine = project.link ? `${project.title} | ${project.link}` : project.title;
    page.drawText(titleLine, { x: marginX, y: cursorY, size: 12, font: boldFont, color: ink });
    cursorY -= 18;
    project.bullets.forEach(drawBullet);
    cursorY -= 2;
  });

  drawSectionHeading("Education");
  draft.education.forEach((entry) => {
    ensureSpace(34);
    page.drawText(`${entry.degree} | ${entry.institution}`, {
      x: marginX,
      y: cursorY,
      size: 12,
      font: boldFont,
      color: ink,
    });
    cursorY -= 18;
    if (entry.details) {
      drawParagraph(entry.details, 10, muted);
    }
  });

  drawSectionHeading("Skills");
  drawParagraph(draft.skills.join(" | "));

  drawSectionHeading("Certifications");
  if (draft.certifications.length === 0) {
    drawParagraph("No certifications added.", 10, muted);
  } else {
    draft.certifications.forEach(drawBullet);
  }

  drawSectionHeading("Achievements");
  draft.achievements.forEach(drawBullet);

  const bytes = await pdf.save();
  return Buffer.from(bytes);
};

const escapeLatex = (value: string) =>
  value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}")
    .replace(/\n/g, " ");

const latexItems = (items: string[]) =>
  items.map((item) => `  \\item ${escapeLatex(item)}`).join("\n");

export const buildResumeLatexSource = (draft: ResumeResponse) => {
  const projectSections = draft.projects
    .map((project) => {
      const header = project.link
        ? `\\textbf{${escapeLatex(project.title)}} \\hfill \\texttt{${escapeLatex(project.link)}}`
        : `\\textbf{${escapeLatex(project.title)}}`;
      return `${header}\n\\begin{itemize}\n${latexItems(project.bullets)}\n\\end{itemize}`;
    })
    .join("\n\n");

  const experienceSections = draft.experience
    .map((entry) => {
      const header = entry.timeline
        ? `\\textbf{${escapeLatex(entry.title)}} \\hfill ${escapeLatex(entry.timeline)}\\\\ ${escapeLatex(entry.organization)}`
        : `\\textbf{${escapeLatex(entry.title)}}\\\\ ${escapeLatex(entry.organization)}`;
      return `${header}\n\\begin{itemize}\n${latexItems(entry.bullets)}\n\\end{itemize}`;
    })
    .join("\n\n");

  const educationSections = draft.education
    .map((entry) => {
      const details = entry.details ? ` \\hfill ${escapeLatex(entry.details)}` : "";
      return `\\textbf{${escapeLatex(entry.degree)}}\\\\ ${escapeLatex(entry.institution)}${details}`;
    })
    .join("\n\n");

  return [
    "\\documentclass[11pt]{article}",
    "\\usepackage[margin=0.7in]{geometry}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{enumitem}",
    "\\setlist[itemize]{leftmargin=1.2em, itemsep=0.2em, topsep=0.25em}",
    "\\pagestyle{empty}",
    "\\begin{document}",
    `{\\LARGE \\textbf{${escapeLatex(draft.fullName)}}}\\\\`,
    `\\textit{${escapeLatex(draft.headline)}}\\\\`,
    `ATS score: ${draft.atsScore}\\% \\hfill Template: ${escapeLatex(draft.templateName)}`,
    "\\vspace{0.6em}",
    "\\section*{Summary}",
    escapeLatex(draft.summary),
    "\\section*{Skills}",
    escapeLatex(draft.skills.join(" | ")),
    "\\section*{Experience}",
    experienceSections || escapeLatex("Add relevant internships, freelance work, or practical engineering experience here."),
    "\\section*{Projects}",
    projectSections || escapeLatex("Add your strongest projects with links and quantified outcomes here."),
    "\\section*{Education}",
    educationSections,
    "\\section*{Certifications}",
    draft.certifications.length > 0 ? `\\begin{itemize}\n${latexItems(draft.certifications)}\n\\end{itemize}` : escapeLatex("Add certifications or competitive achievements here."),
    "\\section*{Achievements}",
    `\\begin{itemize}\n${latexItems(draft.achievements)}\n\\end{itemize}`,
    "\\end{document}",
  ].join("\n");
};
