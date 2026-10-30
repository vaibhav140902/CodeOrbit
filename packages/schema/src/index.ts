import { z } from "zod";

export const problemDifficultySchema = z.enum(["Easy", "Medium", "Hard"]);

export const problemListItemSchema = z.object({
  id: z.string().min(1),
  problemName: z.string().min(1),
  difficulty: problemDifficultySchema,
  tags: z.array(z.string().min(1)),
});

export const problemDetailSchema = problemListItemSchema.extend({
  description: z.string().min(1),
  examples: z.array(
    z.object({
      input: z.string().min(1),
      output: z.string().min(1),
      explanation: z.string().optional(),
    })
  ),
  constraints: z.array(z.string().min(1)),
  starterCode: z.string().min(1),
});

export const workspaceRoleSchema = z.enum(["user", "admin", "recruiter_beta", "campus_beta"]);

export const userProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  isAdmin: z.boolean().default(false),
  locale: z.enum(["en", "hi"]).default("en"),
  role: workspaceRoleSchema.default("user"),
  createdAtIso: z.string().datetime().optional(),
});

export const readinessScoreTierSchema = z.enum([
  "Needs Practice",
  "Placement Ready",
  "Top Tier Candidate",
  "Day-1 FAANG Ready",
]);

export const readinessScoreBreakdownSchema = z.object({
  easySolved: z.number().int().nonnegative(),
  mediumSolved: z.number().int().nonnegative(),
  hardSolved: z.number().int().nonnegative(),
  acceptanceRatePercent: z.number().min(0).max(100),
});

export const readinessScoreSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  topicMasteryScore: z.number().int().min(0).max(100),
  companyTrackScore: z.number().int().min(0).max(100),
  consistencyScore: z.number().int().min(0).max(100),
  accuracyScore: z.number().int().min(0).max(100),
  interviewAtsScore: z.number().int().min(0).max(100),
  solvedCount: z.number().int().nonnegative(),
  totalSubmissions: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  tier: readinessScoreTierSchema,
  breakdown: readinessScoreBreakdownSchema,
  lastCalculatedIso: z.string().datetime(),
});

export const dashboardSummarySchema = z.object({
  streak: z.number().int().nonnegative(),
  solvedCount: z.number().int().nonnegative(),
  weakTopics: z.array(z.string().min(1)),
  recommendedTrack: z.string().min(1),
  premiumActive: z.boolean(),
  readinessScore: readinessScoreSchema.optional(),
});

export const leaderboardEntrySchema = z.object({
  uid: z.string().min(1),
  displayName: z.string().min(1),
  solvedCount: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  rank: z.number().int().positive(),
  premiumActive: z.boolean(),
});

export const leaderboardSummarySchema = z.object({
  entries: z.array(leaderboardEntrySchema),
  viewerRank: z.number().int().positive().nullable(),
  viewerSolvedCount: z.number().int().nonnegative(),
});

export const activityEntrySchema = z.object({
  id: z.string().min(1),
  problemId: z.string().min(1),
  problemName: z.string().min(1),
  language: z.string().min(1),
  status: z.string().min(1),
  submittedAtIso: z.string().datetime(),
});

export const activitySummarySchema = z.object({
  recentSubmissions: z.array(activityEntrySchema),
  pendingCount: z.number().int().nonnegative(),
  acceptedCount: z.number().int().nonnegative(),
  totalAttempts: z.number().int().nonnegative(),
});

export const adminSummarySchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  activeSubscriptions: z.number().int().nonnegative(),
  publishedProblems: z.number().int().nonnegative(),
  totalRevenuePaise: z.number().int().nonnegative(),
  aiUsageToday: z.number().int().nonnegative(),
});

export const billingPlanIdSchema = z.enum(["free", "premium-monthly", "premium-lifetime"]);
export const paidBillingPlanIdSchema = z.enum(["premium-monthly", "premium-lifetime"]);

export const billingSummarySchema = z.object({
  planId: billingPlanIdSchema,
  planName: z.string().min(1),
  status: z.string().min(1),
  premiumActive: z.boolean(),
  validUntilIso: z.string().datetime().nullable(),
});

export const billingOrderSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().int().nonnegative(),
  currency: z.string().min(1),
  keyId: z.string().min(1),
  planId: paidBillingPlanIdSchema,
  planName: z.string().min(1),
});

export const billingVerificationSchema = z.object({
  status: z.string().min(1),
  planId: paidBillingPlanIdSchema,
  validUntil: z.string().datetime(),
});

export const codeExecutionInputSchema = z.object({
  language: z.string().min(1),
  submission: z.string().min(1).max(50_000),
  stdin: z.string().max(20_000).optional(),
  expectedOutput: z.string().max(20_000).optional(),
});

export const codeExecutionResultSchema = z.object({
  message: z.string().min(1),
  status: z.string().min(1),
  judgeStatus: z.string().min(1),
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  compileOutput: z.string().nullable(),
  timeSeconds: z.string().nullable(),
  memoryKb: z.number().nullable(),
  passed: z.boolean().nullable(),
  expectedOutput: z.string().nullable(),
  language: z.string().min(1),
});

export const runCodeInputSchema = codeExecutionInputSchema;
export const runCodeResponseSchema = codeExecutionResultSchema;

export const submissionReceiptSchema = codeExecutionResultSchema.extend({
  id: z.string().min(1),
});

export const aiAssistModeSchema = z.enum(["hint", "eli5", "solver", "review"]);

export const aiAssistInputSchema = z.object({
  problemId: z.string().min(1),
  mode: aiAssistModeSchema,
  code: z.string().max(50_000).optional(),
  language: z.string().max(40).optional(),
  problemName: z.string().max(120).optional(),
  problemDifficulty: problemDifficultySchema.optional(),
  problemDescription: z.string().max(8_000).optional(),
  problemTags: z.array(z.string().min(1).max(40)).max(12).optional(),
  problemConstraints: z.array(z.string().min(1).max(200)).max(12).optional(),
  stdin: z.string().max(20_000).optional(),
  expectedOutput: z.string().max(20_000).optional(),
  actualOutput: z.string().max(20_000).optional(),
  stderr: z.string().max(20_000).optional(),
  compileOutput: z.string().max(20_000).optional(),
  judgeStatus: z.string().max(120).optional(),
});

export const aiAssistResponseSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  provider: z.string().min(1),
});

export const mockInterviewInputSchema = z.object({
  company: z.string().min(1).max(60),
  role: z.string().min(1).max(80),
  transcript: z.string().min(1).max(20_000),
  notes: z.string().max(10_000).optional(),
});

export const mockInterviewLiveResponseSchema = z.object({
  headline: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1).max(4),
  provider: z.string().min(1),
});

export const mockInterviewResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  problemSolvingScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  improvements: z.array(z.string().min(1)),
  nextSteps: z.array(z.string().min(1)),
  provider: z.string().min(1),
});

export const resumeTemplateKeySchema = z.enum(["signal-single-column", "india-fresher", "product-engineer"]);

export const resumeAtsCategorySchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  score: z.number().min(0).max(100),
  insight: z.string().min(1),
});

export const resumeAtsBreakdownSchema = z.object({
  summary: z.string().min(1),
  categories: z.array(resumeAtsCategorySchema).min(1),
  matchedKeywords: z.array(z.string().min(1)),
  missingKeywords: z.array(z.string().min(1)),
  improvementActions: z.array(z.string().min(1)).min(1),
});

export const resumeTemplateDescriptorSchema = z.object({
  key: resumeTemplateKeySchema,
  name: z.string().min(1),
  headline: z.string().min(1),
  description: z.string().min(1),
  bestFor: z.array(z.string().min(1)).min(1),
});

export const resumeInputSchema = z.object({
  targetRole: z.string().min(1).max(100),
  targetCompany: z.string().min(1).max(100).optional(),
  location: z.string().max(100).optional(),
  locale: z.enum(["en", "hi"]).optional(),
  sampleMode: z.boolean().optional(),
  profileSummary: z.string().max(6_000).optional(),
  jobDescription: z.string().max(12_000).optional(),
  templateKey: resumeTemplateKeySchema.optional(),
  candidateName: z.string().min(1).max(100).optional(),
  uploadedResumeText: z.string().max(30_000).optional(),
  uploadedFileName: z.string().max(200).optional(),
  uploadedMimeType: z.string().max(120).optional(),
  prepContext: z
    .object({
      solvedCount: z.number().int().nonnegative().optional(),
      streak: z.number().int().nonnegative().optional(),
      weakTopics: z.array(z.string().min(1)).max(8).optional(),
      recentProblemNames: z.array(z.string().min(1)).max(8).optional(),
      latestMockScore: z.number().min(0).max(100).optional(),
      latestMockCompany: z.string().min(1).max(80).optional(),
    })
    .optional(),
});

export const resumeResponseSchema = z.object({
  fullName: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  templateKey: resumeTemplateKeySchema,
  templateName: z.string().min(1),
  atsScore: z.number().min(0).max(100),
  atsBreakdown: resumeAtsBreakdownSchema,
  markdown: z.string().min(1),
  latexSource: z.string().min(1),
  skills: z.array(z.string().min(1)),
  experience: z.array(
    z.object({
      title: z.string().min(1),
      organization: z.string().min(1),
      timeline: z.string().min(1).optional(),
      bullets: z.array(z.string().min(1)),
    })
  ),
  achievements: z.array(z.string().min(1)),
  projects: z.array(
    z.object({
      title: z.string().min(1),
      link: z.string().url().optional(),
      bullets: z.array(z.string().min(1)),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string().min(1),
      degree: z.string().min(1),
      details: z.string().min(1).optional(),
    })
  ),
  certifications: z.array(z.string().min(1)),
  provider: z.string().min(1),
});

export const resumePdfExportInputSchema = z.object({
  draft: resumeResponseSchema,
  fileNameHint: z.string().max(120).optional(),
});

export const viewerPreferencesInputSchema = z.object({
  locale: z.enum(["en", "hi"]).optional(),
  privacyConsentAccepted: z.boolean().optional(),
});

export const viewerPreferencesSchema = z.object({
  locale: z.enum(["en", "hi"]),
  privacyConsentAccepted: z.boolean(),
  privacyConsentAcceptedAtIso: z.string().datetime().nullable(),
});

export const bootstrapProfileInputSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
});

export const getProblemInputSchema = z.object({
  problemId: z.string().min(1),
});

const slugSchema = z.string().min(1).regex(/^[a-z0-9-]+$/);

export const publicContentLocaleSchema = z.enum(["en", "hi", "bilingual"]);
export const companyTrackRoundSchema = z.enum(["OA", "Phone", "Onsite", "Screening", "Behavioral"]);
export const trackSourceConfidenceSchema = z.enum(["editor-reviewed", "community-signal", "official-pattern"]);
export const trackFreshnessSchema = z.enum(["fresh", "maintained", "needs-review"]);
export const geographyRelevanceSchema = z.enum(["India-first", "Global", "India + Global"]);

export const companyTrackSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  headline: z.string().min(1),
  hiringFocus: z.string().min(1),
  geographyRelevance: geographyRelevanceSchema,
  overview: z.string().min(1),
  roleSlugs: z.array(slugSchema).min(1),
  freshnessNote: z.string().min(1),
});

export const roleTrackSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  level: z.enum(["Intern", "Fresher", "Early Career", "Experienced"]),
  summary: z.string().min(1),
  focusSkills: z.array(z.string().min(1)).min(1),
  interviewSignals: z.array(z.string().min(1)).min(1),
});

export const companyTrackItemSchema = z.object({
  id: slugSchema,
  title: z.string().min(1),
  companySlug: slugSchema,
  roleSlug: slugSchema,
  problemId: slugSchema.optional(),
  roundType: companyTrackRoundSchema,
  topic: z.string().min(1),
  difficulty: problemDifficultySchema,
  freshness: trackFreshnessSchema,
  geographyRelevance: geographyRelevanceSchema,
  sourceConfidence: trackSourceConfidenceSchema,
  signal: z.enum(["must-do", "high-frequency", "stretch"]).optional(),
  sourceLabel: z.string().min(1).optional(),
  sourceUrl: z.string().url().optional(),
  lastUpdatedIso: z.string().datetime(),
  explanation: z.string().min(1),
  hints: z.array(z.string().min(1)).min(1),
  idealTimeMinutes: z.number().int().positive(),
  rubric: z.array(z.string().min(1)).min(1),
});

export const readinessDimensionSchema = z.object({
  key: slugSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().min(0).max(100),
});

export const readinessAreaScoreSchema = z.object({
  key: slugSchema,
  label: z.string().min(1),
  score: z.number().min(0).max(100),
  insight: z.string().min(1),
});

export const readinessTimelinePointSchema = z.object({
  label: z.string().min(1),
  score: z.number().min(0).max(100),
  recordedAtIso: z.string().datetime(),
});

export const readinessGraphSchema = z.object({
  overallScore: z.number().min(0).max(100),
  topicMasteryScore: z.number().min(0).max(100),
  companyTrackScore: z.number().min(0).max(100),
  speedToSolveScore: z.number().min(0).max(100),
  hintDependenceScore: z.number().min(0).max(100),
  consistencyScore: z.number().min(0).max(100),
  mockInterviewScore: z.number().min(0).max(100),
  resumeFitScore: z.number().min(0).max(100),
  projectEvidenceScore: z.number().min(0).max(100),
  weakTopics: z.array(z.string().min(1)),
  companyScores: z.array(readinessAreaScoreSchema),
  roleScores: z.array(readinessAreaScoreSchema),
  timeline: z.array(readinessTimelinePointSchema),
});

export const projectEvidenceSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  repositoryUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  proofPoints: z.array(z.string().min(1)).min(1),
  lastUpdatedIso: z.string().datetime(),
});

export const resumeVariantSchema = z.object({
  id: slugSchema,
  name: z.string().min(1),
  roleSlug: slugSchema,
  targetCompanySlug: slugSchema.optional(),
  locale: publicContentLocaleSchema,
  templateKey: z.string().min(1),
  atsScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  updatedAtIso: z.string().datetime(),
  lastExportedAtIso: z.string().datetime().nullable(),
});

export const interviewSessionSchema = z.object({
  id: slugSchema,
  companySlug: slugSchema.optional(),
  roleSlug: slugSchema,
  roundType: companyTrackRoundSchema,
  overallScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  structureScore: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100),
  fillerWordScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  improvements: z.array(z.string().min(1)).min(1),
  recordedAtIso: z.string().datetime(),
});

export const proofProfileSchema = z.object({
  handle: slugSchema,
  fullName: z.string().min(1),
  headline: z.string().min(1),
  location: z.string().min(1),
  bio: z.string().min(1),
  languageSupport: z.array(publicContentLocaleSchema).min(1),
  solvedCount: z.number().int().nonnegative(),
  streakDays: z.number().int().nonnegative(),
  topTopics: z.array(z.string().min(1)).min(1),
  readiness: readinessGraphSchema,
  resumeVariants: z.array(resumeVariantSchema).min(1),
  topProjects: z.array(projectEvidenceSchema).min(1),
  companyTrackProgress: z.array(readinessAreaScoreSchema).min(1),
  publicResumeUrl: z.string().url().optional(),
  updatedAtIso: z.string().datetime(),
});

export const recruiterCandidateSummarySchema = z.object({
  handle: slugSchema,
  fullName: z.string().min(1),
  headline: z.string().min(1),
  readinessScore: z.number().min(0).max(100),
  targetRoleSlugs: z.array(slugSchema).min(1),
  targetCompanySlugs: z.array(slugSchema).min(1),
  interviewMomentum: z.enum(["rising", "steady", "needs-attention"]),
  proofProfileShared: z.boolean(),
});

export const recruiterReviewStatusSchema = z.enum(["new", "reviewing", "shortlisted", "on_hold"]);

export const recruiterCandidateReviewSchema = z.object({
  candidateHandle: slugSchema,
  status: recruiterReviewStatusSchema,
  note: z.string().max(1000).default(""),
  updatedAtIso: z.string().datetime(),
});

export const recruiterBetaWorkspaceSchema = z.object({
  candidates: z.array(recruiterCandidateSummarySchema),
  reviews: z.array(recruiterCandidateReviewSchema),
});

export const campusCohortSnapshotSchema = z.object({
  id: slugSchema,
  cohortLabel: z.string().min(1),
  studentsActive: z.number().int().nonnegative(),
  studentsReady: z.number().int().nonnegative(),
  applicationsTracked: z.number().int().nonnegative(),
  interviewsTracked: z.number().int().nonnegative(),
  topWeakAreas: z.array(z.string().min(1)).min(1),
});

export const campusCohortInterventionSchema = z.object({
  cohortId: slugSchema,
  priorityFocus: z.string().min(1).max(160),
  note: z.string().max(1000).default(""),
  updatedAtIso: z.string().datetime(),
});

export const campusBetaWorkspaceSchema = z.object({
  cohorts: z.array(campusCohortSnapshotSchema),
  interventions: z.array(campusCohortInterventionSchema),
});

export const jobApplicationStatusSchema = z.enum([
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "archived",
]);

export const interviewStageSchema = z.object({
  stage: z.string().min(1),
  status: z.enum(["planned", "completed", "cancelled"]),
  scheduledAtIso: z.string().datetime().optional(),
  notes: z.string().min(1).optional(),
});

export const jobApplicationSchema = z.object({
  id: slugSchema,
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  source: z.string().min(1),
  status: jobApplicationStatusSchema,
  readinessMatchScore: z.number().min(0).max(100),
  resumeVariantId: slugSchema.optional(),
  nextAction: z.string().min(1).optional(),
  stages: z.array(interviewStageSchema),
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
});

export const waitlistTargetSchema = z.enum(["recruiters", "campuses", "interview-sprint"]);

export const waitlistSubmissionSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  organization: z.string().min(1).max(160),
  role: z.string().min(1).max(120),
  target: waitlistTargetSchema,
  teamSize: z.string().max(40).optional(),
  message: z.string().max(1000).optional(),
  createdAtIso: z.string().datetime().optional(),
});

export const publicPricingTierSchema = z.object({
  id: z.enum(["free", "pro", "interview-sprint", "recruiter-campus"]),
  title: z.string().min(1),
  priceLabel: z.string().min(1),
  cadence: z.string().min(1),
  description: z.string().min(1),
  features: z.array(z.string().min(1)).min(1),
  cta: z.string().min(1),
  availability: z.enum(["live", "waitlist", "contact"]),
  spotlight: z.boolean().default(false),
});

export const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const resourceItemSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  readTimeMinutes: z.number().int().positive(),
  updatedAtIso: z.string().datetime(),
});

export const featureFlagSchema = z.object({
  key: slugSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  enabledDefault: z.boolean(),
});

export const workspaceRoleUpdateInputSchema = z
  .object({
    targetUid: z.string().min(1).optional(),
    targetEmail: z.string().email().optional(),
    role: workspaceRoleSchema,
  })
  .refine((value) => Boolean(value.targetUid || value.targetEmail), {
    message: "Either targetUid or targetEmail is required.",
    path: ["targetUid"],
  });

export const adminContentQueueItemSchema = z.object({
  id: slugSchema,
  type: z.enum(["problem", "track", "rubric", "pricing", "flag"]),
  title: z.string().min(1),
  status: z.enum(["draft", "review", "published", "blocked"]),
  owner: z.string().min(1),
  updatedAtIso: z.string().datetime(),
});

// Multi-Tenancy, Contests & DPDP Compliance (0004_tenancy_and_dpdp)
export const tenantTierSchema = z.enum(["tier-1", "tier-2", "tier-3"]);
export const tenantPlanStatusSchema = z.enum(["pilot", "active", "churned"]);

export const tenantSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  tier: tenantTierSchema,
  state: z.string().min(1),
  contactTpoName: z.string().min(1),
  contactTpoEmail: z.string().email(),
  contactTpoPhone: z.string().optional(),
  planStatus: tenantPlanStatusSchema,
  maxStudents: z.number().int().positive(),
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
});

export const tenantInputSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  tier: tenantTierSchema.default("tier-3"),
  state: z.string().min(1).default("UP"),
  contactTpoName: z.string().min(1),
  contactTpoEmail: z.string().email(),
  contactTpoPhone: z.string().optional(),
  planStatus: tenantPlanStatusSchema.default("pilot"),
  maxStudents: z.number().int().positive().default(1500),
});

export const tenantMemberRoleSchema = z.enum(["student", "tpo_admin", "faculty"]);

export const tenantMembershipSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  rollNumber: z.string().optional(),
  department: z.string().min(1),
  batchYear: z.number().int().positive(),
  role: tenantMemberRoleSchema,
  verified: z.boolean(),
  createdAtIso: z.string().datetime(),
});

export const tenantMembershipInputSchema = z.object({
  tenantId: z.string().min(1),
  rollNumber: z.string().max(50).optional(),
  department: z.string().min(1).max(50).default("CSE"),
  batchYear: z.number().int().positive().default(2026),
  role: tenantMemberRoleSchema.default("student"),
});

export const contestSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().nullable().optional(),
  title: z.string().min(1),
  slug: slugSchema,
  description: z.string().optional(),
  problemIds: z.array(z.string().min(1)),
  startTimeIso: z.string().datetime(),
  endTimeIso: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  isPublished: z.boolean(),
  createdBy: z.string().optional(),
  createdAtIso: z.string().datetime(),
});

export const contestInputSchema = z.object({
  tenantId: z.string().optional(),
  title: z.string().min(1).max(120),
  slug: slugSchema,
  description: z.string().max(2000).optional(),
  problemIds: z.array(z.string().min(1)).min(1),
  startTimeIso: z.string().datetime(),
  endTimeIso: z.string().datetime(),
  durationMinutes: z.number().int().positive().default(60),
  isPublished: z.boolean().default(false),
});

export const proctorEventTypeSchema = z.enum(["tab_blur", "fullscreen_exit", "paste_detected", "devtools_opened"]);

export const proctorEventSchema = z.object({
  id: z.string().min(1),
  contestId: z.string().min(1),
  userId: z.string().min(1),
  eventType: proctorEventTypeSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
  occurredAtIso: z.string().datetime(),
});

export const proctorEventInputSchema = z.object({
  contestId: z.string().min(1),
  eventType: proctorEventTypeSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const dpdpConsentLogSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  consentVersion: z.string().min(1),
  isUnder18: z.boolean(),
  parentGuardianEmail: z.string().email().optional(),
  purposesAccepted: z.array(z.string().min(1)),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  consentedAtIso: z.string().datetime(),
  revokedAtIso: z.string().datetime().nullable().optional(),
});

export const dpdpConsentInputSchema = z.object({
  consentVersion: z.string().min(1).default("2026.1"),
  isUnder18: z.boolean().default(false),
  parentGuardianEmail: z.string().email().optional(),
  purposesAccepted: z.array(z.string().min(1)).min(1).default(["ai_coaching", "tpo_reporting", "ats_analysis"]),
});

export type ProblemDifficulty = z.infer<typeof problemDifficultySchema>;
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export type ProblemListItem = z.infer<typeof problemListItemSchema>;
export type ProblemDetail = z.infer<typeof problemDetailSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type ReadinessScoreTier = z.infer<typeof readinessScoreTierSchema>;
export type ReadinessScoreBreakdown = z.infer<typeof readinessScoreBreakdownSchema>;
export type ReadinessScore = z.infer<typeof readinessScoreSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardSummary = z.infer<typeof leaderboardSummarySchema>;
export type ActivityEntry = z.infer<typeof activityEntrySchema>;
export type ActivitySummary = z.infer<typeof activitySummarySchema>;
export type AdminSummary = z.infer<typeof adminSummarySchema>;
export type BillingPlanId = z.infer<typeof billingPlanIdSchema>;
export type PaidBillingPlanId = z.infer<typeof paidBillingPlanIdSchema>;
export type BillingSummary = z.infer<typeof billingSummarySchema>;
export type BillingOrder = z.infer<typeof billingOrderSchema>;
export type BillingVerification = z.infer<typeof billingVerificationSchema>;
export type CodeExecutionInput = z.infer<typeof codeExecutionInputSchema>;
export type CodeExecutionResult = z.infer<typeof codeExecutionResultSchema>;
export type RunCodeInput = z.infer<typeof runCodeInputSchema>;
export type RunCodeResponse = z.infer<typeof runCodeResponseSchema>;
export type SubmissionReceipt = z.infer<typeof submissionReceiptSchema>;
export type AiAssistMode = z.infer<typeof aiAssistModeSchema>;
export type AiAssistInput = z.infer<typeof aiAssistInputSchema>;
export type AiAssistResponse = z.infer<typeof aiAssistResponseSchema>;
export type MockInterviewInput = z.infer<typeof mockInterviewInputSchema>;
export type MockInterviewLiveResponse = z.infer<typeof mockInterviewLiveResponseSchema>;
export type MockInterviewResponse = z.infer<typeof mockInterviewResponseSchema>;
export type ResumeTemplateKey = z.infer<typeof resumeTemplateKeySchema>;
export type ResumeAtsCategory = z.infer<typeof resumeAtsCategorySchema>;
export type ResumeAtsBreakdown = z.infer<typeof resumeAtsBreakdownSchema>;
export type ResumeTemplateDescriptor = z.infer<typeof resumeTemplateDescriptorSchema>;
export type ResumeInput = z.infer<typeof resumeInputSchema>;
export type ResumeResponse = z.infer<typeof resumeResponseSchema>;
export type ResumePdfExportInput = z.infer<typeof resumePdfExportInputSchema>;
export type ViewerPreferencesInput = z.infer<typeof viewerPreferencesInputSchema>;
export type ViewerPreferences = z.infer<typeof viewerPreferencesSchema>;
export type BootstrapProfileInput = z.infer<typeof bootstrapProfileInputSchema>;
export type GetProblemInput = z.infer<typeof getProblemInputSchema>;
export type PublicContentLocale = z.infer<typeof publicContentLocaleSchema>;
export type CompanyTrackRound = z.infer<typeof companyTrackRoundSchema>;
export type TrackSourceConfidence = z.infer<typeof trackSourceConfidenceSchema>;
export type TrackFreshness = z.infer<typeof trackFreshnessSchema>;
export type GeographyRelevance = z.infer<typeof geographyRelevanceSchema>;
export type CompanyTrack = z.infer<typeof companyTrackSchema>;
export type RoleTrack = z.infer<typeof roleTrackSchema>;
export type CompanyTrackItem = z.infer<typeof companyTrackItemSchema>;
export type ReadinessDimension = z.infer<typeof readinessDimensionSchema>;
export type ReadinessAreaScore = z.infer<typeof readinessAreaScoreSchema>;
export type ReadinessTimelinePoint = z.infer<typeof readinessTimelinePointSchema>;
export type ReadinessGraph = z.infer<typeof readinessGraphSchema>;
export type ProjectEvidence = z.infer<typeof projectEvidenceSchema>;
export type ResumeVariant = z.infer<typeof resumeVariantSchema>;
export type InterviewSession = z.infer<typeof interviewSessionSchema>;
export type ProofProfile = z.infer<typeof proofProfileSchema>;
export type RecruiterCandidateSummary = z.infer<typeof recruiterCandidateSummarySchema>;
export type RecruiterReviewStatus = z.infer<typeof recruiterReviewStatusSchema>;
export type RecruiterCandidateReview = z.infer<typeof recruiterCandidateReviewSchema>;
export type RecruiterBetaWorkspace = z.infer<typeof recruiterBetaWorkspaceSchema>;
export type CampusCohortSnapshot = z.infer<typeof campusCohortSnapshotSchema>;
export type CampusCohortIntervention = z.infer<typeof campusCohortInterventionSchema>;
export type CampusBetaWorkspace = z.infer<typeof campusBetaWorkspaceSchema>;
export type JobApplicationStatus = z.infer<typeof jobApplicationStatusSchema>;
export type InterviewStage = z.infer<typeof interviewStageSchema>;
export type JobApplication = z.infer<typeof jobApplicationSchema>;
export type WaitlistTarget = z.infer<typeof waitlistTargetSchema>;
export type WaitlistSubmission = z.infer<typeof waitlistSubmissionSchema>;
export type PublicPricingTier = z.infer<typeof publicPricingTierSchema>;
export type FaqItem = z.infer<typeof faqItemSchema>;
export type ResourceItem = z.infer<typeof resourceItemSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type AdminContentQueueItem = z.infer<typeof adminContentQueueItemSchema>;
export type WorkspaceRoleUpdateInput = z.infer<typeof workspaceRoleUpdateInputSchema>;
export type TenantTier = z.infer<typeof tenantTierSchema>;
export type TenantPlanStatus = z.infer<typeof tenantPlanStatusSchema>;
export type Tenant = z.infer<typeof tenantSchema>;
export type TenantInput = z.infer<typeof tenantInputSchema>;
export type TenantMemberRole = z.infer<typeof tenantMemberRoleSchema>;
export type TenantMembership = z.infer<typeof tenantMembershipSchema>;
export type TenantMembershipInput = z.infer<typeof tenantMembershipInputSchema>;
export type Contest = z.infer<typeof contestSchema>;
export type ContestInput = z.infer<typeof contestInputSchema>;
export type ProctorEventType = z.infer<typeof proctorEventTypeSchema>;
export type ProctorEvent = z.infer<typeof proctorEventSchema>;
export type ProctorEventInput = z.infer<typeof proctorEventInputSchema>;
export type DpdpConsentLog = z.infer<typeof dpdpConsentLogSchema>;
export type DpdpConsentInput = z.infer<typeof dpdpConsentInputSchema>;

export const userTierSchema = z.enum(["guest", "free", "pro"]);

export const rateLimitActionSchema = z.enum([
  "code_execution",
  "resume_generation",
  "resume_export",
  "problem_assist",
  "mock_interview",
  "readiness_score",
  "billing_action",
]);

export const rateLimitStatusSchema = z.object({
  limit: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
  resetAt: z.number().int().positive(),
  tier: userTierSchema,
  action: rateLimitActionSchema,
});

export const rateLimitErrorResponseSchema = z.object({
  error: z.literal("RATE_LIMIT_EXCEEDED"),
  message: z.string(),
  retryAfterSec: z.number().int().positive(),
  resetAt: z.number().int().positive(),
  limit: z.number().int().positive(),
  tier: userTierSchema,
  action: z.string(),
});

export type UserTier = z.infer<typeof userTierSchema>;
export type RateLimitAction = z.infer<typeof rateLimitActionSchema>;
export type RateLimitStatus = z.infer<typeof rateLimitStatusSchema>;
export type RateLimitErrorResponse = z.infer<typeof rateLimitErrorResponseSchema>;


