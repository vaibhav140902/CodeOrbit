import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import cors from "cors";

setGlobalOptions({ maxInstances: 20, region: "asia-south2" });

const allowedOrigins = [
  "https://codeorbit-ai-rebuild.vercel.app",
  "https://leetcode-clone-3ac0a.web.app",
  "https://leetcode-clone-3ac0a.firebaseapp.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
] as const;

const callableOptions = {
  enforceAppCheck: process.env.ENFORCE_APPCHECK === "true",
  cors: allowedOrigins,
};

const loadRuntime = async () => import("./runtime");

const corsMiddleware = cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

const runCors = (request: any, response: any) =>
  new Promise<void>((resolve, reject) => {
    corsMiddleware(request, response, (result) => {
      if (result instanceof Error) {
        reject(result);
        return;
      }
      resolve();
    });
  });

const wrapCallable = (handlerName: string) =>
  onCall(callableOptions, async (request) => {
    const runtime = await loadRuntime();
    const handler = runtime[handlerName as keyof typeof runtime];

    if (typeof handler !== "function") {
      throw new HttpsError("internal", `Missing runtime callable handler: ${handlerName}`);
    }

    return (handler as (request: unknown) => unknown)(request);
  });

const wrapHttp = (handlerName: string) =>
  onRequest(async (request, response) => {
    await runCors(request, response);
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    const runtime = await loadRuntime();
    const handler = runtime[handlerName as keyof typeof runtime];

    if (typeof handler !== "function") {
      throw new HttpsError("internal", `Missing runtime HTTP handler: ${handlerName}`);
    }

    return (handler as (request: unknown, response: unknown) => unknown)(request, response);
  });

export const helloWorld = wrapHttp("helloWorldHandler");
export const getSubmissions = wrapHttp("getSubmissionsHandler");
export const listProblems = wrapCallable("listProblemsHandler");
export const getProblemDetail = wrapCallable("getProblemDetailHandler");
export const bootstrapUserProfile = wrapCallable("bootstrapUserProfileHandler");
export const getViewerProfile = wrapCallable("getViewerProfileHandler");
export const getDashboardSummary = wrapCallable("getDashboardSummaryHandler");
export const getBillingSummary = wrapCallable("getBillingSummaryHandler");
export const getActivitySummary = wrapCallable("getActivitySummaryHandler");
export const getLeaderboardSummary = wrapCallable("getLeaderboardSummaryHandler");
export const getAdminSummary = wrapCallable("getAdminSummaryHandler");
export const getRecruiterBetaWorkspace = wrapCallable("getRecruiterBetaWorkspaceHandler");
export const saveRecruiterCandidateReview = wrapCallable("saveRecruiterCandidateReviewHandler");
export const getCampusBetaWorkspace = wrapCallable("getCampusBetaWorkspaceHandler");
export const saveCampusCohortIntervention = wrapCallable("saveCampusCohortInterventionHandler");
export const setWorkspaceRole = wrapCallable("setWorkspaceRoleHandler");
export const getAiProblemAssist = wrapCallable("getAiProblemAssistHandler");
export const generateMockInterviewFeedback = wrapCallable("generateMockInterviewFeedbackHandler");
export const generateResumeDraft = wrapCallable("generateResumeDraftHandler");
export const exportResumePdf = wrapCallable("exportResumePdfHandler");
export const updateViewerPreferences = wrapCallable("updateViewerPreferencesHandler");
export const runCode = wrapCallable("runCodeHandler");
export const submit = wrapCallable("submitHandler");
export const checkDailyFreeQuota = wrapCallable("checkDailyFreeQuotaHandler");
export const claimDailyFreePass = wrapCallable("claimDailyFreePassHandler");
export const createBillingOrder = wrapCallable("createBillingOrderHandler");
export const verifyBillingPayment = wrapCallable("verifyBillingPaymentHandler");
export const razorpayWebhook = wrapHttp("razorpayWebhookHandler");
