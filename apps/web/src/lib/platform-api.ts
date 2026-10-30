"use client";

import {
  activitySummarySchema,
  adminSummarySchema,
  aiAssistInputSchema,
  aiAssistResponseSchema,
  billingOrderSchema,
  billingSummarySchema,
  billingVerificationSchema,
  bootstrapProfileInputSchema,
  runCodeInputSchema,
  runCodeResponseSchema,
  dashboardSummarySchema,
  getProblemInputSchema,
  leaderboardSummarySchema,
  mockInterviewInputSchema,
  mockInterviewLiveResponseSchema,
  mockInterviewResponseSchema,
  recruiterBetaWorkspaceSchema,
  recruiterCandidateReviewSchema,
  paidBillingPlanIdSchema,
  problemDetailSchema,
  problemListItemSchema,
  resumeInputSchema,
  resumePdfExportInputSchema,
  resumeResponseSchema,
  resumeRoasterInputSchema,
  resumeRoasterResponseSchema,
  submissionReceiptSchema,
  campusBetaWorkspaceSchema,
  campusCohortInterventionSchema,
  userProfileSchema,
  viewerPreferencesInputSchema,
  viewerPreferencesSchema,
  workspaceRoleUpdateInputSchema,
  type ActivitySummary,
  type AdminSummary,
  type AiAssistInput,
  type AiAssistResponse,
  type BillingOrder,
  type BillingSummary,
  type BillingVerification,
  type BootstrapProfileInput,
  type CodeExecutionInput,
  type DashboardSummary,
  type LeaderboardSummary,
  type MockInterviewInput,
  type MockInterviewLiveResponse,
  type MockInterviewResponse,
  type RecruiterBetaWorkspace,
  type RecruiterCandidateReview,
  type PaidBillingPlanId,
  type ProblemDetail,
  type ProblemListItem,
  type ResumeInput,
  type ResumeResponse,
  type ResumeRoasterInput,
  type ResumeRoasterResponse,
  type RunCodeResponse,
  type SubmissionReceipt,
  type UserProfile,
  type ViewerPreferences,
  type ViewerPreferencesInput,
  type CampusBetaWorkspace,
  type CampusCohortIntervention,
  type WorkspaceRoleUpdateInput,
} from "@codeorbit/schema";
import { z } from "zod";
import { callFunction, getFirebaseClientServices } from "./firebase/client";

const listProblemsResponseSchema = z.object({
  problems: z.array(problemListItemSchema),
});

const getProblemDetailResponseSchema = z.object({
  problem: problemDetailSchema,
});

const bootstrapProfileResponseSchema = z.object({
  profile: userProfileSchema,
});

const viewerProfileResponseSchema = z.object({
  profile: userProfileSchema,
});

const dashboardSummaryResponseSchema = z.object({
  summary: dashboardSummarySchema,
});

const activitySummaryResponseSchema = z.object({
  summary: activitySummarySchema,
});

const leaderboardSummaryResponseSchema = z.object({
  summary: leaderboardSummarySchema,
});

const adminSummaryResponseSchema = z.object({
  summary: adminSummarySchema,
});

const billingSummaryResponseSchema = z.object({
  summary: billingSummarySchema,
});

const billingOrderResponseSchema = billingOrderSchema;
const billingVerificationResponseSchema = billingVerificationSchema;
const runCodeResponsePayloadSchema = runCodeResponseSchema;
const submissionReceiptResponseSchema = submissionReceiptSchema;

const billingVerificationInputSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

const submitSolutionInputSchema = runCodeInputSchema.extend({
  problemId: z.string().min(1),
});

const exportResumePdfResponseSchema = z.object({
  fileName: z.string().min(1),
  base64Pdf: z.string().min(1),
});

const apiErrorSchema = z.object({
  message: z.string().min(1),
});

const buildViewerHeaders = async () => {
  const services = await getFirebaseClientServices().catch(() => null);
  const user = services?.auth.currentUser;
  const idToken = user ? await user.getIdToken().catch(() => null) : null;

  return {
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    ...(user?.uid ? { "x-codeorbit-viewer-uid": user.uid } : {}),
    ...(user?.email ? { "x-codeorbit-viewer-email": user.email } : {}),
    ...(user?.displayName ? { "x-codeorbit-viewer-name": user.displayName } : {}),
  };
};

const getJson = async <TResponse>(url: string, schema: z.ZodType<TResponse>) => {
  const response = await fetch(url, {
    method: "GET",
    headers: await buildViewerHeaders(),
  });

  const body = (await response.json()) as unknown;
  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);
    throw new Error(parsedError.success ? parsedError.data.message : "Request failed.");
  }

  return schema.parse(body);
};

const postJson = async <TResponse>(url: string, payload: unknown, schema: z.ZodType<TResponse>) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await buildViewerHeaders()),
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as unknown;
  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);
    throw new Error(parsedError.success ? parsedError.data.message : "Request failed.");
  }

  return schema.parse(body);
};

const postFormData = async <TResponse>(url: string, payload: FormData, schema: z.ZodType<TResponse>) => {
  const response = await fetch(url, {
    method: "POST",
    headers: await buildViewerHeaders(),
    body: payload,
  });

  const body = (await response.json()) as unknown;
  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);
    throw new Error(parsedError.success ? parsedError.data.message : "Request failed.");
  }

  return schema.parse(body);
};

export const platformApi = {
  async listProblems(): Promise<ProblemListItem[]> {
    const response = await getJson("/api/platform/problems", listProblemsResponseSchema);
    return listProblemsResponseSchema.parse(response).problems;
  },
  async getProblemDetail(problemId: string): Promise<ProblemDetail> {
    const payload = getProblemInputSchema.parse({ problemId });
    const response = await getJson(`/api/platform/problems/${encodeURIComponent(payload.problemId)}`, getProblemDetailResponseSchema);
    return getProblemDetailResponseSchema.parse(response).problem;
  },
  async bootstrapUserProfile(input: BootstrapProfileInput): Promise<UserProfile> {
    const payload = bootstrapProfileInputSchema.parse(input);
    const response = await postJson("/api/platform/bootstrap-profile", payload, bootstrapProfileResponseSchema);
    return bootstrapProfileResponseSchema.parse(response).profile;
  },
  async getViewerProfile(): Promise<UserProfile> {
    const response = await getJson("/api/platform/profile", viewerProfileResponseSchema);
    return viewerProfileResponseSchema.parse(response).profile;
  },
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await getJson("/api/platform/dashboard", dashboardSummaryResponseSchema);
    return dashboardSummaryResponseSchema.parse(response).summary;
  },
  async getActivitySummary(): Promise<ActivitySummary> {
    const response = await getJson("/api/platform/activity", activitySummaryResponseSchema);
    return activitySummaryResponseSchema.parse(response).summary;
  },
  async getLeaderboardSummary(): Promise<LeaderboardSummary> {
    const response = await getJson("/api/platform/leaderboard", leaderboardSummaryResponseSchema);
    return leaderboardSummaryResponseSchema.parse(response).summary;
  },
  async getAdminSummary(): Promise<AdminSummary> {
    const response = await getJson("/api/platform/admin", adminSummaryResponseSchema);
    return adminSummaryResponseSchema.parse(response).summary;
  },
  async getBillingSummary(): Promise<BillingSummary> {
    const response = await getJson("/api/platform/billing-summary", billingSummaryResponseSchema);
    return billingSummaryResponseSchema.parse(response).summary;
  },
  async createBillingOrder(planId: PaidBillingPlanId): Promise<BillingOrder> {
    const payload = { planId: paidBillingPlanIdSchema.parse(planId) };
    try {
      return await postJson("/api/platform/billing/order", payload, billingOrderResponseSchema);
    } catch (routeError) {
      console.warn("Direct billing order route unavailable, attempting fallback:", routeError);
      const response = await callFunction<typeof payload, unknown>("createBillingOrder", payload);
      return billingOrderResponseSchema.parse(response);
    }
  },
  async verifyBillingPayment(input: {
    orderId: string;
    paymentId: string;
    signature: string;
    planId?: PaidBillingPlanId;
  }): Promise<BillingVerification> {
    const payload = billingVerificationInputSchema.parse(input);
    try {
      return await postJson("/api/platform/billing/verify", payload, billingVerificationResponseSchema);
    } catch (routeError) {
      console.warn("Direct billing verify route unavailable, attempting fallback:", routeError);
      const response = await callFunction<typeof payload, unknown>("verifyBillingPayment", payload);
      return billingVerificationResponseSchema.parse(response);
    }
  },
  async runCode(input: CodeExecutionInput): Promise<RunCodeResponse> {
    const payload = runCodeInputSchema.parse(input);
    return postJson("/api/platform/run", payload, runCodeResponsePayloadSchema);
  },
  async submitSolution(input: {
    problemId: string;
    language: string;
    submission: string;
    stdin?: string;
    expectedOutput?: string;
  }): Promise<SubmissionReceipt> {
    const payload = submitSolutionInputSchema.parse(input);
    return postJson("/api/platform/submit", payload, submissionReceiptResponseSchema);
  },
  async getAiProblemAssist(input: AiAssistInput): Promise<AiAssistResponse> {
    const payload = aiAssistInputSchema.parse(input);
    return postJson("/api/ai/problem-assist", payload, aiAssistResponseSchema);
  },
  async generateMockInterviewFeedback(input: MockInterviewInput): Promise<MockInterviewResponse> {
    const payload = mockInterviewInputSchema.parse(input);
    return postJson("/api/ai/mock-interview", payload, mockInterviewResponseSchema);
  },
  async generateLiveMockInterviewFeedback(input: MockInterviewInput): Promise<MockInterviewLiveResponse> {
    const payload = mockInterviewInputSchema.parse(input);
    return postJson("/api/ai/mock-interview/live", payload, mockInterviewLiveResponseSchema);
  },
  async generateResumeDraft(input: ResumeInput, resumeFile?: File | null): Promise<ResumeResponse> {
    const payload = resumeInputSchema.parse(input);
    if (resumeFile) {
      const formData = new FormData();
      formData.set("targetRole", payload.targetRole);
      if (payload.targetCompany) {
        formData.set("targetCompany", payload.targetCompany);
      }
      if (payload.location) {
        formData.set("location", payload.location);
      }
      if (payload.locale) {
        formData.set("locale", payload.locale);
      }
      if (payload.sampleMode) {
        formData.set("sampleMode", "true");
      }
      if (payload.profileSummary) {
        formData.set("profileSummary", payload.profileSummary);
      }
      if (payload.jobDescription) {
        formData.set("jobDescription", payload.jobDescription);
      }
      if (payload.templateKey) {
        formData.set("templateKey", payload.templateKey);
      }
      if (payload.candidateName) {
        formData.set("candidateName", payload.candidateName);
      }
      if (payload.prepContext) {
        formData.set("prepContext", JSON.stringify(payload.prepContext));
      }
      formData.set("resumeFile", resumeFile);
      return postFormData("/api/ai/resume", formData, resumeResponseSchema);
    }

    return postJson("/api/ai/resume", payload, resumeResponseSchema);
  },
  async exportResumePdf(input: { draft: ResumeResponse; fileNameHint?: string }): Promise<{ fileName: string; base64Pdf: string }> {
    const payload = resumePdfExportInputSchema.parse(input);
    return postJson("/api/ai/resume/export", payload, exportResumePdfResponseSchema);
  },
  async roastResume(input: ResumeRoasterInput): Promise<ResumeRoasterResponse> {
    const payload = resumeRoasterInputSchema.parse(input);
    return postJson("/api/ai/resume/roast", payload, resumeRoasterResponseSchema);
  },
  async updateViewerPreferences(input: ViewerPreferencesInput): Promise<ViewerPreferences> {
    const payload = viewerPreferencesInputSchema.parse(input);
    return postJson("/api/platform/preferences", payload, viewerPreferencesSchema);
  },
  async getRecruiterBetaWorkspace(): Promise<RecruiterBetaWorkspace> {
    const response = await callFunction<Record<string, never>, unknown>("getRecruiterBetaWorkspace", {});
    return recruiterBetaWorkspaceSchema.parse(response);
  },
  async saveRecruiterCandidateReview(input: {
    candidateHandle: string;
    status: RecruiterCandidateReview["status"];
    note?: string;
  }): Promise<RecruiterCandidateReview> {
    const payload = recruiterCandidateReviewSchema
      .omit({ updatedAtIso: true })
      .extend({ note: z.string().max(1000).optional().default("") })
      .parse(input);
    const response = await callFunction<typeof payload, unknown>("saveRecruiterCandidateReview", payload);
    return recruiterCandidateReviewSchema.parse(response);
  },
  async getCampusBetaWorkspace(): Promise<CampusBetaWorkspace> {
    const response = await callFunction<Record<string, never>, unknown>("getCampusBetaWorkspace", {});
    return campusBetaWorkspaceSchema.parse(response);
  },
  async saveCampusCohortIntervention(input: {
    cohortId: string;
    priorityFocus: string;
    note?: string;
  }): Promise<CampusCohortIntervention> {
    const payload = campusCohortInterventionSchema
      .omit({ updatedAtIso: true })
      .extend({ note: z.string().max(1000).optional().default("") })
      .parse(input);
    const response = await callFunction<typeof payload, unknown>("saveCampusCohortIntervention", payload);
    return campusCohortInterventionSchema.parse(response);
  },
  async setWorkspaceRole(input: WorkspaceRoleUpdateInput): Promise<UserProfile> {
    const payload = workspaceRoleUpdateInputSchema.parse(input);
    const response = await callFunction<typeof payload, unknown>("setWorkspaceRole", payload);
    return bootstrapProfileResponseSchema.parse(response).profile;
  },
};
