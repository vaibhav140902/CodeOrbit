import {
  resumeInputSchema,
  type ResumeAtsBreakdown,
  type ResumeInput,
  type ResumeResponse,
  type ResumeTemplateKey,
} from "@codeorbit/schema";
import { z } from "zod";
import { resumeTemplates } from "@/data/hiring-os";
import { callGeminiJson, sanitizePromptInput } from "@/lib/server/gemini";
import { getActivitySummaryData, getDashboardSummaryData, type ViewerContext } from "@/lib/server/platform-data";
import { buildResumeLatexSource, extractResumeText } from "@/lib/server/resume-utils";

type ResumeDraftSeed = Omit<ResumeResponse, "templateName" | "atsBreakdown" | "latexSource">;

type PrepSignals = {
  solvedCount: number;
  streak: number;
  weakTopics: string[];
  recentProblemNames: string[];
  latestMockScore?: number;
  latestMockCompany?: string;
};

const templateMap = Object.fromEntries(resumeTemplates.map((template) => [template.key, template])) as Record<
  ResumeTemplateKey,
  (typeof resumeTemplates)[number]
>;

const looseResumeSchema = z.object({
  fullName: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  templateKey: z.enum(["signal-single-column", "india-fresher", "product-engineer"]).optional(),
  atsScore: z.coerce.number().optional(),
  markdown: z.string().optional(),
  skills: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown()), z.string()]).optional(),
  experience: z.array(z.record(z.string(), z.unknown())).optional(),
  achievements: z.union([z.array(z.unknown()), z.string(), z.record(z.string(), z.unknown())]).optional(),
  projects: z.array(z.record(z.string(), z.unknown())).optional(),
  education: z.array(z.record(z.string(), z.unknown())).optional(),
  certifications: z.union([z.array(z.unknown()), z.string(), z.record(z.string(), z.unknown())]).optional(),
  provider: z.string().optional(),
});

const ATS_STOP_WORDS = new Set([
  "about",
  "across",
  "after",
  "also",
  "and",
  "are",
  "based",
  "build",
  "candidate",
  "company",
  "data",
  "developer",
  "for",
  "from",
  "have",
  "hiring",
  "into",
  "that",
  "their",
  "this",
  "with",
  "your",
]);

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const average = (values: number[]) =>
  values.length === 0 ? 0 : Math.round(values.reduce((total, value) => total + value, 0) / values.length);

const extractKeywords = (value: string, limit = 12) => {
  const matches = value.toLowerCase().match(/[a-z][a-z0-9+.#-]{2,}/g) ?? [];
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const item of matches) {
    if (ATS_STOP_WORDS.has(item) || seen.has(item)) {
      continue;
    }
    seen.add(item);
    keywords.push(item);
    if (keywords.length >= limit) {
      break;
    }
  }

  return keywords;
};

const countQuantifiedLines = (items: string[]) =>
  items.filter((item) => /\d|%|x|ms|months|users|projects|problems|streak/i.test(item)).length;

const coerceStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|•|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const coerceProjects = (value: unknown): ResumeDraftSeed["projects"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((project) => {
      const record = typeof project === "object" && project ? (project as Record<string, unknown>) : {};
      const title =
        typeof record.title === "string"
          ? record.title
          : typeof record.name === "string"
            ? record.name
            : typeof record.project === "string"
              ? record.project
              : "Project";
      const bullets = coerceStringArray(record.bullets ?? record.highlights ?? record.description ?? record.summary);
      const link = typeof record.link === "string" && record.link.startsWith("http") ? record.link : undefined;
      return {
        title: title.trim(),
        link,
        bullets,
      };
    })
    .filter((project) => project.title.length > 0 && project.bullets.length > 0);
};

const coerceExperience = (value: unknown): ResumeDraftSeed["experience"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const record = typeof entry === "object" && entry ? (entry as Record<string, unknown>) : {};
      const title =
        typeof record.title === "string"
          ? record.title
          : typeof record.role === "string"
            ? record.role
            : "Experience";
      const organization =
        typeof record.organization === "string"
          ? record.organization
          : typeof record.company === "string"
            ? record.company
            : "Organization";
      const timeline =
        typeof record.timeline === "string"
          ? record.timeline
          : typeof record.duration === "string"
            ? record.duration
            : undefined;
      const bullets = coerceStringArray(record.bullets ?? record.highlights ?? record.description ?? record.summary);
      return {
        title: title.trim(),
        organization: organization.trim(),
        timeline: timeline?.trim(),
        bullets,
      };
    })
    .filter((entry) => entry.title.length > 0 && entry.organization.length > 0 && entry.bullets.length > 0);
};

const coerceEducation = (value: unknown): ResumeDraftSeed["education"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const record = typeof entry === "object" && entry ? (entry as Record<string, unknown>) : {};
      const institution =
        typeof record.institution === "string"
          ? record.institution
          : typeof record.school === "string"
            ? record.school
            : "Institution";
      const degree =
        typeof record.degree === "string"
          ? record.degree
          : typeof record.program === "string"
            ? record.program
            : "Degree";
      const details =
        typeof record.details === "string"
          ? record.details
          : typeof record.summary === "string"
            ? record.summary
            : undefined;
      return {
        institution: institution.trim(),
        degree: degree.trim(),
        details: details?.trim(),
      };
    })
    .filter((entry) => entry.institution.length > 0 && entry.degree.length > 0);
};

const resolveTemplateKey = (input: ResumeInput, suggested?: string): ResumeTemplateKey => {
  if (input.templateKey && input.templateKey in templateMap) {
    return input.templateKey;
  }

  if (suggested && suggested in templateMap) {
    return suggested as ResumeTemplateKey;
  }

  const role = `${input.targetRole} ${input.targetCompany ?? ""}`.toLowerCase();
  if (/(intern|fresher|graduate|campus)/.test(role)) {
    return "india-fresher";
  }
  if (/(frontend|backend|full stack|product|platform|engineer)/.test(role)) {
    return "product-engineer";
  }
  return "signal-single-column";
};

const buildMarkdown = (draft: ResumeDraftSeed) => {
  const lines = [
    `# ${draft.fullName}`,
    "",
    `## Headline`,
    draft.headline,
    "",
    `## Summary`,
    draft.summary,
    "",
    `## Skills`,
    `- ${draft.skills.join(", ")}`,
    "",
    `## Experience`,
    ...draft.experience.flatMap((entry) => [
      `### ${entry.title} | ${entry.organization}${entry.timeline ? ` (${entry.timeline})` : ""}`,
      ...entry.bullets.map((bullet) => `- ${bullet}`),
      "",
    ]),
    `## Projects`,
    ...draft.projects.flatMap((project) => [
      `### ${project.title}${project.link ? ` | ${project.link}` : ""}`,
      ...project.bullets.map((bullet) => `- ${bullet}`),
      "",
    ]),
    `## Education`,
    ...draft.education.flatMap((entry) => [
      `- ${entry.degree} | ${entry.institution}${entry.details ? ` | ${entry.details}` : ""}`,
    ]),
    "",
    `## Certifications`,
    ...(draft.certifications.length > 0 ? draft.certifications.map((item) => `- ${item}`) : ["- Add certifications or competitive achievements."]),
    "",
    `## Achievements`,
    ...draft.achievements.map((item) => `- ${item}`),
  ];

  return lines.join("\n").trim();
};

const normalizeResumeDraft = (draft: ResumeDraftSeed): ResumeDraftSeed => ({
  ...draft,
  atsScore: clampScore(draft.atsScore),
  fullName: draft.fullName.trim(),
  headline: draft.headline.trim(),
  summary: draft.summary.trim(),
  templateKey: draft.templateKey,
  markdown: draft.markdown.trim(),
  skills: Array.from(new Set(draft.skills.map((item) => item.trim()).filter(Boolean))).slice(0, 16),
  experience: draft.experience
    .map((entry) => ({
      ...entry,
      title: entry.title.trim(),
      organization: entry.organization.trim(),
      timeline: entry.timeline?.trim(),
      bullets: entry.bullets.map((item) => item.trim()).filter(Boolean).slice(0, 4),
    }))
    .filter((entry) => entry.title && entry.organization && entry.bullets.length > 0)
    .slice(0, 3),
  achievements: draft.achievements.map((item) => item.trim()).filter(Boolean).slice(0, 5),
  projects: draft.projects
    .map((project) => ({
      ...project,
      title: project.title.trim(),
      link: project.link?.trim(),
      bullets: project.bullets.map((item) => item.trim()).filter(Boolean).slice(0, 4),
    }))
    .filter((project) => project.title.length > 0 && project.bullets.length > 0)
    .slice(0, 4),
  education: draft.education
    .map((entry) => ({
      ...entry,
      institution: entry.institution.trim(),
      degree: entry.degree.trim(),
      details: entry.details?.trim(),
    }))
    .filter((entry) => entry.institution && entry.degree)
    .slice(0, 2),
  certifications: draft.certifications.map((item) => item.trim()).filter(Boolean).slice(0, 8),
});

const buildResumeText = (draft: ResumeDraftSeed) =>
  [
    draft.headline,
    draft.summary,
    draft.skills.join(" "),
    draft.experience.flatMap((entry) => [entry.title, entry.organization, ...(entry.bullets ?? [])]).join(" "),
    draft.projects.flatMap((project) => [project.title, ...(project.bullets ?? [])]).join(" "),
    draft.education.flatMap((entry) => [entry.degree, entry.institution, entry.details ?? ""]).join(" "),
    draft.certifications.join(" "),
    draft.achievements.join(" "),
  ]
    .join(" ")
    .toLowerCase();

const buildAtsBreakdown = (input: ResumeInput, draft: ResumeDraftSeed): { atsScore: number; atsBreakdown: ResumeAtsBreakdown } => {
  const jdKeywords = extractKeywords(
    [input.targetRole, input.targetCompany ?? "", input.jobDescription ?? "", input.profileSummary ?? ""].join(" "),
    14
  );
  const resumeText = buildResumeText(draft);
  const matchedKeywords = jdKeywords.filter((keyword) => resumeText.includes(keyword)).slice(0, 10);
  const missingKeywords = jdKeywords.filter((keyword) => !resumeText.includes(keyword)).slice(0, 10);

  const sectionCount =
    (draft.summary ? 1 : 0) +
    (draft.skills.length > 0 ? 1 : 0) +
    (draft.experience.length > 0 ? 1 : 0) +
    (draft.projects.length > 0 ? 1 : 0) +
    (draft.education.length > 0 ? 1 : 0);
  const quantifiedLines = countQuantifiedLines([
    ...draft.experience.flatMap((entry) => entry.bullets),
    ...draft.projects.flatMap((project) => project.bullets),
    ...draft.achievements,
  ]);
  const proofLinks = draft.projects.filter((project) => Boolean(project.link)).length;
  const summaryWordCount = draft.summary.split(/\s+/).filter(Boolean).length;

  const keywordScore = jdKeywords.length === 0 ? 82 : clampScore(48 + (matchedKeywords.length / jdKeywords.length) * 50);
  const structureScore = clampScore(56 + sectionCount * 7 + (draft.markdown.length < 2200 ? 8 : 0));
  const impactScore = clampScore(50 + quantifiedLines * 7);
  const proofScore = clampScore(52 + draft.projects.length * 9 + proofLinks * 6 + (draft.experience.length > 0 ? 10 : 0));
  const clarityScore = clampScore(70 + (summaryWordCount >= 28 && summaryWordCount <= 70 ? 14 : 0) + (draft.skills.length >= 6 ? 6 : 0));

  const categories: ResumeAtsBreakdown["categories"] = [
    {
      key: "keyword-match",
      label: "Keyword match",
      score: keywordScore,
      insight: matchedKeywords.length > 0
        ? `Matched keywords include ${matchedKeywords.slice(0, 4).join(", ")}.`
        : "Add more role and JD keywords into headline, summary, and project bullets.",
    },
    {
      key: "structure",
      label: "Structure",
      score: structureScore,
      insight: `Resume includes ${sectionCount} core ATS sections in a single-column flow.`,
    },
    {
      key: "impact",
      label: "Impact bullets",
      score: impactScore,
      insight: quantifiedLines > 0
        ? `${quantifiedLines} bullets already contain measurable language or numbers.`
        : "Add metrics, counts, or delivery outcomes to more bullets.",
    },
    {
      key: "proof",
      label: "Proof and projects",
      score: proofScore,
      insight: proofLinks > 0
        ? `Project proof is stronger because ${proofLinks} project link${proofLinks === 1 ? " is" : "s are"} present.`
        : "Add GitHub or live links to turn claims into proof.",
    },
    {
      key: "clarity",
      label: "Clarity",
      score: clarityScore,
      insight: summaryWordCount > 70
        ? "Trim the summary slightly so recruiters scan the signal faster."
        : "Summary length and section density are recruiter-friendly.",
    },
  ];

  const improvementActions = [
    missingKeywords.length > 0
      ? `Bring these JD terms into the resume naturally: ${missingKeywords.slice(0, 4).join(", ")}.`
      : null,
    quantifiedLines < 4 ? "Rewrite at least two bullets with metrics, scale, or speed improvements." : null,
    proofLinks === 0 ? "Add a GitHub or live link for your strongest project before exporting the final version." : null,
    draft.education.some((entry) => /your college|university/i.test(entry.institution))
      ? "Replace the education placeholder with your real college, graduation year, and CGPA if relevant."
      : null,
    draft.certifications.some((item) => /add certifications/i.test(item))
      ? "Replace placeholder certifications with contests, coursework, or certifications that support the target role."
      : null,
  ].filter(Boolean) as string[];

  if (improvementActions.length === 0) {
    improvementActions.push("Tailor the summary wording once more before sending the resume to a recruiter.");
  }

  const heuristicScore = average(categories.map((category) => category.score));
  const finalScore = clampScore(heuristicScore * 0.72 + draft.atsScore * 0.28);

  return {
    atsScore: finalScore,
    atsBreakdown: {
      summary:
        matchedKeywords.length > 0
          ? `Strong baseline: ${matchedKeywords.length}/${Math.max(jdKeywords.length, matchedKeywords.length)} target keywords are already reflected in the draft.`
          : "Good structural baseline, but keyword alignment can improve once you add role and JD language.",
      categories,
      matchedKeywords,
      missingKeywords,
      improvementActions: improvementActions.slice(0, 4),
    },
  };
};

const buildFallbackSeed = (input: ResumeInput, prepSignals: PrepSignals, viewer?: ViewerContext): ResumeDraftSeed => {
  const candidateName = input.candidateName ?? viewer?.displayName ?? "CodeOrbit Candidate";
  const templateKey = resolveTemplateKey(input);
  const skills = [
    "Data Structures",
    "Algorithms",
    "Problem Solving",
    "TypeScript",
    "JavaScript",
    "Python",
    ...(input.targetRole.toLowerCase().includes("frontend") ? ["React", "UI Performance"] : ["APIs", "SQL"]),
  ];

  const summaryLines = [
    `${candidateName} is targeting ${input.targetRole} roles${input.targetCompany ? ` at ${input.targetCompany}` : ""}.`,
    prepSignals.solvedCount > 0
      ? `Solved ${prepSignals.solvedCount} interview-style coding problems with a ${prepSignals.streak}-day consistency streak on CodeOrbit.`
      : "Built a structured coding-prep workflow and converted it into recruiter-safe application material.",
    prepSignals.latestMockScore
      ? `Latest mock interview signal: ${prepSignals.latestMockScore}/100${prepSignals.latestMockCompany ? ` in a ${prepSignals.latestMockCompany} style round` : ""}.`
      : "Prepared for India-first and global technical hiring with clean ATS language and project-led proof.",
  ];

  const projectBullets = [
    prepSignals.solvedCount > 0
      ? `Solved ${prepSignals.solvedCount} coding challenges across arrays, strings, binary search, and graph-heavy interview tracks.`
      : "Practiced core interview patterns across arrays, strings, graphs, and company-first tracks.",
    prepSignals.streak > 0
      ? `Maintained a ${prepSignals.streak}-day preparation streak while improving debugging speed and consistency.`
      : "Documented problem-solving approach, edge cases, and trade-offs for recurring interview patterns.",
    prepSignals.recentProblemNames.length > 0
      ? `Recent preparation included ${prepSignals.recentProblemNames.slice(0, 3).join(", ")} and related follow-up patterns.`
      : `Prepared for ${input.location ?? "India"} hiring contexts with role-specific keywords and clearer application proof.`,
  ];

  const draft: ResumeDraftSeed = {
    fullName: candidateName,
    headline: `${input.targetRole} Candidate | ${input.targetCompany ?? "India-ready hiring"}`,
    summary: summaryLines.join(" "),
    templateKey,
    atsScore: 84,
    markdown: "",
    skills,
    experience: [
      {
        title: "CodeOrbit Readiness Portfolio",
        organization: "Self-directed",
        timeline: "2026",
        bullets: [
          `Built a targeted preparation workflow for ${input.targetRole} roles with ATS-aligned bullet writing and versioned resume drafts.`,
          "Tracked solved problems, revision loops, and interview communication improvements in one workspace.",
          "Converted prep data into recruiter-safe proof for applications, mock interviews, and company-track readiness.",
        ],
      },
    ],
    achievements: [
      "Converted preparation data into recruiter-safe achievement lines and quantified interview-ready evidence.",
      "Created a clean single-column resume layout optimized for ATS parsers and fast recruiter scanning.",
      prepSignals.latestMockScore
        ? `Improved mock interview performance to ${prepSignals.latestMockScore}/100 with clearer problem-solving communication.`
        : "Prepared structured responses for technical screening, application review, and interview follow-ups.",
    ],
    projects: [
      {
        title: "CodeOrbit Interview Readiness Portfolio",
        bullets: projectBullets,
      },
    ],
    education: [
      {
        institution: "Your College / University",
        degree: "Bachelor's Degree",
        details: "Add graduation year, CGPA, and relevant coursework.",
      },
    ],
    certifications: ["Add certifications, coding contests, hackathons, or coursework here."],
    provider: "fallback",
  };

  draft.markdown = buildMarkdown(draft);
  return draft;
};

const mergeDrafts = (fallbackDraft: ResumeDraftSeed, aiDraft: Partial<ResumeDraftSeed>): ResumeDraftSeed => {
  const templateKey = aiDraft.templateKey ?? fallbackDraft.templateKey;

  const merged: ResumeDraftSeed = {
    fullName: aiDraft.fullName?.trim() || fallbackDraft.fullName,
    headline: aiDraft.headline?.trim() || fallbackDraft.headline,
    summary: aiDraft.summary?.trim() || fallbackDraft.summary,
    templateKey,
    atsScore: typeof aiDraft.atsScore === "number" && Number.isFinite(aiDraft.atsScore) ? aiDraft.atsScore : fallbackDraft.atsScore,
    markdown: aiDraft.markdown?.trim() || fallbackDraft.markdown,
    skills: aiDraft.skills?.length ? aiDraft.skills : fallbackDraft.skills,
    experience: aiDraft.experience?.length ? aiDraft.experience : fallbackDraft.experience,
    achievements: aiDraft.achievements?.length ? aiDraft.achievements : fallbackDraft.achievements,
    projects: aiDraft.projects?.length ? aiDraft.projects : fallbackDraft.projects,
    education: aiDraft.education?.length ? aiDraft.education : fallbackDraft.education,
    certifications: aiDraft.certifications?.length ? aiDraft.certifications : fallbackDraft.certifications,
    provider: aiDraft.provider?.trim() || fallbackDraft.provider,
  };

  if (!merged.markdown) {
    merged.markdown = buildMarkdown(merged);
  }

  return normalizeResumeDraft(merged);
};

const finalizeDraft = (input: ResumeInput, draft: ResumeDraftSeed): ResumeResponse => {
  const normalized = normalizeResumeDraft({
    ...draft,
    templateKey: resolveTemplateKey(input, draft.templateKey),
    markdown: draft.markdown?.trim() ? draft.markdown : buildMarkdown(draft),
  });
  const template = templateMap[normalized.templateKey];
  const { atsScore, atsBreakdown } = buildAtsBreakdown(input, normalized);
  const baseDraft: ResumeResponse = {
    ...normalized,
    templateName: template.name,
    atsScore,
    atsBreakdown,
    latexSource: "",
  };

  return {
    ...baseDraft,
    latexSource: buildResumeLatexSource(baseDraft),
  };
};

const parsePrepContextField = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value) as ResumeInput["prepContext"];
  } catch {
    return undefined;
  }
};

export const parseResumeRequest = async (request: Request) => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("resumeFile");
    const input = resumeInputSchema.parse({
      targetRole: formData.get("targetRole"),
      targetCompany: formData.get("targetCompany") || undefined,
      location: formData.get("location") || undefined,
      locale: formData.get("locale") || undefined,
      sampleMode: formData.get("sampleMode") === "true" ? true : undefined,
      profileSummary: formData.get("profileSummary") || undefined,
      jobDescription: formData.get("jobDescription") || undefined,
      templateKey: formData.get("templateKey") || undefined,
      candidateName: formData.get("candidateName") || undefined,
      prepContext: parsePrepContextField(formData.get("prepContext")),
    });

    if (file instanceof File && file.size > 0) {
      const extractedText = await extractResumeText(file);
      return {
        ...input,
        uploadedResumeText: extractedText,
        uploadedFileName: file.name,
        uploadedMimeType: file.type || "application/octet-stream",
      } satisfies ResumeInput;
    }

    return input;
  }

  return resumeInputSchema.parse(await request.json());
};

const buildPrepSignals = async (input: ResumeInput, viewer: ViewerContext | undefined): Promise<PrepSignals> => {
  const [dashboardSummary, activitySummary] = await Promise.all([
    getDashboardSummaryData(viewer ?? {}),
    getActivitySummaryData(viewer ?? {}),
  ]);

  const recentProblemNames = Array.from(
    new Set([
      ...(input.prepContext?.recentProblemNames ?? []),
      ...activitySummary.recentSubmissions
        .filter((entry) => entry.status === "Accepted")
        .map((entry) => entry.problemName),
    ])
  ).slice(0, 6);

  return {
    solvedCount: input.prepContext?.solvedCount ?? dashboardSummary.solvedCount,
    streak: input.prepContext?.streak ?? dashboardSummary.streak,
    weakTopics: input.prepContext?.weakTopics?.length ? input.prepContext.weakTopics : dashboardSummary.weakTopics,
    recentProblemNames,
    latestMockScore: input.prepContext?.latestMockScore,
    latestMockCompany: input.prepContext?.latestMockCompany,
  };
};

export const generateResumeDraftWithGemini = async (input: ResumeInput, viewer?: ViewerContext) => {
  const prepSignals = await buildPrepSignals(input, viewer);
  const fallbackDraft = buildFallbackSeed(input, prepSignals, viewer);

  const sourceContext = input.uploadedResumeText
    ? `Uploaded resume source (${input.uploadedFileName ?? "file"}):\n${sanitizePromptInput(input.uploadedResumeText, 20_000)}`
    : input.profileSummary
      ? `Profile summary and manual context:\n${sanitizePromptInput(input.profileSummary, 6_000)}`
      : "No uploaded resume. Build from the candidate's coding prep history, current role target, and India-focused placement context.";

  const prepContextLines = [
    `Solved problems: ${prepSignals.solvedCount}`,
    `Current streak: ${prepSignals.streak}`,
    `Weak topics: ${prepSignals.weakTopics.join(", ") || "Arrays, Strings, Binary Search"}`,
    `Recent solved problem names: ${prepSignals.recentProblemNames.join(", ") || "Two Sum, Reverse String, Binary Search"}`,
    prepSignals.latestMockScore ? `Latest mock interview score: ${prepSignals.latestMockScore}/100` : "Latest mock interview score: unavailable",
    prepSignals.latestMockCompany ? `Latest mock interview company: ${prepSignals.latestMockCompany}` : "Latest mock interview company: unavailable",
  ].join("\n");

  try {
    const response = await callGeminiJson({
      systemPrompt:
        "You are a senior resume strategist for India-first developer hiring. Return strict JSON only. Focus on ATS readability, recruiter trust, and quantified project proof. Never use tables, columns, icons, or decorative formatting.",
      userPrompt: [
        `Candidate name: ${input.candidateName ?? viewer?.displayName ?? "CodeOrbit Candidate"}`,
        `Target role: ${input.targetRole}`,
        `Target company: ${input.targetCompany ?? "India-first developer hiring"}`,
        `Location: ${input.location ?? "India"}`,
        `Output language: ${input.locale === "hi" ? "Hindi" : "English"}`,
        `Preferred template: ${resolveTemplateKey(input)}`,
        input.jobDescription
          ? `Job description:\n${sanitizePromptInput(input.jobDescription, 8_000)}`
          : "No pasted JD. Infer likely role keywords from the target role and company.",
        sourceContext,
        `Prep signals:\n${prepContextLines}`,
        'Return JSON with keys fullName, headline, summary, templateKey, atsScore, markdown, skills, experience, achievements, projects, education, certifications, provider.',
        'templateKey must be one of: signal-single-column, india-fresher, product-engineer.',
        'summary must be one paragraph that feels premium, recruiter-safe, and ATS friendly.',
        'experience must be a list of roles with title, organization, timeline, bullets.',
        'projects must turn coding practice and shipped work into concise proof bullets.',
        'education should be realistic for an Indian early-career developer if the source is incomplete.',
        'markdown must represent a clean single-column resume without tables.',
      ].join("\n\n"),
      schema: looseResumeSchema,
    });

    const aiDraft: Partial<ResumeDraftSeed> = {
      fullName: response.fullName?.trim() || undefined,
      headline: response.headline?.trim() || undefined,
      summary: response.summary?.trim() || undefined,
      templateKey: response.templateKey,
      atsScore: typeof response.atsScore === "number" && Number.isFinite(response.atsScore) ? response.atsScore : undefined,
      markdown: response.markdown?.trim() || undefined,
      skills: coerceStringArray(response.skills),
      experience: coerceExperience(response.experience),
      achievements: coerceStringArray(response.achievements),
      projects: coerceProjects(response.projects),
      education: coerceEducation(response.education),
      certifications: coerceStringArray(response.certifications),
      provider: response.provider?.trim() || "gemini",
    };

    return finalizeDraft(input, mergeDrafts(fallbackDraft, aiDraft));
  } catch (error) {
    console.error("Gemini resume generation failed:", error);
    return finalizeDraft(input, fallbackDraft);
  }
};
