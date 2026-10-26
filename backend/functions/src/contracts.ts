import { z } from "zod";

export const bootstrapProfileInputSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
});

export const getProblemInputSchema = z.object({
  problemId: z.string().min(1),
});

export const codeExecutionInputSchema = z.object({
  language: z.string().min(1),
  submission: z.string().min(1).max(50000),
  stdin: z.string().max(20000).optional(),
  expectedOutput: z.string().max(20000).optional(),
});

export const runCodeInputSchema = codeExecutionInputSchema;

export const submitInputSchema = codeExecutionInputSchema.extend({
  problemId: z.string().min(1),
});

export const verifyBillingPaymentInputSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const createBillingOrderInputSchema = z.object({
  planId: z.string().min(1),
});

export const aiAssistInputSchema = z.object({
  problemId: z.string().min(1),
  mode: z.enum(["hint", "eli5", "solver"]),
  code: z.string().max(50000).optional(),
  language: z.string().max(40).optional(),
});

export const mockInterviewInputSchema = z.object({
  company: z.string().min(1).max(60),
  role: z.string().min(1).max(80),
  transcript: z.string().min(1).max(20000),
  notes: z.string().max(10000).optional(),
});

export const resumeInputSchema = z.object({
  targetRole: z.string().min(1).max(100),
  targetCompany: z.string().min(1).max(100).optional(),
  location: z.string().max(100).optional(),
  profileSummary: z.string().max(2000).optional(),
});

export const viewerPreferencesInputSchema = z.object({
  locale: z.enum(["en", "hi"]).optional(),
  privacyConsentAccepted: z.boolean().optional(),
});

export const workspaceRoleSchema = z.enum(["user", "admin", "recruiter_beta", "campus_beta"]);

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

export const recruiterCandidateReviewInputSchema = z.object({
  candidateHandle: z.string().min(1).max(120),
  status: z.enum(["new", "reviewing", "shortlisted", "on_hold"]),
  note: z.string().max(1000).optional(),
});

export const campusCohortInterventionInputSchema = z.object({
  cohortId: z.string().min(1).max(120),
  priorityFocus: z.string().min(1).max(160),
  note: z.string().max(1000).optional(),
});
