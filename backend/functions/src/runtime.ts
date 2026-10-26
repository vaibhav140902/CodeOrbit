import { createHmac, timingSafeEqual } from "crypto";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { getCatalogProblem, problemCatalog } from "./catalog";
import {
  aiAssistInputSchema,
  bootstrapProfileInputSchema,
  campusCohortInterventionInputSchema,
  runCodeInputSchema,
  createBillingOrderInputSchema,
  getProblemInputSchema,
  mockInterviewInputSchema,
  recruiterCandidateReviewInputSchema,
  resumeInputSchema,
  submitInputSchema,
  verifyBillingPaymentInputSchema,
  viewerPreferencesInputSchema,
  workspaceRoleUpdateInputSchema,
} from "./contracts";
import {
  getAdminSummaryFromSupabase,
  getDashboardSummaryFromSupabase,
  getPublishedProblemDetailFromSupabase,
  getUserProfileByEmailFromSupabase,
  getUserProfileFromSupabase,
  listPublishedProblemsFromSupabase,
  updateUserRoleInSupabase,
  upsertUserProfileInSupabase,
} from "./repository";
import { executeWithJudge0, supportsJudge0Language } from "./judge0";

const getAdminAppPackage = () => require("firebase-admin/app") as typeof import("firebase-admin/app");
const ensureAdminApp = () => {
  const { getApp, getApps, initializeApp } = getAdminAppPackage();
  return getApps().length > 0 ? getApp() : initializeApp();
};
const getAdminFirestore = () => require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");

const createLazyAdminService = <T extends object>(factory: () => T): T => {
  let instance: T | null = null;

  return new Proxy({} as T, {
    get(_target, prop: PropertyKey) {
      instance ??= factory();
      const service = instance as T & Record<PropertyKey, unknown>;
      const value = service[prop];
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
};

const db = createLazyAdminService(() => getAdminFirestore().getFirestore(ensureAdminApp()));
const auth = createLazyAdminService(() => require("firebase-admin/auth").getAuth(ensureAdminApp()));
const appCheck = createLazyAdminService(() => require("firebase-admin/app-check").getAppCheck(ensureAdminApp()));
const serverTimestamp = () => getAdminFirestore().FieldValue.serverTimestamp();
const timestampFromDate = (date: Date) => getAdminFirestore().Timestamp.fromDate(date);

const MAX_DAILY_FREE_USERS = Number(process.env.MAX_DAILY_FREE_USERS ?? "100");
const ENFORCE_APPCHECK = process.env.ENFORCE_APPCHECK === "true";
const WEB_ALLOWED_ORIGINS = new Set(
  (process.env.WEB_ALLOWED_ORIGINS ??
    "http://localhost:3000,http://127.0.0.1:3000,https://codeorbit-ai-rebuild.vercel.app,https://leetcode-clone-3ac0a.web.app")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
);

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const GROK_API_KEY = process.env.GROK_API_KEY ?? "";
const GROK_MODEL = process.env.GROK_MODEL ?? "grok-2-latest";
const AI_PROVIDER = process.env.AI_PROVIDER ?? "auto";

const callableOptions = {
  enforceAppCheck: ENFORCE_APPCHECK,
};

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

type PaidPlanId = "premium-monthly" | "premium-lifetime";
type BillingPlanId = "daily-free" | PaidPlanId;
type WorkspaceRole = "user" | "admin" | "recruiter_beta" | "campus_beta";

interface BillingPlanConfig {
  id: PaidPlanId;
  name: string;
  amountInPaise: number;
  validityDays: number;
}

const BILLING_PLANS: Record<PaidPlanId, BillingPlanConfig> = {
  "premium-monthly": {
    id: "premium-monthly",
    name: "Pro",
    amountInPaise: 149900,
    validityDays: 30,
  },
  "premium-lifetime": {
    id: "premium-lifetime",
    name: "Interview Sprint",
    amountInPaise: 499900,
    validityDays: 30,
  },
};

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

const RECRUITER_BETA_CANDIDATES = [
  {
    handle: "aarav-mehta",
    fullName: "Aarav Mehta",
    headline: "Fresher backend engineer focused on product and fintech roles.",
    readinessScore: 82,
    targetRoleSlugs: ["backend-engineer", "fresher-sde"],
    targetCompanySlugs: ["razorpay", "flipkart"],
    interviewMomentum: "rising",
    proofProfileShared: true,
  },
  {
    handle: "priya-verma",
    fullName: "Priya Verma",
    headline: "Frontend engineer with strong React and performance fundamentals.",
    readinessScore: 78,
    targetRoleSlugs: ["frontend-engineer"],
    targetCompanySlugs: ["google", "swiggy", "zoho"],
    interviewMomentum: "steady",
    proofProfileShared: true,
  },
] as const;

const CAMPUS_BETA_COHORTS = [
  {
    id: "iit-delhi-2026",
    cohortLabel: "IIT Delhi · 2026 graduating batch",
    studentsActive: 148,
    studentsReady: 39,
    applicationsTracked: 214,
    interviewsTracked: 67,
    topWeakAreas: ["Behavioral structure", "Dynamic programming", "Resume role fit"],
  },
  {
    id: "vtu-bengaluru-2026",
    cohortLabel: "VTU Bengaluru · placement sprint",
    studentsActive: 204,
    studentsReady: 51,
    applicationsTracked: 286,
    interviewsTracked: 83,
    topWeakAreas: ["OA speed", "Project proof", "Backend system reasoning"],
  },
] as const;

const toUtcDateKey = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const endOfUtcDay = (date: Date) => {
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
  return timestampFromDate(end);
};

const requireAuthUid = (authContext: { uid?: string } | null | undefined): string => {
  const uid = authContext?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  return uid;
};

const ensureRazorpayConfigured = () => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new HttpsError(
      "failed-precondition",
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/functions/.env."
    );
  }
};

const isPaidPlan = (value: string): value is PaidPlanId =>
  value === "premium-monthly" || value === "premium-lifetime";

const toPublicBillingPlanId = (value: string | undefined): "free" | PaidPlanId => {
  if (value === "premium-monthly" || value === "premium-lifetime") {
    return value;
  }
  return "free";
};

const sanitizeDisplayName = (value: string): string =>
  value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

const parseInput = <T>(schema: z.ZodType<T>, input: unknown, message = "Invalid request.") => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpsError("invalid-argument", message);
  }
  return result.data;
};

const normalizeWorkspaceRole = (value: unknown): WorkspaceRole => {
  if (value === "admin" || value === "recruiter_beta" || value === "campus_beta") {
    return value;
  }
  return "user";
};

const buildUserProfile = (input: {
  uid: string;
  email: string;
  displayName: string;
  role?: unknown;
  locale?: unknown;
  isAdmin?: unknown;
  createdAt?: unknown;
}) => ({
  uid: input.uid,
  email: input.email,
  displayName: input.displayName,
  isAdmin: Boolean(input.isAdmin),
  locale: input.locale === "hi" ? "hi" : "en",
  role: normalizeWorkspaceRole(input.role),
  createdAtIso:
    typeof (input.createdAt as { toDate?: () => Date } | undefined)?.toDate === "function"
      ? (input.createdAt as { toDate: () => Date }).toDate().toISOString()
      : typeof input.createdAt === "string"
        ? input.createdAt
        : undefined,
});

const syncUserProfileToFirestore = async (input: {
  uid: string;
  email: string;
  displayName: string;
  adminHint?: boolean;
}) => {
  const userRef = db.collection("users").doc(input.uid);
  const profileRef = db.collection("privateUserProfiles").doc(input.uid);

  await db.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    const existing = userSnapshot.data() ?? {};

    transaction.set(
      userRef,
      {
        email: input.email,
        displayName: input.displayName,
        isAdmin: Boolean(existing.isAdmin || input.adminHint),
        role: existing.role ?? (input.adminHint ? "admin" : "user"),
        locale: existing.locale ?? "en",
        lastSeenAt: serverTimestamp(),
        createdAt: existing.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      profileRef,
      {
        email: input.email,
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  const snapshot = await userRef.get();
  const data = snapshot.data() ?? {};

  return buildUserProfile({
    uid: input.uid,
    email: String(data.email ?? input.email),
    displayName: String(data.displayName ?? input.displayName),
    isAdmin: data.isAdmin,
    locale: data.locale,
    role: data.role,
    createdAt: data.createdAt,
  });
};

const getFirestoreViewerProfile = async (input: {
  uid: string;
  email: string;
  displayName: string;
  adminHint?: boolean;
}) => {
  const snapshot = await db.collection("users").doc(input.uid).get();
  const data = snapshot.data() ?? {};

  return buildUserProfile({
    uid: input.uid,
    email: String(data.email ?? input.email),
    displayName: String(data.displayName ?? input.displayName),
    isAdmin: Boolean(data.isAdmin || input.adminHint),
    locale: data.locale,
    role: data.role,
    createdAt: data.createdAt,
  });
};

const getFirestoreDashboardSummary = async (uid: string) => {
  const [userSnapshot, submissionsSnapshot, subscriptionSnapshot] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("submissions").where("userId", "==", uid).limit(250).get(),
    db.collection("subscriptions").doc(uid).get(),
  ]);

  const userData = userSnapshot.data() ?? {};
  const solvedProblems = new Set<string>();
  submissionsSnapshot.docs.forEach((entry) => {
    const data = entry.data();
    if (data.status === "Accepted" && typeof data.problemId === "string") {
      solvedProblems.add(data.problemId);
    }
  });

  return {
    streak: Number(userData.streak ?? (solvedProblems.size > 0 ? Math.min(solvedProblems.size, 7) : 0)),
    solvedCount: solvedProblems.size,
    weakTopics:
      solvedProblems.size >= 3 ? ["Dynamic Programming", "Graphs"] : ["Arrays", "Binary Search", "Strings"],
    recommendedTrack: solvedProblems.size >= 3 ? "Google Interview Sprint" : "TCS + Infosys Foundations",
    premiumActive: subscriptionSnapshot.exists && subscriptionSnapshot.data()?.status === "active",
  };
};

const getBillingSummaryFromFirestore = async (uid: string) => {
  const snapshot = await db.collection("subscriptions").doc(uid).get();
  if (!snapshot.exists) {
    return {
      planId: "free" as const,
      planName: "Free",
      status: "inactive",
      premiumActive: false,
      validUntilIso: null,
    };
  }

  const data = snapshot.data() ?? {};
  const publicPlanId = toPublicBillingPlanId(String(data.planId ?? ""));
  const validUntilIso =
    typeof data.validUntil?.toDate === "function" ? data.validUntil.toDate().toISOString() : null;

  return {
    planId: publicPlanId,
    planName:
      publicPlanId === "premium-monthly"
        ? "Pro"
        : publicPlanId === "premium-lifetime"
          ? "Interview Sprint"
          : "Free",
    status: String(data.status ?? "inactive"),
    premiumActive: Boolean(publicPlanId !== "free" && data.status === "active"),
    validUntilIso,
  };
};

const getActivitySummaryFromFirestore = async (uid: string) => {
  const submissionsSnapshot = await db
    .collection("submissions")
    .where("userId", "==", uid)
    .orderBy("submitTime", "desc")
    .limit(20)
    .get();

  const recentSubmissions = submissionsSnapshot.docs
    .map((entry) => {
      const data = entry.data();
      const timestamp = data.submitTime ?? data.timestamp;

      if (typeof timestamp?.toDate !== "function") {
        return null;
      }

      const problemId = String(data.problemId ?? "");
      const fallbackProblem = getCatalogProblem(problemId);

      return {
        id: entry.id,
        problemId,
        problemName: String(data.problemName ?? fallbackProblem?.problemName ?? "Untitled Problem"),
        language: String(data.language ?? "typescript"),
        status: String(data.status ?? "Submitted"),
        submittedAtIso: timestamp.toDate().toISOString(),
      };
    })
    .filter(
      (
        entry
      ): entry is {
        id: string;
        problemId: string;
        problemName: string;
        language: string;
        status: string;
        submittedAtIso: string;
      } => entry !== null
    );

  const acceptedCount = recentSubmissions.filter((entry) => entry.status === "Accepted").length;
  const pendingCount = recentSubmissions.filter((entry) => entry.status === "PENDING").length;

  return {
    recentSubmissions,
    acceptedCount,
    pendingCount,
    totalAttempts: recentSubmissions.length,
  };
};

const getLeaderboardSummaryFromFirestore = async (viewerUid: string) => {
  const [usersSnapshot, submissionsSnapshot, subscriptionsSnapshot] = await Promise.all([
    db.collection("users").limit(100).get(),
    db.collection("submissions").limit(2000).get(),
    db.collection("subscriptions").where("status", "==", "active").limit(500).get(),
  ]);

  const solvedByUser = new Map<string, Set<string>>();
  submissionsSnapshot.docs.forEach((entry) => {
    const data = entry.data();
    if (data.status !== "Accepted" || typeof data.userId !== "string" || typeof data.problemId !== "string") {
      return;
    }

    const solved = solvedByUser.get(data.userId) ?? new Set<string>();
    solved.add(data.problemId);
    solvedByUser.set(data.userId, solved);
  });

  const premiumUsers = new Set(
    subscriptionsSnapshot.docs
      .map((entry) => entry.id)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );

  const entries = usersSnapshot.docs
    .map((entry) => {
      const data = entry.data();
      const solvedCount = solvedByUser.get(entry.id)?.size ?? 0;
      return {
        uid: entry.id,
        displayName: String(data.displayName ?? data.email ?? "User"),
        solvedCount,
        streak: Number(data.streak ?? (solvedCount > 0 ? Math.min(solvedCount, 7) : 0)),
        premiumActive: premiumUsers.has(entry.id),
      };
    })
    .sort((left, right) => {
      if (right.solvedCount !== left.solvedCount) {
        return right.solvedCount - left.solvedCount;
      }
      if (right.streak !== left.streak) {
        return right.streak - left.streak;
      }
      return left.displayName.localeCompare(right.displayName);
    })
    .slice(0, 25)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const viewerEntry = entries.find((entry) => entry.uid === viewerUid) ?? null;

  return {
    entries,
    viewerRank: viewerEntry?.rank ?? null,
    viewerSolvedCount: viewerEntry?.solvedCount ?? 0,
  };
};

const getAdminSummaryFromFirestore = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [usersAggregate, subscriptionsAggregate, problemsAggregate, billingSnapshot, aiUsageAggregate] =
    await Promise.all([
    db.collection("users").count().get(),
    db.collection("subscriptions").where("status", "==", "active").count().get(),
    db.collection("problems").count().get(),
    db.collection("billingOrders").where("status", "==", "paid").limit(500).get(),
    db
      .collection("analyticsEvents")
      .where("source", "==", "ai")
      .where("createdAt", ">=", timestampFromDate(startOfToday))
      .count()
      .get(),
  ]);

  const totalRevenuePaise = billingSnapshot.docs.reduce((sum, entry) => {
    const amount = Number(entry.data().amountInPaise ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  return {
    totalUsers: Number(usersAggregate.data().count ?? 0),
    activeSubscriptions: Number(subscriptionsAggregate.data().count ?? 0),
    publishedProblems: Number(problemsAggregate.data().count ?? 0),
    totalRevenuePaise,
    aiUsageToday: Number(aiUsageAggregate.data().count ?? 0),
  };
};

const assertAdminAccess = async (uid: string, tokenAdmin = false) => {
  if (tokenAdmin) {
    return;
  }

  const [firestoreSnapshot, supabaseProfile] = await Promise.all([
    db.collection("users").doc(uid).get(),
    getUserProfileFromSupabase(uid),
  ]);

  if (Boolean(firestoreSnapshot.data()?.isAdmin) || Boolean(supabaseProfile?.isAdmin)) {
    return;
  }

  throw new HttpsError("permission-denied", "Admin access required.");
};

const assertWorkspaceRoleAccess = async (
  uid: string,
  allowedRoles: WorkspaceRole[],
  tokenAdmin = false
) => {
  if (tokenAdmin) {
    return;
  }

  const [firestoreSnapshot, supabaseProfile] = await Promise.all([
    db.collection("users").doc(uid).get(),
    getUserProfileFromSupabase(uid),
  ]);

  const firestoreRole = normalizeWorkspaceRole(firestoreSnapshot.data()?.role);
  const supabaseRole = normalizeWorkspaceRole(supabaseProfile?.role);

  if (allowedRoles.includes(firestoreRole) || allowedRoles.includes(supabaseRole)) {
    return;
  }

  throw new HttpsError("permission-denied", "Workspace access required.");
};

const resolveTargetUser = async (input: { targetUid?: string; targetEmail?: string }) => {
  if (input.targetUid) {
    const [authRecord, firestoreSnapshot] = await Promise.all([
      auth.getUser(input.targetUid).catch(() => null),
      db.collection("users").doc(input.targetUid).get(),
    ]);

    if (authRecord) {
      return {
        uid: authRecord.uid,
        email: authRecord.email ?? String(firestoreSnapshot.data()?.email ?? ""),
        displayName:
          authRecord.displayName ?? String(firestoreSnapshot.data()?.displayName ?? authRecord.email ?? "User"),
      };
    }

    if (firestoreSnapshot.exists) {
      const data = firestoreSnapshot.data() ?? {};
      return {
        uid: firestoreSnapshot.id,
        email: String(data.email ?? ""),
        displayName: String(data.displayName ?? data.email ?? "User"),
      };
    }
  }

  if (input.targetEmail) {
    const authRecord = await auth.getUserByEmail(input.targetEmail).catch(() => null);
    if (authRecord) {
      return {
        uid: authRecord.uid,
        email: authRecord.email ?? input.targetEmail,
        displayName: authRecord.displayName ?? authRecord.email ?? "User",
      };
    }

    const snapshot = await db.collection("users").where("email", "==", input.targetEmail).limit(1).get();
    const doc = snapshot.docs[0];
    if (doc) {
      const data = doc.data() ?? {};
      return {
        uid: doc.id,
        email: String(data.email ?? input.targetEmail),
        displayName: String(data.displayName ?? data.email ?? "User"),
      };
    }

    const supabaseProfile = await getUserProfileByEmailFromSupabase(input.targetEmail);
    if (supabaseProfile) {
      return {
        uid: supabaseProfile.uid,
        email: supabaseProfile.email,
        displayName: supabaseProfile.displayName,
      };
    }
  }

  return null;
};

const sanitizeFreeformText = (value: string, limit: number) =>
  value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, limit);

const isPremiumUser = async (uid: string) => {
  const billingSummary = await getBillingSummaryFromFirestore(uid);
  return billingSummary.premiumActive;
};

const escapePdfText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const buildPdfBuffer = (lines: string[]) => {
  const pageHeight = 842;
  const startY = 790;
  const lineHeight = 16;
  const streamLines = lines.map((line, index) => {
    const y = startY - index * lineHeight;
    return `BT /F1 ${index === 0 ? 18 : 11} Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
  });
  const stream = streamLines.join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};

const getProblemContext = async (problemId: string) => {
  const [supabaseProblem, firestoreProblem] = await Promise.all([
    getPublishedProblemDetailFromSupabase(problemId),
    db.collection("problems").doc(problemId).get(),
  ]);

  if (supabaseProblem) {
    return {
      problemName: supabaseProblem.problemName,
      difficulty: supabaseProblem.difficulty,
      description: supabaseProblem.description,
      tags: supabaseProblem.tags,
      constraints: supabaseProblem.constraints,
    };
  }

  const catalogProblem = getCatalogProblem(problemId);
  if (catalogProblem) {
    return {
      problemName: catalogProblem.problemName,
      difficulty: catalogProblem.difficulty,
      description: catalogProblem.description,
      tags: catalogProblem.tags,
      constraints: catalogProblem.constraints,
    };
  }

  if (firestoreProblem.exists) {
    const data = firestoreProblem.data() ?? {};
    const rawDifficulty = String(data.difficulty ?? "Easy");
    return {
      problemName: String(data.problemName ?? data.title ?? "Untitled Problem"),
      difficulty: rawDifficulty === "Medium" || rawDifficulty === "Hard" ? rawDifficulty : "Easy",
      description: String(data.description ?? "No description available."),
      tags: Array.isArray(data.tags) ? data.tags.map((entry) => String(entry)) : [],
      constraints: Array.isArray(data.constraintsList)
        ? data.constraintsList.map((entry) => String(entry))
        : typeof data.constraints === "string"
          ? data.constraints.split(/\r?\n/).map((entry: string) => entry.trim()).filter(Boolean)
          : [],
    };
  }

  throw new HttpsError("not-found", "Problem not found for AI context.");
};

const getProblemExecutionDefaults = async (problemId: string) => {
  const [supabaseProblem, firestoreProblem] = await Promise.all([
    getPublishedProblemDetailFromSupabase(problemId),
    db.collection("problems").doc(problemId).get(),
  ]);

  const catalogProblem = getCatalogProblem(problemId);
  const resolvedProblem =
    supabaseProblem ??
    (firestoreProblem.exists
      ? {
          problemName: String(firestoreProblem.data()?.problemName ?? firestoreProblem.data()?.title ?? "Untitled Problem"),
          difficulty:
            firestoreProblem.data()?.difficulty === "Medium" || firestoreProblem.data()?.difficulty === "Hard"
              ? firestoreProblem.data()?.difficulty
              : "Easy",
          examples: Array.isArray(firestoreProblem.data()?.examples) ? firestoreProblem.data()?.examples : [],
        }
      : catalogProblem
        ? {
            problemName: catalogProblem.problemName,
            difficulty: catalogProblem.difficulty,
            examples: catalogProblem.examples,
          }
        : null);

  if (!resolvedProblem) {
    throw new HttpsError("not-found", "Problem does not exist.");
  }

  const firstExample = Array.isArray(resolvedProblem.examples) ? resolvedProblem.examples[0] : null;

  return {
    problemName: resolvedProblem.problemName,
    difficulty: resolvedProblem.difficulty,
    defaultStdin: typeof firstExample?.input === "string" ? firstExample.input : "",
    defaultExpectedOutput: typeof firstExample?.output === "string" ? firstExample.output : "",
  };
};

const callAiProvider = async (systemPrompt: string, userPrompt: string) => {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const callOpenAiStyleProvider = async (options: {
    provider: "openai" | "grok";
    endpoint: string;
    apiKey: string;
    model: string;
  }) => {
    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`${options.provider} AI request failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error(`${options.provider} AI returned an empty response`);
    }

    return {
      provider: options.provider,
      content,
    };
  };

  const callGeminiProvider = async (options: {
    provider: "gemini";
    apiKey: string;
    model: string;
  }) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      options.model
    )}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`gemini AI request failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const content = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!content) {
      throw new Error("gemini AI returned an empty response");
    }

    return {
      provider: options.provider,
      content,
    };
  };

  const providerOrder =
    AI_PROVIDER === "gemini"
      ? (["gemini", "openai", "grok"] as const)
      : AI_PROVIDER === "openai"
        ? (["openai", "gemini", "grok"] as const)
        : AI_PROVIDER === "grok"
          ? (["grok", "gemini", "openai"] as const)
          : (["gemini", "openai", "grok"] as const);

  for (const provider of providerOrder) {
    try {
      if (provider === "gemini" && GEMINI_API_KEY) {
        return await callGeminiProvider({
          provider: "gemini",
          apiKey: GEMINI_API_KEY,
          model: GEMINI_MODEL,
        });
      }

      if (provider === "openai" && OPENAI_API_KEY) {
        return await callOpenAiStyleProvider({
          provider: "openai",
          endpoint: "https://api.openai.com/v1/chat/completions",
          apiKey: OPENAI_API_KEY,
          model: OPENAI_MODEL,
        });
      }

      if (provider === "grok" && GROK_API_KEY) {
        return await callOpenAiStyleProvider({
          provider: "grok",
          endpoint: "https://api.x.ai/v1/chat/completions",
          apiKey: GROK_API_KEY,
          model: GROK_MODEL,
        });
      }
    } catch (error) {
      logger.error(`AI provider ${provider} failed`, error as Error);
    }
  }

  return null;
};

const logAnalyticsEvent = async (input: {
  uid: string;
  name: string;
  source: string;
  payload?: Record<string, unknown>;
}) => {
  await db.collection("analyticsEvents").add({
    userId: input.uid,
    eventName: input.name,
    source: input.source,
    payload: input.payload ?? {},
    createdAt: serverTimestamp(),
  });
};

const buildResumeDraftForUser = async (
  uid: string,
  input: {
    targetRole: string;
    targetCompany?: string;
    location?: string;
    profileSummary?: string;
  }
) => {
  const [profile, dashboardSummary, acceptedSnapshot] = await Promise.all([
    getFirestoreViewerProfile({
      uid,
      email: "",
      displayName: "User",
    }),
    getFirestoreDashboardSummary(uid),
    db.collection("submissions").where("userId", "==", uid).where("status", "==", "Accepted").limit(6).get(),
  ]);

  const solvedProblems = Array.from(
    new Set(
      acceptedSnapshot.docs
        .map((entry) => String(entry.data().problemName ?? ""))
        .filter((value) => value.length > 0)
    )
  );

  const draft = {
    fullName: profile.displayName,
    headline: `${input.targetRole} Candidate | ${input.targetCompany ?? "CodeOrbit Talent Profile"}`,
    summary:
      input.profileSummary ||
      `${profile.displayName} is a coding interview candidate with ${dashboardSummary.solvedCount} solved problems, a ${dashboardSummary.streak}-day streak, and active focus on ${dashboardSummary.weakTopics.join(", ")}.`,
    skills: Array.from(
      new Set([
        "Data Structures",
        "Algorithms",
        "TypeScript",
        "Problem Solving",
        ...dashboardSummary.weakTopics,
      ])
    ).slice(0, 8),
    achievements: [
      `${dashboardSummary.solvedCount} coding problems solved in guided practice tracks`,
      `${dashboardSummary.streak}-day active consistency streak`,
      `Focused preparation path: ${dashboardSummary.recommendedTrack}`,
    ],
    projects: [
      {
        title: "CodeOrbit Interview Prep Profile",
        bullets: [
          `Practiced and submitted solutions across ${Math.max(3, solvedProblems.length)} interview-style coding challenges.`,
          solvedProblems.length > 0
            ? `Highlighted solved problem areas include ${solvedProblems.slice(0, 3).join(", ")}.`
            : "Maintained a secure tracked submission history and growth dashboard.",
          input.location ? `Targeting roles in ${input.location}.` : "Prepared for India-focused and global engineering roles.",
        ],
      },
    ],
  };

  return draft;
};

const assertRateLimit = (bucket: string, key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const bucketKey = `${bucket}:${key}`;
  const current = requestBuckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    requestBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new HttpsError("resource-exhausted", "Rate limit exceeded. Please retry shortly.");
  }

  current.count += 1;
  requestBuckets.set(bucketKey, current);
};

const setJsonSecurityHeaders = (response: { set: (key: string, value: string) => void }) => {
  response.set("X-Content-Type-Options", "nosniff");
  response.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.set("X-Frame-Options", "DENY");
  response.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
};

const applyCors = (
  request: { method: string; headers: Record<string, unknown> },
  response: {
    set: (key: string, value: string) => void;
    status: (statusCode: number) => { send: (body: unknown) => void; end?: () => void };
  }
): boolean => {
  const origin = String(request.headers.origin ?? "");
  if (!origin) {
    return false;
  }

  if (!WEB_ALLOWED_ORIGINS.has(origin)) {
    response.status(403).send({ message: "Origin not allowed." });
    return true;
  }

  response.set("Access-Control-Allow-Origin", origin);
  response.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Firebase-AppCheck");
  response.set("Vary", "Origin");

  if (request.method === "OPTIONS") {
    const optionsResponse = response.status(204);
    if (typeof optionsResponse.end === "function") {
      optionsResponse.end();
    } else {
      optionsResponse.send("");
    }
    return true;
  }

  return false;
};

const verifyHttpCaller = async (request: {
  headers: Record<string, unknown>;
}): Promise<string> => {
  const authHeader = String(request.headers.authorization ?? "");
  if (!authHeader.startsWith("Bearer ")) {
    throw new HttpsError("unauthenticated", "Missing bearer token.");
  }

  const idToken = authHeader.slice("Bearer ".length).trim();
  const decoded = await auth.verifyIdToken(idToken);

  if (ENFORCE_APPCHECK) {
    const appCheckToken = String(request.headers["x-firebase-appcheck"] ?? "");
    if (!appCheckToken) {
      throw new HttpsError("failed-precondition", "Missing App Check token.");
    }
    await appCheck.verifyToken(appCheckToken);
  }

  return decoded.uid;
};

export const helloWorldHandler = ((_request: any, response: any) => {
  setJsonSecurityHeaders(response);
  logger.info("helloWorld ping");
  response.send("Hello from Firebase!");
});

export const getSubmissionsHandler = (async (request: any, response: any) => {
  setJsonSecurityHeaders(response);

  if (applyCors(request, response)) {
    return;
  }

  try {
    const uid = await verifyHttpCaller(request);
    assertRateLimit("getSubmissions", uid, 30, 60_000);

    const rawLimit = request.method === "GET" ? request.query.limit : request.body?.limit;
    const parsedLimit = Number(rawLimit ?? 10);
    const pageSize = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 10;

    const snapshot = await db
      .collection("submissions")
      .where("userId", "==", uid)
      .orderBy("submitTime", "desc")
      .limit(pageSize)
      .get();

    const records = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    response.status(200).send({ submissions: records });
  } catch (error) {
    if (error instanceof HttpsError) {
      response.status(error.httpErrorCode.status).send({ message: error.message });
      return;
    }
    logger.error("getSubmissions failed", error as Error);
    response.status(500).send({ message: "Failed to fetch submissions." });
  }
});

export const listProblemsHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("listProblems", uid, 60, 60_000);

  const supabaseProblems = await listPublishedProblemsFromSupabase();
  if (supabaseProblems && supabaseProblems.length > 0) {
    return { problems: supabaseProblems };
  }

  return {
    problems: problemCatalog.map((problem) => ({
      id: problem.id,
      problemName: problem.problemName,
      difficulty: problem.difficulty,
      tags: problem.tags,
    })),
  };
});

export const getProblemDetailHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getProblemDetail", uid, 90, 60_000);

  const input = parseInput(getProblemInputSchema, request.data);
  const supabaseProblem = await getPublishedProblemDetailFromSupabase(input.problemId);
  if (supabaseProblem) {
    return { problem: supabaseProblem };
  }

  const problem = getCatalogProblem(input.problemId);

  if (!problem) {
    throw new HttpsError("not-found", "Problem not found.");
  }

  return { problem };
});

export const bootstrapUserProfileHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("bootstrapUserProfile", uid, 20, 60_000);

  const input = parseInput(bootstrapProfileInputSchema, request.data);
  const displayName = sanitizeDisplayName(input.displayName);
  const adminHint = request.auth?.token.admin === true;

  if (!displayName) {
    throw new HttpsError("invalid-argument", "Display name is required.");
  }

  const [firestoreProfile, supabaseProfile] = await Promise.all([
    syncUserProfileToFirestore({
      uid,
      email: input.email,
      displayName,
      adminHint,
    }),
    upsertUserProfileInSupabase({
      firebaseUid: uid,
      email: input.email,
      displayName,
      adminHint,
    }),
  ]);

  return {
    profile: supabaseProfile ?? firestoreProfile,
  };
});

export const getViewerProfileHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getViewerProfile", uid, 40, 60_000);

  const supabaseProfile = await getUserProfileFromSupabase(uid);
  if (supabaseProfile) {
    return { profile: supabaseProfile };
  }

  return {
    profile: await getFirestoreViewerProfile({
      uid,
      email: String(request.auth?.token.email ?? ""),
      displayName: String(request.auth?.token.name ?? "User"),
      adminHint: request.auth?.token.admin === true,
    }),
  };
});

export const getDashboardSummaryHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getDashboardSummary", uid, 30, 60_000);

  const [firestoreSummary, supabaseSummary] = await Promise.all([
    getFirestoreDashboardSummary(uid),
    getDashboardSummaryFromSupabase(uid),
  ]);

  return {
    summary: {
      streak: Math.max(supabaseSummary?.streak ?? 0, firestoreSummary.streak),
      solvedCount: Math.max(supabaseSummary?.solvedCount ?? 0, firestoreSummary.solvedCount),
      weakTopics: supabaseSummary?.weakTopics?.length ? supabaseSummary.weakTopics : firestoreSummary.weakTopics,
      recommendedTrack: supabaseSummary?.recommendedTrack || firestoreSummary.recommendedTrack,
      premiumActive: Boolean(supabaseSummary?.premiumActive || firestoreSummary.premiumActive),
    },
  };
});

export const getBillingSummaryHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getBillingSummary", uid, 20, 60_000);

  return {
    summary: await getBillingSummaryFromFirestore(uid),
  };
});

export const getActivitySummaryHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getActivitySummary", uid, 30, 60_000);

  return {
    summary: await getActivitySummaryFromFirestore(uid),
  };
});

export const getLeaderboardSummaryHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getLeaderboardSummary", uid, 20, 60_000);

  return {
    summary: await getLeaderboardSummaryFromFirestore(uid),
  };
});

export const getAdminSummaryHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getAdminSummary", uid, 20, 60_000);
  await assertAdminAccess(uid, request.auth?.token.admin === true);

  const [firestoreSummary, supabaseSummary] = await Promise.all([
    getAdminSummaryFromFirestore(),
    getAdminSummaryFromSupabase(),
  ]);

  return {
    summary: {
      totalUsers: Math.max(supabaseSummary?.totalUsers ?? 0, firestoreSummary.totalUsers),
      activeSubscriptions: Math.max(
        supabaseSummary?.activeSubscriptions ?? 0,
        firestoreSummary.activeSubscriptions
      ),
      publishedProblems: Math.max(supabaseSummary?.publishedProblems ?? 0, firestoreSummary.publishedProblems),
      totalRevenuePaise: Math.max(supabaseSummary?.totalRevenuePaise ?? 0, firestoreSummary.totalRevenuePaise),
      aiUsageToday: Math.max(supabaseSummary?.aiUsageToday ?? 0, firestoreSummary.aiUsageToday),
    },
  };
});

export const getRecruiterBetaWorkspaceHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getRecruiterBetaWorkspace", uid, 30, 60_000);
  await assertWorkspaceRoleAccess(uid, ["recruiter_beta"], request.auth?.token.admin === true);

  const snapshot = await db
    .collection("recruiterBetaReviews")
    .where("recruiterUid", "==", uid)
    .orderBy("updatedAt", "desc")
    .limit(100)
    .get()
    .catch(() => null);

  const reviews = (snapshot?.docs ?? []).map((entry) => {
    const data = entry.data() ?? {};
    return {
      candidateHandle: String(data.candidateHandle ?? ""),
      status: String(data.status ?? "new"),
      note: String(data.note ?? ""),
      updatedAtIso:
        typeof data.updatedAt?.toDate === "function" ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
    };
  });

  return {
    candidates: RECRUITER_BETA_CANDIDATES,
    reviews,
  };
});

export const saveRecruiterCandidateReviewHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("saveRecruiterCandidateReview", uid, 40, 60_000);
  await assertWorkspaceRoleAccess(uid, ["recruiter_beta"], request.auth?.token.admin === true);

  const input = parseInput(recruiterCandidateReviewInputSchema, request.data);
  const candidate = RECRUITER_BETA_CANDIDATES.find((entry) => entry.handle === input.candidateHandle);
  if (!candidate) {
    throw new HttpsError("not-found", "Candidate not found.");
  }

  const docId = `${uid}_${input.candidateHandle}`;
  const note = sanitizeFreeformText(input.note ?? "", 1000);
  await db.collection("recruiterBetaReviews").doc(docId).set(
    {
      recruiterUid: uid,
      candidateHandle: input.candidateHandle,
      status: input.status,
      note,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    candidateHandle: input.candidateHandle,
    status: input.status,
    note,
    updatedAtIso: new Date().toISOString(),
  };
});

export const getCampusBetaWorkspaceHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getCampusBetaWorkspace", uid, 30, 60_000);
  await assertWorkspaceRoleAccess(uid, ["campus_beta"], request.auth?.token.admin === true);

  const snapshot = await db
    .collection("campusBetaInterventions")
    .where("campusUid", "==", uid)
    .orderBy("updatedAt", "desc")
    .limit(100)
    .get()
    .catch(() => null);

  const interventions = (snapshot?.docs ?? []).map((entry) => {
    const data = entry.data() ?? {};
    return {
      cohortId: String(data.cohortId ?? ""),
      priorityFocus: String(data.priorityFocus ?? ""),
      note: String(data.note ?? ""),
      updatedAtIso:
        typeof data.updatedAt?.toDate === "function" ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
    };
  });

  return {
    cohorts: CAMPUS_BETA_COHORTS,
    interventions,
  };
});

export const saveCampusCohortInterventionHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("saveCampusCohortIntervention", uid, 40, 60_000);
  await assertWorkspaceRoleAccess(uid, ["campus_beta"], request.auth?.token.admin === true);

  const input = parseInput(campusCohortInterventionInputSchema, request.data);
  const cohort = CAMPUS_BETA_COHORTS.find((entry) => entry.id === input.cohortId);
  if (!cohort) {
    throw new HttpsError("not-found", "Cohort not found.");
  }

  const note = sanitizeFreeformText(input.note ?? "", 1000);
  const priorityFocus = sanitizeFreeformText(input.priorityFocus, 160);
  const docId = `${uid}_${input.cohortId}`;

  await db.collection("campusBetaInterventions").doc(docId).set(
    {
      campusUid: uid,
      cohortId: input.cohortId,
      priorityFocus,
      note,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    cohortId: input.cohortId,
    priorityFocus,
    note,
    updatedAtIso: new Date().toISOString(),
  };
});

export const setWorkspaceRoleHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("setWorkspaceRole", uid, 20, 60_000);
  await assertAdminAccess(uid, request.auth?.token.admin === true);

  const input = parseInput(workspaceRoleUpdateInputSchema, request.data);
  const target = await resolveTargetUser({
    targetUid: input.targetUid,
    targetEmail: input.targetEmail,
  });

  if (!target) {
    throw new HttpsError("not-found", "Target user not found.");
  }

  const role = input.role;
  const isAdmin = role === "admin";

  await Promise.all([
    db.collection("users").doc(target.uid).set(
      {
        email: target.email,
        displayName: target.displayName,
        role,
        isAdmin,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ),
    db.collection("privateUserProfiles").doc(target.uid).set(
      {
        role,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ),
    updateUserRoleInSupabase({
      firebaseUid: target.uid,
      email: target.email,
      role,
      isAdmin,
    }),
    auth
      .setCustomUserClaims(target.uid, {
        admin: isAdmin,
        workspaceRole: role,
      })
      .catch(() => undefined),
  ]);

  const snapshot = await db.collection("users").doc(target.uid).get();
  const data = snapshot.data() ?? {};

  return {
    profile: buildUserProfile({
      uid: target.uid,
      email: target.email,
      displayName: String(data.displayName ?? target.displayName),
      isAdmin: data.isAdmin,
      locale: data.locale,
      role: data.role,
      createdAt: data.createdAt,
    }),
  };
});

export const getAiProblemAssistHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("getAiProblemAssist", uid, 15, 60_000);

  const input = parseInput(aiAssistInputSchema, request.data);
  const problem = await getProblemContext(input.problemId);
  const premiumActive = await isPremiumUser(uid);

  if (!premiumActive && (problem.difficulty !== "Easy" || input.mode === "solver")) {
    throw new HttpsError("permission-denied", "Premium unlock is required for this AI request.");
  }

  const modeTitle =
    input.mode === "hint" ? "Smart Hint" : input.mode === "eli5" ? "Explain Like I'm 5" : "AI Auto Solver";
  const prompt = [
    `Problem: ${problem.problemName}`,
    `Difficulty: ${problem.difficulty}`,
    `Tags: ${problem.tags.join(", ")}`,
    `Description: ${problem.description}`,
    problem.constraints.length > 0 ? `Constraints: ${problem.constraints.join("; ")}` : "",
    input.language ? `Language: ${input.language}` : "",
    input.code ? `Current code:\n${sanitizeFreeformText(input.code, 6000)}` : "",
    `Mode: ${input.mode}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const aiResponse = await callAiProvider(
    "You are a supportive coding interview coach. Reply in concise plain text with practical guidance only.",
    prompt
  );

  const fallbackContent =
    input.mode === "hint"
      ? `Focus on the ${problem.tags[0] ?? "core"} approach first. Break the problem into one reusable state transition, then test it against the first example before coding the full solution.`
      : input.mode === "eli5"
        ? `Imagine you are explaining ${problem.problemName} to a beginner: first describe the goal in one sentence, then identify the simplest repeated step, and finally show how you know you are done.`
        : `1. Start with the most direct ${problem.tags[0] ?? "algorithmic"} strategy.\n2. Write the base structure before optimising.\n3. Validate against the sample input and then tighten complexity.`;

  await logAnalyticsEvent({
    uid,
    name: "ai_assist",
    source: "ai",
    payload: {
      mode: input.mode,
      problemId: input.problemId,
    },
  });

  return {
    title: modeTitle,
    content: aiResponse?.content ?? fallbackContent,
    provider: aiResponse?.provider ?? "fallback",
  };
});

export const generateMockInterviewFeedbackHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("generateMockInterviewFeedback", uid, 10, 60_000);

  const premiumActive = await isPremiumUser(uid);
  if (!premiumActive) {
    throw new HttpsError("permission-denied", "Premium access is required for AI mock interviews.");
  }

  const input = parseInput(mockInterviewInputSchema, request.data);
  const transcript = sanitizeFreeformText(input.transcript, 20_000);
  const words = transcript.split(/\s+/).filter(Boolean).length;
  const heuristicScore = Math.max(48, Math.min(94, 45 + Math.round(words / 8)));

  const aiResponse = await callAiProvider(
    "You are an interview coach. Review the candidate transcript and return concise coaching feedback in plain text.",
    `Company: ${input.company}\nRole: ${input.role}\nTranscript:\n${transcript}\nNotes:\n${sanitizeFreeformText(
      input.notes ?? "",
      4000
    )}`
  );

  await logAnalyticsEvent({
    uid,
    name: "mock_interview_feedback",
    source: "ai",
    payload: {
      company: input.company,
      role: input.role,
    },
  });

  return {
    overallScore: heuristicScore,
    communicationScore: Math.max(40, Math.min(95, heuristicScore + 2)),
    problemSolvingScore: Math.max(38, Math.min(95, heuristicScore - 1)),
    confidenceScore: Math.max(42, Math.min(95, heuristicScore)),
    summary:
      aiResponse?.content ??
      `Strong baseline for ${input.role}. Keep answers tighter, add clearer tradeoff reasoning, and end each response with a crisp conclusion.`,
    strengths: [
      "Stayed on topic for the selected role and company context",
      "Showed practical problem-solving intent instead of memorised buzzwords",
      "Built enough signal for targeted follow-up practice",
    ],
    improvements: [
      "Use shorter structured answers: context, approach, tradeoff, outcome",
      "Quantify impact more often when describing projects or decisions",
      "Narrate edge cases and complexity more explicitly",
    ],
    nextSteps: [
      `Repeat a focused ${input.company} mock with a shorter answer format`,
      "Practice one medium coding prompt aloud before the next session",
      "Review your top weak topics and turn them into story-based answers",
    ],
    provider: aiResponse?.provider ?? "fallback",
  };
});

export const generateResumeDraftHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("generateResumeDraft", uid, 8, 60_000);

  const premiumActive = await isPremiumUser(uid);
  if (!premiumActive) {
    throw new HttpsError("permission-denied", "Premium access is required for the resume builder.");
  }

  const input = parseInput(resumeInputSchema, request.data);
  const draft = await buildResumeDraftForUser(uid, input);
  const aiResponse = await callAiProvider(
    "You are an ATS resume writer. Refine the summary and achievement phrasing in concise, recruiter-friendly English.",
    JSON.stringify(draft)
  );

  await logAnalyticsEvent({
    uid,
    name: "resume_draft",
    source: "ai",
    payload: {
      targetRole: input.targetRole,
      targetCompany: input.targetCompany ?? "",
    },
  });

  return {
    ...draft,
    summary: aiResponse?.content ?? draft.summary,
    provider: aiResponse?.provider ?? "fallback",
  };
});

export const exportResumePdfHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("exportResumePdf", uid, 6, 60_000);

  const premiumActive = await isPremiumUser(uid);
  if (!premiumActive) {
    throw new HttpsError("permission-denied", "Premium access is required for PDF export.");
  }

  const input = parseInput(resumeInputSchema, request.data);
  const draft = await buildResumeDraftForUser(uid, input);

  const lines = [
    draft.fullName,
    draft.headline,
    "",
    "Summary",
    draft.summary,
    "",
    "Skills",
    draft.skills.join(", "),
    "",
    "Achievements",
    ...draft.achievements.map((entry) => `- ${entry}`),
    "",
    "Projects",
    ...draft.projects.flatMap((project) => [project.title, ...project.bullets.map((entry) => `- ${entry}`)]),
  ];

  const buffer = buildPdfBuffer(lines);

  await logAnalyticsEvent({
    uid,
    name: "resume_pdf_export",
    source: "resume",
    payload: {
      targetRole: input.targetRole,
    },
  });

  return {
    fileName: `${draft.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resume"}-resume.pdf`,
    base64Pdf: buffer.toString("base64"),
  };
});

export const updateViewerPreferencesHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("updateViewerPreferences", uid, 20, 60_000);

  const input = parseInput(viewerPreferencesInputSchema, request.data);
  const updatePayload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.locale) {
    updatePayload.locale = input.locale;
    await db.collection("users").doc(uid).set(
      {
        locale: input.locale,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  if (input.privacyConsentAccepted) {
    updatePayload.privacyConsentAccepted = true;
    updatePayload.privacyConsentAcceptedAt = serverTimestamp();
  }

  await db.collection("privateUserProfiles").doc(uid).set(updatePayload, { merge: true });

  const profileSnapshot = await db.collection("privateUserProfiles").doc(uid).get();
  const profileData = profileSnapshot.data() ?? {};

  return {
    locale: input.locale ?? "en",
    privacyConsentAccepted: Boolean(profileData.privacyConsentAccepted),
    privacyConsentAcceptedAtIso:
      typeof profileData.privacyConsentAcceptedAt?.toDate === "function"
        ? profileData.privacyConsentAcceptedAt.toDate().toISOString()
        : null,
  };
});

export const runCodeHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("runCode", uid, 45, 60_000);

  const input = parseInput(runCodeInputSchema, request.data);

  if (!supportsJudge0Language(input.language)) {
    throw new HttpsError("invalid-argument", "Language not supported by the isolated Judge0 runner yet.");
  }

  return executeWithJudge0({
    language: input.language,
    sourceCode: input.submission,
    stdin: input.stdin,
    expectedOutput: input.expectedOutput,
  });
});

export const submitHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("submit", uid, 30, 60_000);

  const input = parseInput(submitInputSchema, request.data);

  if (!supportsJudge0Language(input.language)) {
    throw new HttpsError("invalid-argument", "Language not supported by the isolated Judge0 runner yet.");
  }

  const resolvedProblem = await getProblemExecutionDefaults(input.problemId);
  const stdin = input.stdin ?? resolvedProblem.defaultStdin;
  const expectedOutput = input.expectedOutput ?? resolvedProblem.defaultExpectedOutput;
  const executionResult = await executeWithJudge0({
    language: input.language,
    sourceCode: input.submission,
    stdin,
    expectedOutput,
  });

  const doc = await db.collection("submissions").add({
    language: input.language,
    submission: input.submission,
    stdin,
    expectedOutput: executionResult.expectedOutput,
    stdout: executionResult.stdout,
    stderr: executionResult.stderr,
    compileOutput: executionResult.compileOutput,
    judgeStatus: executionResult.judgeStatus,
    judgeToken: executionResult.judgeToken,
    timeSeconds: executionResult.timeSeconds,
    memoryKb: executionResult.memoryKb,
    passed: executionResult.passed,
    problemId: input.problemId,
    problemName: resolvedProblem.problemName,
    problemDifficulty: resolvedProblem.difficulty,
    userId: uid,
    submitTime: serverTimestamp(),
    workerTryCount: 1,
    status: executionResult.status,
  });

  return {
    message: executionResult.message,
    id: doc.id,
    status: executionResult.status,
    judgeStatus: executionResult.judgeStatus,
    stdout: executionResult.stdout,
    stderr: executionResult.stderr,
    compileOutput: executionResult.compileOutput,
    timeSeconds: executionResult.timeSeconds,
    memoryKb: executionResult.memoryKb,
    passed: executionResult.passed,
    expectedOutput: executionResult.expectedOutput,
    language: executionResult.language,
  };
});

export const checkDailyFreeQuotaHandler = (async (request: any) => {
  const caller = request.auth?.uid ?? request.app?.appId ?? request.rawRequest.ip ?? "anonymous";
  assertRateLimit("checkDailyFreeQuota", String(caller), 20, 60_000);

  const dateKey = toUtcDateKey(new Date());
  const quotaRef = db.collection("dailyAccessQuota").doc(dateKey);
  const quotaSnapshot = await quotaRef.get();

  const claimedCount = Number(quotaSnapshot.data()?.claimedCount ?? 0);
  const slotsRemaining = Math.max(MAX_DAILY_FREE_USERS - claimedCount, 0);

  return {
    dateKey,
    maxDailySlots: MAX_DAILY_FREE_USERS,
    claimedCount,
    slotsRemaining,
  };
});

export const claimDailyFreePassHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("claimDailyFreePass", uid, 10, 60_000);

  const now = new Date();
  const dateKey = toUtcDateKey(now);
  const quotaRef = db.collection("dailyAccessQuota").doc(dateKey);
  const subscriptionRef = db.collection("subscriptions").doc(uid);

  const transactionResult = await db.runTransaction(async (transaction) => {
    const quotaSnapshot = await transaction.get(quotaRef);
    const data = quotaSnapshot.exists ? quotaSnapshot.data() ?? {} : {};
    const claimedCount = Number(data.claimedCount ?? 0);
    const claimedUsers = (data.claimedUsers ?? {}) as Record<string, boolean>;
    const alreadyClaimed = Boolean(claimedUsers[uid]);

    if (!alreadyClaimed && claimedCount >= MAX_DAILY_FREE_USERS) {
      return {
        granted: false,
        claimedCount,
      };
    }

    const nextClaimedCount = alreadyClaimed ? claimedCount : claimedCount + 1;
    const nextClaimedUsers = alreadyClaimed ? claimedUsers : { ...claimedUsers, [uid]: true };

    transaction.set(
      quotaRef,
      {
        dateKey,
        maxDailySlots: MAX_DAILY_FREE_USERS,
        claimedCount: nextClaimedCount,
        claimedUsers: nextClaimedUsers,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      subscriptionRef,
      {
        userId: uid,
        planId: "daily-free",
        planName: "Daily Free Pass",
        status: "active",
        source: "daily-quota",
        startsAt: serverTimestamp(),
        validUntil: endOfUtcDay(now),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      granted: true,
      claimedCount: nextClaimedCount,
    };
  });

  const slotsRemaining = Math.max(MAX_DAILY_FREE_USERS - transactionResult.claimedCount, 0);

  return {
    granted: transactionResult.granted,
    dateKey,
    maxDailySlots: MAX_DAILY_FREE_USERS,
    claimedCount: transactionResult.claimedCount,
    slotsRemaining,
  };
});

export const createBillingOrderHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("createBillingOrder", uid, 10, 60_000);
  ensureRazorpayConfigured();

  const input = parseInput(createBillingOrderInputSchema, request.data);
  if (!isPaidPlan(input.planId)) {
    throw new HttpsError("invalid-argument", "Invalid paid plan id.");
  }

  const plan = BILLING_PLANS[input.planId];
  const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`;
  const receipt = `${uid.slice(0, 8)}-${Date.now()}`;

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: plan.amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        uid,
        planId: plan.id,
        planName: plan.name,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("Razorpay order creation failed", { status: response.status, body: errorBody });
    if (response.status === 401) {
      throw new HttpsError(
        "failed-precondition",
        "Razorpay authentication failed. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/functions/.env and ensure test/live mode matches."
      );
    }
    throw new HttpsError("internal", "Failed to create payment order.");
  }

  const order = (await response.json()) as RazorpayOrderResponse;

  await db.collection("billingOrders").doc(order.id).set(
    {
      orderId: order.id,
      userId: uid,
      planId: plan.id,
      planName: plan.name,
      amountInPaise: order.amount,
      currency: order.currency,
      status: "created",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID,
    planId: plan.id as BillingPlanId,
    planName: plan.name,
  };
});

export const verifyBillingPaymentHandler = (async (request: any) => {
  const uid = requireAuthUid(request.auth);
  assertRateLimit("verifyBillingPayment", uid, 10, 60_000);
  ensureRazorpayConfigured();

  const input = parseInput(verifyBillingPaymentInputSchema, request.data);
  const digest = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  const expected = Buffer.from(digest);
  const provided = Buffer.from(input.signature);
  const isValid =
    expected.length === provided.length &&
    timingSafeEqual(expected as unknown as Uint8Array, provided as unknown as Uint8Array);

  if (!isValid) {
    throw new HttpsError("permission-denied", "Invalid payment signature.");
  }

  const orderRef = db.collection("billingOrders").doc(input.orderId);
  const subscriptionRef = db.collection("subscriptions").doc(uid);

  const result = await db.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) {
      throw new HttpsError("not-found", "Order not found.");
    }

    const order = orderSnapshot.data() as { userId?: string; planId?: string };
    if (order.userId !== uid) {
      throw new HttpsError("permission-denied", "Order does not belong to this user.");
    }

    const paidPlanId = String(order.planId ?? "");
    if (!isPaidPlan(paidPlanId)) {
      throw new HttpsError("failed-precondition", "Invalid order plan.");
    }

    const plan = BILLING_PLANS[paidPlanId];
    const now = new Date();
    const validUntil = timestampFromDate(new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000));

    transaction.set(
      orderRef,
      {
        status: "paid",
        paymentId: input.paymentId,
        signature: input.signature,
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      subscriptionRef,
      {
        userId: uid,
        planId: plan.id,
        planName: plan.name,
        status: "active",
        source: "razorpay",
        startsAt: serverTimestamp(),
        validUntil,
        latestOrderId: input.orderId,
        latestPaymentId: input.paymentId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      status: "active",
      planId: plan.id,
      validUntil: validUntil.toDate().toISOString(),
    };
  });

  return result;
});

export const razorpayWebhookHandler = (async (request: any, response: any) => {
  setJsonSecurityHeaders(response);

  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      response.status(200).send({ message: "Webhook secret is not configured. Event ignored." });
      return;
    }

    const signature = String(request.headers["x-razorpay-signature"] ?? "");
    if (!signature) {
      response.status(400).send({ message: "Missing signature." });
      return;
    }

    const rawBody = request.rawBody
      ? new Uint8Array(request.rawBody)
      : new TextEncoder().encode(JSON.stringify(request.body || {}));
    const digest = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const expected = Buffer.from(digest);
    const provided = Buffer.from(signature);

    if (
      !(
        expected.length === provided.length &&
        timingSafeEqual(expected as unknown as Uint8Array, provided as unknown as Uint8Array)
      )
    ) {
      response.status(401).send({ message: "Invalid webhook signature." });
      return;
    }

    const eventPayload = (request.body || {}) as { event?: string };
    logger.info("Razorpay webhook received", {
      event: eventPayload.event ?? "unknown",
    });

    response.status(200).send({ ok: true });
  } catch (error) {
    logger.error("razorpayWebhook failed", error as Error);
    response.status(500).send({ message: "Webhook processing failed." });
  }
});
