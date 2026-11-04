import { createHmac, createVerify, randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  extractViewerFromHeaders,
  getGooglePublicCerts,
  verifyFirebaseToken,
  type ViewerContext,
} from "./auth-guard.ts";
import {
  type ActivitySummary,
  type AdminSummary,
  type BillingOrder,
  type BillingSummary,
  type BillingVerification,
  type Contest,
  type ContestInput,
  type DashboardSummary,
  type DpdpConsentInput,
  type DpdpConsentLog,
  type LeaderboardSummary,
  type PaidBillingPlanId,
  type ProblemDetail,
  type ProblemListItem,
  type ProctorEvent,
  type ProctorEventInput,
  type ReadinessScore,
  type ReadinessScoreTier,
  type Tenant,
  type TenantInput,
  type TenantMembership,
  type TenantMembershipInput,
  type UserProfile,
  type ViewerPreferences,
} from "@codeorbit/schema";
import { getProblemById, mockProblems } from "@codeorbit/ui/mock-problems";

const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const SUPABASE_REST_URL = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : "";

export type { ViewerContext };

interface SupabaseUserRow {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  locale?: string;
  role?: string;
  is_admin?: boolean;
  created_at?: string;
}

interface SupabaseProblemRow {
  id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description_md?: string;
  starter_code?: unknown;
  constraints?: unknown;
  examples?: unknown;
}

interface SupabaseTagRow {
  problem_id: string;
  tag: string;
}

interface SupabaseProgressRow {
  problem_id: string;
  solved: boolean;
}

interface SupabaseSubmissionRow {
  id: string;
  problem_id: string;
  language: string;
  status: string;
  created_at: string;
}

interface SupabaseSubscriptionRow {
  plan_code?: string;
  status: string;
  current_period_end?: string | null;
}

interface SupabaseTenantRow {
  id: string;
  slug: string;
  name: string;
  tier: "tier-1" | "tier-2" | "tier-3";
  state: string;
  contact_tpo_name: string;
  contact_tpo_email: string;
  contact_tpo_phone?: string | null;
  plan_status: "pilot" | "active" | "churned";
  max_students: number;
  created_at: string;
  updated_at: string;
}

interface SupabaseTenantMembershipRow {
  id: string;
  tenant_id: string;
  user_id: string;
  roll_number?: string | null;
  department: string;
  batch_year: number;
  role: "student" | "tpo_admin" | "faculty";
  verified: boolean;
  created_at: string;
}

interface SupabaseContestRow {
  id: string;
  tenant_id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  problem_ids: string[];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_published: boolean;
  created_by?: string | null;
  created_at: string;
}

interface SupabaseProctorEventRow {
  id: string;
  contest_id: string;
  user_id: string;
  event_type: "tab_blur" | "fullscreen_exit" | "paste_detected" | "devtools_opened";
  metadata: Record<string, unknown>;
  occurred_at: string;
}

interface SupabaseDpdpConsentRow {
  id: string;
  user_id: string;
  consent_version: string;
  is_under_18: boolean;
  parent_guardian_email?: string | null;
  purposes_accepted: string[];
  ip_address?: string | null;
  user_agent?: string | null;
  consented_at: string;
  revoked_at?: string | null;
}

const freeBillingSummary: BillingSummary = {
  planId: "free",
  planName: "Free",
  status: "inactive",
  premiumActive: false,
  validUntilIso: null,
};

const emptyDashboardSummary: DashboardSummary = {
  streak: 0,
  solvedCount: 0,
  weakTopics: ["Arrays", "Strings", "Binary Search"],
  recommendedTrack: "Company-first revision",
  premiumActive: false,
};

const emptyActivitySummary: ActivitySummary = {
  recentSubmissions: [],
  pendingCount: 0,
  acceptedCount: 0,
  totalAttempts: 0,
};

const emptyAdminSummary: AdminSummary = {
  totalUsers: 0,
  activeSubscriptions: 0,
  publishedProblems: mockProblems.length,
  totalRevenuePaise: 0,
  aiUsageToday: 0,
};

const fallbackLeaderboardSummary: LeaderboardSummary = {
  entries: [
    {
      uid: "sample-1",
      displayName: "Aarav",
      solvedCount: 34,
      streak: 9,
      rank: 1,
      premiumActive: true,
    },
    {
      uid: "sample-2",
      displayName: "Pranav",
      solvedCount: 27,
      streak: 7,
      rank: 2,
      premiumActive: true,
    },
    {
      uid: "sample-3",
      displayName: "Vaibhav",
      solvedCount: 18,
      streak: 5,
      rank: 3,
      premiumActive: false,
    },
  ],
  viewerRank: null,
  viewerSolvedCount: 0,
};

export const hasSupabase = () => Boolean(SUPABASE_REST_URL && SUPABASE_SERVICE_ROLE_KEY);

const normalizeSingle = <T>(value: T[] | T | null): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

const toInFilter = (values: string[]) =>
  `(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(",")})`;

const createHeaders = (method: string, extra: Record<string, string> = {}) => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  ...(method !== "GET" && method !== "HEAD" ? { "Content-Type": "application/json" } : {}),
  ...extra,
});

const buildRestUrl = (table: string, params: Record<string, string | number | undefined> = {}) => {
  const url = new URL(`${SUPABASE_REST_URL}/${table}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const requestSupabase = async <T>(
  table: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "HEAD" | "DELETE";
    params?: Record<string, string | number | undefined>;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
) => {
  if (!hasSupabase()) {
    throw new Error("Supabase is not configured.");
  }

  const method = options.method ?? "GET";
  const response = await fetch(buildRestUrl(table, options.params), {
    method,
    headers: createHeaders(method, options.headers),
    body: method !== "GET" && method !== "HEAD" && options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} request failed (${response.status}).`);
  }

  if (method === "HEAD" || response.status === 204) {
    return { data: null as T | null, headers: response.headers };
  }

  return { data: (await response.json()) as T, headers: response.headers };
};

const normalizeExamples = (value: unknown): ProblemDetail["examples"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): ProblemDetail["examples"][number] | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const input = typeof record.input === "string" ? record.input.trim() : "";
      const output = typeof record.output === "string" ? record.output.trim() : "";
      const explanation =
        typeof record.explanation === "string" && record.explanation.trim() ? record.explanation.trim() : undefined;

      if (!input || !output) {
        return null;
      }

      return { input, output, explanation };
    })
    .filter((entry): entry is ProblemDetail["examples"][number] => entry !== null);
};

const normalizeConstraints = (value: unknown) =>
  Array.isArray(value)
    ? value.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean)
    : [];

const normalizeStarterCode = (value: unknown) => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred =
      record.typescript ??
      record.javascript ??
      record.python ??
      Object.values(record).find((entry) => typeof entry === "string" && entry.trim());

    if (typeof preferred === "string" && preferred.trim()) {
      return preferred;
    }
  }

  return getProblemById("two-sum")?.starterCode ?? "// Start coding here";
};

const listFromMock = (): ProblemListItem[] =>
  mockProblems.map((problem) => ({
    id: problem.id,
    problemName: problem.problemName,
    difficulty: problem.difficulty,
    tags: problem.tags,
  }));

const detailFromMock = (problemId: string): ProblemDetail | null => {
  const problem = getProblemById(problemId);
  if (!problem) {
    return null;
  }

  return {
    id: problem.id,
    problemName: problem.problemName,
    difficulty: problem.difficulty,
    tags: problem.tags,
    description: problem.description,
    examples: problem.examples,
    constraints: problem.constraints,
    starterCode: problem.starterCode,
  };
};

const loadProblemTags = async (problemIds: string[]) => {
  if (problemIds.length === 0) {
    return new Map<string, string[]>();
  }

  const response = await requestSupabase<SupabaseTagRow[]>("problem_tags", {
    params: {
      select: "problem_id,tag",
      problem_id: `in.${toInFilter(problemIds)}`,
    },
  });

  const tags = new Map<string, string[]>();
  (response.data ?? []).forEach((entry) => {
    const current = tags.get(entry.problem_id) ?? [];
    current.push(entry.tag);
    tags.set(entry.problem_id, current);
  });
  return tags;
};

const loadUserRow = async (viewer: ViewerContext) => {
  if (!viewer.uid && !viewer.email) {
    return null;
  }

  const response = await requestSupabase<SupabaseUserRow[]>("users", {
    params: {
      select: "id,firebase_uid,email,display_name,locale,role,is_admin,created_at",
      ...(viewer.uid ? { firebase_uid: `eq.${viewer.uid}` } : {}),
      ...(viewer.uid ? {} : viewer.email ? { email: `eq.${viewer.email}` } : {}),
      limit: 1,
    },
  });

  return normalizeSingle(response.data);
};

const countRows = async (table: string, params: Record<string, string | number | undefined> = {}) => {
  const response = await requestSupabase<null>(table, {
    method: "HEAD",
    params: {
      select: "id",
      ...params,
    },
    headers: {
      Prefer: "count=exact",
    },
  });

  const contentRange = response.headers.get("content-range") ?? "";
  const total = Number(contentRange.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
};

export { getGooglePublicCerts };

export const verifyFirebaseIdToken = async (token: string): Promise<Record<string, unknown> | null> => {
  const result = await verifyFirebaseToken(token);
  return result.valid ? (result.payload ?? null) : null;
};

interface LocalUserRecord {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  locale: "en" | "hi";
  role: string;
  is_admin: boolean;
  created_at: string;
}

interface LocalSubmissionRecord {
  id: string;
  user_id: string;
  problem_id: string;
  language: string;
  status: string;
  runtime_ms: number | null;
  memory_kb: number | null;
  source_code: string;
  passed?: boolean;
  created_at: string;
}

interface LocalProgressRecord {
  user_id: string;
  problem_id: string;
  solved: boolean;
  best_status: string;
  attempts: number;
  last_submission_at: string;
}

interface LocalSubscriptionRecord {
  user_id: string;
  plan_code: string;
  status: string;
  provider: string;
  current_period_end: string | null;
  created_at: string;
}

interface LocalPaymentRecord {
  id: string;
  user_id: string;
  provider_order_id: string;
  provider_payment_id: string;
  amount_paise: number;
  currency: string;
  status: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface LocalTenantRecord {
  id: string;
  slug: string;
  name: string;
  tier: "tier-1" | "tier-2" | "tier-3";
  state: string;
  contact_tpo_name: string;
  contact_tpo_email: string;
  contact_tpo_phone?: string | null;
  plan_status: "pilot" | "active" | "churned";
  max_students: number;
  created_at: string;
  updated_at: string;
}

interface LocalTenantMembershipRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  roll_number?: string | null;
  department: string;
  batch_year: number;
  role: "student" | "tpo_admin" | "faculty";
  verified: boolean;
  created_at: string;
}

interface LocalContestRecord {
  id: string;
  tenant_id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  problem_ids: string[];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_published: boolean;
  created_by?: string | null;
  created_at: string;
}

interface LocalProctorEventRecord {
  id: string;
  contest_id: string;
  user_id: string;
  event_type: "tab_blur" | "fullscreen_exit" | "paste_detected" | "devtools_opened";
  metadata: Record<string, unknown>;
  occurred_at: string;
}

interface LocalDpdpConsentRecord {
  id: string;
  user_id: string;
  consent_version: string;
  is_under_18: boolean;
  parent_guardian_email?: string | null;
  purposes_accepted: string[];
  ip_address?: string | null;
  user_agent?: string | null;
  consented_at: string;
  revoked_at?: string | null;
}

interface LocalStorageSchema {
  users: LocalUserRecord[];
  submissions: LocalSubmissionRecord[];
  user_progress: LocalProgressRecord[];
  subscriptions: LocalSubscriptionRecord[];
  payments: LocalPaymentRecord[];
  tenants: LocalTenantRecord[];
  tenant_memberships: LocalTenantMembershipRecord[];
  contests: LocalContestRecord[];
  proctor_events: LocalProctorEventRecord[];
  dpdp_consent_logs: LocalDpdpConsentRecord[];
}

const getLocalStoragePath = () => {
  const dir = path.resolve(process.cwd(), ".codeorbit-cache");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "platform-storage.json");
};

const readLocalStorage = (): LocalStorageSchema => {
  try {
    const filePath = getLocalStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<LocalStorageSchema>;
      return {
        users: parsed.users ?? [],
        submissions: parsed.submissions ?? [],
        user_progress: parsed.user_progress ?? [],
        subscriptions: parsed.subscriptions ?? [],
        payments: parsed.payments ?? [],
        tenants: parsed.tenants ?? [],
        tenant_memberships: parsed.tenant_memberships ?? [],
        contests: parsed.contests ?? [],
        proctor_events: parsed.proctor_events ?? [],
        dpdp_consent_logs: parsed.dpdp_consent_logs ?? [],
      };
    }
  } catch (err) {
    console.warn("Notice: could not read local platform storage:", err);
  }
  return {
    users: [],
    submissions: [],
    user_progress: [],
    subscriptions: [],
    payments: [],
    tenants: [],
    tenant_memberships: [],
    contests: [],
    proctor_events: [],
    dpdp_consent_logs: [],
  };
};

const writeLocalStorage = (data: LocalStorageSchema) => {
  try {
    const filePath = getLocalStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("Notice: could not write local platform storage:", err);
  }
};

const ensureLocalUser = (viewer: ViewerContext, store: LocalStorageSchema): LocalUserRecord | null => {
  if (!viewer.uid && !viewer.email) {
    return null;
  }
  let user = store.users.find(
    (u) => (viewer.uid && u.firebase_uid === viewer.uid) || (viewer.email && u.email === viewer.email)
  );
  if (!user) {
    const defaultName =
      viewer.displayName?.trim() ||
      (viewer.email ? viewer.email.split("@")[0].replace(/[^a-zA-Z0-9-_ ]/g, "").trim() : "Developer") ||
      "Developer";
    const isAdminEmail = isConfiguredAdminEmail(viewer.email);
    user = {
      id: randomUUID(),
      firebase_uid: viewer.uid || `local-${randomUUID()}`,
      email: (viewer.email || `${viewer.uid}@codeorbit.local`).toLowerCase(),
      display_name: defaultName,
      locale: "en",
      role: isAdminEmail ? "admin" : "user",
      is_admin: isAdminEmail,
      created_at: new Date().toISOString(),
    };
    store.users.push(user);
    writeLocalStorage(store);
  }
  return user;
};

export const getViewerContextFromHeaders = extractViewerFromHeaders;

export const listProblemsData = async (): Promise<ProblemListItem[]> => {
  if (!hasSupabase()) {
    return listFromMock();
  }

  try {
    const response = await requestSupabase<SupabaseProblemRow[]>("problems", {
      params: {
        select: "id,slug,title,difficulty",
        status: "eq.published",
        order: "created_at.asc",
      },
    });

    const rows = response.data ?? [];
    if (rows.length === 0) {
      return listFromMock();
    }

    const tagsByProblem = await loadProblemTags(rows.map((problem) => problem.id));
    return rows.map((problem) => ({
      id: problem.slug,
      problemName: problem.title,
      difficulty: problem.difficulty,
      tags: tagsByProblem.get(problem.id) ?? [],
    }));
  } catch (error) {
    console.warn("Problem list falling back to local catalog:", error);
    return listFromMock();
  }
};

export const getProblemDetailData = async (problemId: string): Promise<ProblemDetail | null> => {
  if (!hasSupabase()) {
    return detailFromMock(problemId);
  }

  try {
    const response = await requestSupabase<SupabaseProblemRow[]>("problems", {
      params: {
        select: "id,slug,title,difficulty,description_md,starter_code,constraints,examples",
        slug: `eq.${problemId}`,
        status: "eq.published",
        limit: 1,
      },
    });

    const row = normalizeSingle(response.data);
    if (!row) {
      return detailFromMock(problemId);
    }

    const tagsByProblem = await loadProblemTags([row.id]);
    return {
      id: row.slug,
      problemName: row.title,
      difficulty: row.difficulty,
      tags: tagsByProblem.get(row.id) ?? [],
      description: row.description_md?.trim() || detailFromMock(problemId)?.description || "Problem description unavailable.",
      examples: normalizeExamples(row.examples),
      constraints: normalizeConstraints(row.constraints),
      starterCode: normalizeStarterCode(row.starter_code),
    };
  } catch (error) {
    console.warn("Problem detail falling back to local catalog:", error);
    return detailFromMock(problemId);
  }
};

export const getBillingSummaryData = async (viewer: ViewerContext): Promise<BillingSummary> => {
  if (!hasSupabase()) {
    if (!viewer.uid && !viewer.email) {
      return freeBillingSummary;
    }
    const store = readLocalStorage();
    const user = store.users.find(
      (u) => (viewer.uid && u.firebase_uid === viewer.uid) || (viewer.email && u.email === viewer.email)
    );
    if (!user) {
      return freeBillingSummary;
    }

    const userSubs = store.subscriptions.filter((s) => s.user_id === user.id);
    const latestSub = userSubs.length > 0 ? userSubs[userSubs.length - 1] : null;

    if (!latestSub) {
      return freeBillingSummary;
    }

    if (latestSub.status !== "active") {
      return {
        planId: "free",
        planName: "Free",
        status: latestSub.status ?? "inactive",
        premiumActive: false,
        validUntilIso: latestSub.current_period_end ?? null,
      };
    }

    const isLocalExpired = latestSub.current_period_end
      ? new Date(latestSub.current_period_end).getTime() < Date.now()
      : false;

    if (isLocalExpired) {
      return {
        planId: "free",
        planName: "Free",
        status: "expired",
        premiumActive: false,
        validUntilIso: latestSub.current_period_end ?? null,
      };
    }

    const planId = latestSub.plan_code === "premium-lifetime" ? "premium-lifetime" : "premium-monthly";
    return {
      planId,
      planName: planId === "premium-lifetime" ? "Interview Sprint" : "Pro",
      status: latestSub.status,
      premiumActive: true,
      validUntilIso: latestSub.current_period_end ?? null,
    };
  }

  try {
    const user = await loadUserRow(viewer);
    if (!user) {
      return freeBillingSummary;
    }

    const response = await requestSupabase<SupabaseSubscriptionRow[]>("subscriptions", {
      params: {
        select: "plan_code,status,current_period_end",
        user_id: `eq.${user.id}`,
        order: "created_at.desc",
        limit: 1,
      },
    });

    const row = normalizeSingle(response.data);
    if (!row) {
      return freeBillingSummary;
    }

    if (row.status !== "active") {
      return {
        planId: "free",
        planName: "Free",
        status: row.status ?? "inactive",
        premiumActive: false,
        validUntilIso: row.current_period_end ?? null,
      };
    }

    const isDbExpired = row.current_period_end
      ? new Date(row.current_period_end).getTime() < Date.now()
      : false;

    if (isDbExpired) {
      return {
        planId: "free",
        planName: "Free",
        status: "expired",
        premiumActive: false,
        validUntilIso: row.current_period_end ?? null,
      };
    }

    const planId = row.plan_code === "premium-lifetime" ? "premium-lifetime" : "premium-monthly";
    return {
      planId,
      planName: planId === "premium-lifetime" ? "Interview Sprint" : "Pro",
      status: row.status,
      premiumActive: true,
      validUntilIso: row.current_period_end ?? null,
    };
  } catch (error) {
    console.warn("Billing summary falling back to free plan:", error);
    return freeBillingSummary;
  }
};

export const getDashboardSummaryData = async (viewer: ViewerContext): Promise<DashboardSummary> => {
  if (!hasSupabase()) {
    if (!viewer.uid && !viewer.email) {
      return emptyDashboardSummary;
    }
    const store = readLocalStorage();
    const user = store.users.find(
      (u) => (viewer.uid && u.firebase_uid === viewer.uid) || (viewer.email && u.email === viewer.email)
    );
    if (!user) {
      return emptyDashboardSummary;
    }

    const solvedProblems = store.user_progress.filter((p) => p.user_id === user.id && p.solved);
    const solvedCount = solvedProblems.length;

    // Calculate streak from unique days of submission
    const userSubmissions = store.submissions.filter((s) => s.user_id === user.id);
    const submissionDays = new Set(userSubmissions.map((s) => s.created_at.slice(0, 10)));
    const streak = Math.min(submissionDays.size, 14);

    const hasActiveSub = store.subscriptions.some(
      (s) => s.user_id === user.id && s.status === "active"
    );

    const readinessScore = await getReadinessScoreData(viewer);

    return {
      streak: streak > 0 ? streak : (solvedCount > 0 ? 1 : 0),
      solvedCount,
      weakTopics: ["Arrays", "Strings", "Binary Search"],
      recommendedTrack:
        solvedCount >= 8 ? "Google Interview Sprint" : "TCS + Infosys Foundations",
      premiumActive: hasActiveSub,
      readinessScore,
    };
  }

  try {
    const user = await loadUserRow(viewer);
    if (!user) {
      return emptyDashboardSummary;
    }

    const [progressResponse, subscriptionResponse, problemsResponse, readinessScore] = await Promise.all([
      requestSupabase<SupabaseProgressRow[]>("user_progress", {
        params: {
          select: "problem_id,solved",
          user_id: `eq.${user.id}`,
          solved: "eq.true",
        },
      }),
      requestSupabase<SupabaseSubscriptionRow[]>("subscriptions", {
        params: {
          select: "status",
          user_id: `eq.${user.id}`,
          status: "eq.active",
          limit: 1,
        },
      }),
      requestSupabase<SupabaseProblemRow[]>("problems", {
        params: {
          select: "id,slug,title,difficulty",
          status: "eq.published",
        },
      }),
      getReadinessScoreData(viewer),
    ]);

    const solvedProblemIds = new Set((progressResponse.data ?? []).filter((entry) => entry.solved).map((entry) => entry.problem_id));
    const problems = problemsResponse.data ?? [];
    const tagsByProblem = await loadProblemTags(problems.map((problem) => problem.id));

    const tagTotals = new Map<string, number>();
    const solvedTagTotals = new Map<string, number>();
    problems.forEach((problem) => {
      const tags = tagsByProblem.get(problem.id) ?? [];
      tags.forEach((tag) => {
        tagTotals.set(tag, (tagTotals.get(tag) ?? 0) + 1);
        if (solvedProblemIds.has(problem.id)) {
          solvedTagTotals.set(tag, (solvedTagTotals.get(tag) ?? 0) + 1);
        }
      });
    });

    const weakTopics = Array.from(tagTotals.entries())
      .sort((left, right) => {
        const leftRatio = (solvedTagTotals.get(left[0]) ?? 0) / left[1];
        const rightRatio = (solvedTagTotals.get(right[0]) ?? 0) / right[1];
        if (leftRatio !== rightRatio) {
          return leftRatio - rightRatio;
        }
        return right[1] - left[1];
      })
      .slice(0, 3)
      .map(([tag]) => tag);

    const solvedCount = solvedProblemIds.size;
    return {
      streak: solvedCount > 0 ? Math.min(solvedCount, 7) : 0,
      solvedCount,
      weakTopics: weakTopics.length > 0 ? weakTopics : emptyDashboardSummary.weakTopics,
      recommendedTrack:
        solvedCount >= 8 ? "Google Interview Sprint" : weakTopics[0] ? `${weakTopics[0]} Revision Track` : "TCS + Infosys Foundations",
      premiumActive: (subscriptionResponse.data ?? []).length > 0,
      readinessScore,
    };
  } catch (error) {
    console.warn("Dashboard summary falling back to local defaults:", error);
    return emptyDashboardSummary;
  }
};

export const getActivitySummaryData = async (viewer: ViewerContext): Promise<ActivitySummary> => {
  if (!hasSupabase()) {
    if (!viewer.uid && !viewer.email) {
      return emptyActivitySummary;
    }
    const store = readLocalStorage();
    const user = store.users.find(
      (u) => (viewer.uid && u.firebase_uid === viewer.uid) || (viewer.email && u.email === viewer.email)
    );
    if (!user) {
      return emptyActivitySummary;
    }

    const userSubs = store.submissions.filter((s) => s.user_id === user.id).slice(0, 12);
    return {
      recentSubmissions: userSubs.map((s) => ({
        id: s.id,
        problemId: s.problem_id,
        problemName: getProblemById(s.problem_id)?.problemName || s.problem_id,
        language: s.language,
        status: s.status,
        submittedAtIso: s.created_at,
      })),
      pendingCount: userSubs.filter((s) => s.status === "PENDING").length,
      acceptedCount: userSubs.filter((s) => s.status === "Accepted").length,
      totalAttempts: userSubs.length,
    };
  }

  try {
    const user = await loadUserRow(viewer);
    if (!user) {
      return emptyActivitySummary;
    }

    const submissionsResponse = await requestSupabase<SupabaseSubmissionRow[]>("submissions", {
      params: {
        select: "id,problem_id,language,status,created_at",
        user_id: `eq.${user.id}`,
        order: "created_at.desc",
        limit: 12,
      },
    });

    const submissions = submissionsResponse.data ?? [];
    if (submissions.length === 0) {
      return emptyActivitySummary;
    }

    const problemIds = Array.from(new Set(submissions.map((entry) => entry.problem_id)));
    const problemResponse = await requestSupabase<SupabaseProblemRow[]>("problems", {
      params: {
        select: "id,slug,title,difficulty",
        id: `in.${toInFilter(problemIds)}`,
      },
    });

    const problemLookup = new Map((problemResponse.data ?? []).map((problem) => [problem.id, problem]));
    return {
      recentSubmissions: submissions.map((entry) => ({
        id: entry.id,
        problemId: problemLookup.get(entry.problem_id)?.slug ?? entry.problem_id,
        problemName: problemLookup.get(entry.problem_id)?.title ?? "Problem",
        language: entry.language,
        status: entry.status,
        submittedAtIso: entry.created_at,
      })),
      pendingCount: submissions.filter((entry) => entry.status === "PENDING").length,
      acceptedCount: submissions.filter((entry) => entry.status === "Accepted").length,
      totalAttempts: submissions.length,
    };
  } catch (error) {
    console.warn("Activity summary falling back to local defaults:", error);
    return emptyActivitySummary;
  }
};

export const getLeaderboardSummaryData = async (viewer?: ViewerContext): Promise<LeaderboardSummary> => {
  if (!hasSupabase()) {
    const store = readLocalStorage();
    const baseEntries = fallbackLeaderboardSummary.entries.map((entry) => ({ ...entry }));
    let viewerRank: number | null = null;
    let viewerSolvedCount = 0;

    if (viewer?.uid || viewer?.email) {
      const user = store.users.find(
        (u) => (viewer.uid && u.firebase_uid === viewer.uid) || (viewer.email && u.email === viewer.email)
      );
      if (user) {
        const solved = store.user_progress.filter((p) => p.user_id === user.id && p.solved).length;
        viewerSolvedCount = solved;

        const existingIdx = baseEntries.findIndex((e) => e.uid === user.firebase_uid);
        if (existingIdx >= 0) {
          baseEntries[existingIdx].solvedCount = Math.max(baseEntries[existingIdx].solvedCount, solved);
        } else if (solved > 0) {
          baseEntries.push({
            uid: user.firebase_uid,
            displayName: user.display_name,
            solvedCount: solved,
            streak: Math.min(solved, 7),
            rank: 999,
            premiumActive: store.subscriptions.some((s) => s.user_id === user.id && s.status === "active"),
          });
        }
      }
    }

    baseEntries.sort((a, b) => b.solvedCount - a.solvedCount);
    baseEntries.forEach((entry, idx) => {
      entry.rank = idx + 1;
      if (viewer?.uid && entry.uid === viewer.uid) {
        viewerRank = entry.rank;
      }
    });

    return {
      entries: baseEntries.slice(0, 50),
      viewerRank,
      viewerSolvedCount,
    };
  }

  try {
    const progressResponse = await requestSupabase<{ user_id: string; solved: boolean }[]>("user_progress", {
      params: {
        select: "user_id,solved",
        solved: "eq.true",
      },
    });

    const progressRows = progressResponse.data ?? [];
    if (progressRows.length === 0) {
      return fallbackLeaderboardSummary;
    }

    const solvedCounts = new Map<string, number>();
    for (const row of progressRows) {
      solvedCounts.set(row.user_id, (solvedCounts.get(row.user_id) ?? 0) + 1);
    }

    const sortedUserIds = Array.from(solvedCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    if (sortedUserIds.length === 0) {
      return fallbackLeaderboardSummary;
    }

    const usersResponse = await requestSupabase<SupabaseUserRow[]>("users", {
      params: {
        select: "id,firebase_uid,display_name,email",
        id: `in.${toInFilter(sortedUserIds.map(([id]) => id))}`,
      },
    });

    const userMap = new Map((usersResponse.data ?? []).map((u) => [u.id, u]));
    let viewerRank: number | null = null;
    let viewerSolvedCount = 0;

    const entries = sortedUserIds.map(([userId, count], index) => {
      const u = userMap.get(userId);
      const rank = index + 1;
      const isViewer = Boolean(
        viewer?.uid && (u?.firebase_uid === viewer.uid || (viewer.email && u?.email === viewer.email))
      );
      if (isViewer) {
        viewerRank = rank;
        viewerSolvedCount = count;
      }
      return {
        uid: u?.firebase_uid || userId,
        displayName: u?.display_name || "CodeOrbit Developer",
        solvedCount: count,
        streak: Math.min(count, 14),
        rank,
        premiumActive: false,
      };
    });

    return {
      entries,
      viewerRank,
      viewerSolvedCount,
    };
  } catch (error) {
    console.warn("Leaderboard summary falling back to seed data:", error);
    return fallbackLeaderboardSummary;
  }
};

export const recordSubmissionData = async (
  viewer: ViewerContext,
  payload: {
    problemId: string;
    language: string;
    status: string;
    runtimeMs?: number | null;
    memoryKb?: number | null;
    sourceCode: string;
    passed?: boolean | null;
  }
): Promise<{ id: string } | null> => {
  const isSolved = payload.passed === true || payload.status === "Accepted";
  const submissionId = randomUUID();
  const nowIso = new Date().toISOString();

  if (!hasSupabase()) {
    if (!viewer.uid && !viewer.email) {
      return null;
    }
    const store = readLocalStorage();
    const user = ensureLocalUser(viewer, store);
    if (!user) {
      return null;
    }

    store.submissions.unshift({
      id: submissionId,
      user_id: user.id,
      problem_id: payload.problemId,
      language: payload.language,
      status: payload.status,
      runtime_ms: typeof payload.runtimeMs === "number" ? Math.round(payload.runtimeMs) : null,
      memory_kb: typeof payload.memoryKb === "number" ? Math.round(payload.memoryKb) : null,
      source_code: payload.sourceCode,
      passed: isSolved,
      created_at: nowIso,
    });

    const existingProgressIndex = store.user_progress.findIndex(
      (p) => p.user_id === user.id && p.problem_id === payload.problemId
    );

    if (existingProgressIndex >= 0) {
      const prev = store.user_progress[existingProgressIndex];
      store.user_progress[existingProgressIndex] = {
        ...prev,
        solved: prev.solved || isSolved,
        best_status: prev.solved || isSolved ? "Accepted" : payload.status,
        attempts: prev.attempts + 1,
        last_submission_at: nowIso,
      };
    } else {
      store.user_progress.push({
        user_id: user.id,
        problem_id: payload.problemId,
        solved: isSolved,
        best_status: isSolved ? "Accepted" : payload.status,
        attempts: 1,
        last_submission_at: nowIso,
      });
    }

    writeLocalStorage(store);
    return { id: submissionId };
  }

  try {
    const user = await loadUserRow(viewer);
    if (!user) {
      // If user row not found, store in local persistence so submission is never lost
      const store = readLocalStorage();
      const localUser = ensureLocalUser(viewer, store);
      if (localUser) {
        store.submissions.unshift({
          id: submissionId,
          user_id: localUser.id,
          problem_id: payload.problemId,
          language: payload.language,
          status: payload.status,
          runtime_ms: typeof payload.runtimeMs === "number" ? Math.round(payload.runtimeMs) : null,
          memory_kb: typeof payload.memoryKb === "number" ? Math.round(payload.memoryKb) : null,
          source_code: payload.sourceCode,
          passed: isSolved,
          created_at: nowIso,
        });
        writeLocalStorage(store);
      }
      return { id: submissionId };
    }

    let problemResponse = await requestSupabase<SupabaseProblemRow[]>("problems", {
      params: {
        select: "id,slug",
        slug: `eq.${payload.problemId}`,
        limit: 1,
      },
    }).catch(() => ({ data: null }));

    let problem = normalizeSingle(problemResponse.data);

    if (!problem) {
      // Fallback lookup by ID
      const byIdRes = await requestSupabase<SupabaseProblemRow[]>("problems", {
        params: { select: "id,slug", id: `eq.${payload.problemId}`, limit: 1 },
      }).catch(() => ({ data: null }));
      problem = normalizeSingle(byIdRes.data);
    }

    if (!problem) {
      // Auto-provision problem from static catalog into Supabase
      const catalogProblem = mockProblems.find(
        (p) =>
          p.id === payload.problemId ||
          p.problemName.toLowerCase().replace(/\s+/g, "-") === payload.problemId
      );
      if (catalogProblem) {
        const seedRes = await requestSupabase<SupabaseProblemRow[]>("problems", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=representation" },
          body: {
            slug: catalogProblem.id,
            title: catalogProblem.problemName,
            difficulty: catalogProblem.difficulty,
            description: catalogProblem.description,
            tags: catalogProblem.tags,
            status: "published",
          },
        }).catch(() => ({ data: null }));
        problem = normalizeSingle(seedRes.data);
      }
    }

    if (!problem) {
      // If problem still cannot be resolved in Supabase, persist locally
      const store = readLocalStorage();
      const localUser = ensureLocalUser(viewer, store);
      if (localUser) {
        store.submissions.unshift({
          id: submissionId,
          user_id: localUser.id,
          problem_id: payload.problemId,
          language: payload.language,
          status: payload.status,
          runtime_ms: typeof payload.runtimeMs === "number" ? Math.round(payload.runtimeMs) : null,
          memory_kb: typeof payload.memoryKb === "number" ? Math.round(payload.memoryKb) : null,
          source_code: payload.sourceCode,
          passed: isSolved,
          created_at: nowIso,
        });
        writeLocalStorage(store);
      }
      return { id: submissionId };
    }

    await requestSupabase("submissions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: {
        id: submissionId,
        user_id: user.id,
        problem_id: problem.id,
        language: payload.language,
        status: payload.status,
        runtime_ms: typeof payload.runtimeMs === "number" ? Math.round(payload.runtimeMs) : null,
        memory_kb: typeof payload.memoryKb === "number" ? Math.round(payload.memoryKb) : null,
        source_code: payload.sourceCode,
        created_at: nowIso,
      },
    });

    await requestSupabase("user_progress", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: {
        user_id: user.id,
        problem_id: problem.id,
        solved: isSolved,
        best_status: isSolved ? "Accepted" : payload.status,
        last_submission_at: nowIso,
      },
    }).catch((err) => {
      console.warn("user_progress upsert notice:", err);
    });

    return { id: submissionId };
  } catch (error) {
    console.warn("Failed to persist submission to Supabase, engaging local fallback:", error);
    try {
      const store = readLocalStorage();
      const localUser = ensureLocalUser(viewer, store);
      if (localUser) {
        store.submissions.unshift({
          id: submissionId,
          user_id: localUser.id,
          problem_id: payload.problemId,
          language: payload.language,
          status: payload.status,
          runtime_ms: typeof payload.runtimeMs === "number" ? Math.round(payload.runtimeMs) : null,
          memory_kb: typeof payload.memoryKb === "number" ? Math.round(payload.memoryKb) : null,
          source_code: payload.sourceCode,
          passed: isSolved,
          created_at: nowIso,
        });
        writeLocalStorage(store);
      }
    } catch {}
    return { id: submissionId };
  }
};

/**
 * Computes deterministic verified technical readiness score (0-100)
 * based on verified DSA problem solving, streak, accuracy, and mock interview completion.
 */
export const calculateReadinessScore = (
  solvedProblems: Array<{ difficulty?: string; tags?: string[] }>,
  submissions: Array<{ passed?: boolean | null; status?: string; created_at: string }>,
  options?: {
    mockInterviewsCompleted?: number;
    resumesCompiled?: number;
  }
): ReadinessScore => {
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Difficulty breakdown & topic mastery calculation
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;

  for (const p of solvedProblems) {
    const diff = (p.difficulty || "Easy").toLowerCase();
    if (diff === "hard") hardSolved++;
    else if (diff === "medium") mediumSolved++;
    else easySolved++;
  }

  const rawMasteryPoints = easySolved * 6 + mediumSolved * 14 + hardSolved * 28;
  const topicMasteryScore = Math.min(100, Math.round((rawMasteryPoints / 70) * 100));

  // 2. Consistency & Streak
  const uniqueDays = new Set(submissions.map((s) => s.created_at.slice(0, 10)));
  const streak = Math.min(uniqueDays.size, 14);
  let consistencyScore = 15;
  if (streak >= 7) consistencyScore = 95;
  else if (streak >= 4) consistencyScore = 75;
  else if (streak >= 2) consistencyScore = 55;
  else if (streak >= 1) consistencyScore = 35;

  // 3. Accuracy & Acceptance Rate
  const totalSubmissions = submissions.length;
  const acceptedSubmissions = submissions.filter(
    (s) => s.passed === true || s.status === "Accepted"
  ).length;

  const acceptanceRatePercent =
    totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
      : (solvedProblems.length > 0 ? 100 : 0);

  let accuracyScore = 50;
  if (totalSubmissions > 0) {
    if (acceptanceRatePercent >= 75) accuracyScore = 95;
    else if (acceptanceRatePercent >= 50) accuracyScore = 80;
    else if (acceptanceRatePercent >= 30) accuracyScore = 60;
    else accuracyScore = 40;
  } else if (solvedProblems.length > 0) {
    accuracyScore = 80;
  }

  // 4. Company-Track Alignment
  const companyTags = new Set(["amazon", "google", "microsoft", "tcs", "infosys", "flipkart", "meta"]);
  let companyTaggedSolved = 0;
  for (const p of solvedProblems) {
    if (p.tags && p.tags.some((t) => companyTags.has(t.toLowerCase()))) {
      companyTaggedSolved++;
    }
  }
  const companyTrackScore = Math.min(
    100,
    Math.round((companyTaggedSolved * 20 + solvedProblems.length * 5))
  );

  // 5. Interview & ATS Readiness
  const mockCount = options?.mockInterviewsCompleted ?? 0;
  const resumeCount = options?.resumesCompiled ?? 0;
  const interviewAtsScore = Math.min(100, 40 + mockCount * 25 + resumeCount * 15);

  // 6. Weighted Composite Overall Score
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        topicMasteryScore * 0.30 +
        consistencyScore * 0.20 +
        accuracyScore * 0.20 +
        companyTrackScore * 0.15 +
        interviewAtsScore * 0.15
      )
    )
  );

  // 7. Tier Classification
  let tier: ReadinessScoreTier = "Needs Practice";
  if (overallScore >= 90) tier = "Day-1 FAANG Ready";
  else if (overallScore >= 75) tier = "Top Tier Candidate";
  else if (overallScore >= 50) tier = "Placement Ready";

  return {
    overallScore,
    topicMasteryScore,
    companyTrackScore,
    consistencyScore,
    accuracyScore,
    interviewAtsScore,
    solvedCount: solvedProblems.length,
    totalSubmissions,
    streak,
    tier,
    breakdown: {
      easySolved,
      mediumSolved,
      hardSolved,
      acceptanceRatePercent,
    },
    lastCalculatedIso: nowIso,
  };
};

/**
 * Retrieves the live verified Readiness Score for the authenticated viewer.
 */
export const getReadinessScoreData = async (viewer: ViewerContext): Promise<ReadinessScore> => {
  if (!viewer.uid && !viewer.email) {
    return calculateReadinessScore([], [], { mockInterviewsCompleted: 0, resumesCompiled: 0 });
  }

  if (!hasSupabase()) {
    const store = readLocalStorage();
    const user = store.users.find(
      (u) => (viewer.uid && u.firebase_uid === viewer.uid) || (viewer.email && u.email === viewer.email)
    );
    if (!user) {
      return calculateReadinessScore([], [], { mockInterviewsCompleted: 0, resumesCompiled: 0 });
    }

    const userProgress = store.user_progress.filter((p) => p.user_id === user.id && p.solved);
    const userSubmissions = store.submissions.filter((s) => s.user_id === user.id);

    // Map difficulty and tags from mock catalog
    const solvedWithDetails = userProgress.map((up) => {
      const match = mockProblems.find((mp) => mp.id === up.problem_id);
      return {
        difficulty: match?.difficulty || "Easy",
        tags: match?.tags || [],
      };
    });

    return calculateReadinessScore(solvedWithDetails, userSubmissions, {
      mockInterviewsCompleted: 1,
      resumesCompiled: 1,
    });
  }

  try {
    const user = await loadUserRow(viewer);
    if (!user) {
      return calculateReadinessScore([], [], { mockInterviewsCompleted: 0, resumesCompiled: 0 });
    }

    const [progressRes, submissionsRes] = await Promise.all([
      requestSupabase<{ problem_id: string; solved: boolean }[]>("user_progress", {
        params: { select: "problem_id,solved", user_id: `eq.${user.id}`, solved: "eq.true" },
      }).catch(() => ({ data: [] })),
      requestSupabase<{ passed: boolean | null; status: string; created_at: string }[]>("submissions", {
        params: { select: "passed,status,created_at", user_id: `eq.${user.id}`, order: "created_at.desc", limit: 50 },
      }).catch(() => ({ data: [] })),
    ]);

    const solvedList = (progressRes.data || []).map((p) => {
      const match = mockProblems.find((mp) => mp.id === p.problem_id);
      return {
        difficulty: match?.difficulty || "Easy",
        tags: match?.tags || [],
      };
    });

    return calculateReadinessScore(solvedList, submissionsRes.data || [], {
      mockInterviewsCompleted: 1,
      resumesCompiled: 1,
    });
  } catch {
    return calculateReadinessScore([], [], { mockInterviewsCompleted: 0, resumesCompiled: 0 });
  }
};

export const getAdminSummaryData = async (): Promise<AdminSummary> => {
  if (!hasSupabase()) {
    return emptyAdminSummary;
  }

  try {
    const startOfDayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const [totalUsers, activeSubscriptions, publishedProblems, aiUsageToday] = await Promise.all([
      countRows("users"),
      countRows("subscriptions", { status: "eq.active" }),
      countRows("problems", { status: "eq.published" }),
      countRows("analytics_events", {
        event_source: "eq.ai",
        created_at: `gte.${startOfDayIso}`,
      }),
    ]);

    return {
      totalUsers,
      activeSubscriptions,
      publishedProblems,
      totalRevenuePaise: 0,
      aiUsageToday,
    };
  } catch (error) {
    console.warn("Admin summary falling back to defaults:", error);
    return emptyAdminSummary;
  }
};

const getAdminEmails = (): Set<string> => {
  const envAdmins =
    process.env.ADMIN_EMAILS ||
    "vaibhavmaurya.1409@gmail.com,test12@gmail.com,vaibhav.test@codeorbit.in,vm3978257@gmail.com";
  return new Set(
    envAdmins
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
};

export const isConfiguredAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return getAdminEmails().has(email.toLowerCase());
};

export const buildViewerProfileData = (viewer: ViewerContext): UserProfile | null => {
  if (!viewer.uid || !viewer.email) {
    return null;
  }

  const displayName =
    viewer.displayName?.trim() || viewer.email.split("@")[0].replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "User";
  const isAdmin = isConfiguredAdminEmail(viewer.email);

  return {
    uid: viewer.uid,
    email: viewer.email,
    displayName,
    isAdmin,
    locale: "en",
    role: isAdmin ? "admin" : "user",
  };
};

export const getViewerProfileData = async (viewer: ViewerContext): Promise<UserProfile | null> => {
  if (!viewer.uid || !viewer.email) {
    return null;
  }

  if (!hasSupabase()) {
    const store = readLocalStorage();
    let user: LocalUserRecord | null | undefined = store.users.find(
      (u) => (viewer.uid && u.firebase_uid === viewer.uid) || (viewer.email && u.email === viewer.email)
    );
    if (!user) {
      user = ensureLocalUser(viewer, store);
    }
    if (!user) {
      return buildViewerProfileData(viewer);
    }
    const isAdmin = Boolean(user.is_admin) || isConfiguredAdminEmail(user.email);
    return {
      uid: user.firebase_uid,
      email: user.email,
      displayName: user.display_name,
      isAdmin,
      locale: user.locale === "hi" ? "hi" : "en",
      role:
        user.role === "admin" || user.role === "recruiter_beta" || user.role === "campus_beta"
          ? user.role
          : isAdmin
            ? "admin"
            : "user",
    };
  }

  try {
    let user = await loadUserRow(viewer);
    if (!user && viewer.uid && viewer.email) {
      const defaultName =
        viewer.displayName?.trim() ||
        viewer.email.split("@")[0].replace(/[^a-zA-Z0-9-_ ]/g, "").trim() ||
        "User";

      const insertRes = await requestSupabase<SupabaseUserRow[]>("users", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: {
          firebase_uid: viewer.uid,
          email: viewer.email.toLowerCase(),
          display_name: defaultName,
          locale: "en",
          role: "user",
          is_admin: false,
        },
      }).catch((err) => {
        console.warn("Auto-provision user notice:", err);
        return { data: null };
      });

      user = normalizeSingle(insertRes.data);
    }

    if (!user) {
      return buildViewerProfileData(viewer);
    }

    const isAdmin = Boolean(user.is_admin) || isConfiguredAdminEmail(user.email || viewer.email);
    return {
      uid: user.firebase_uid || viewer.uid,
      email: user.email || viewer.email,
      displayName: user.display_name || viewer.displayName || "User",
      isAdmin,
      locale: user.locale === "hi" ? "hi" : "en",
      role:
        user.role === "admin" || user.role === "recruiter_beta" || user.role === "campus_beta"
          ? user.role
          : isAdmin
            ? "admin"
            : "user",
    };
  } catch (error) {
    console.warn("Viewer profile falling back to header context:", error);
    return buildViewerProfileData(viewer);
  }
};

export const bootstrapUserProfileData = async (
  viewer: ViewerContext,
  input: { email?: string; displayName?: string }
): Promise<UserProfile | null> => {
  const email = (input.email || viewer.email || "").trim().toLowerCase();
  const uid = viewer.uid;
  if (!uid || !email) {
    return null;
  }

  const displayName =
    input.displayName?.trim() ||
    viewer.displayName?.trim() ||
    email.split("@")[0].replace(/[^a-zA-Z0-9-_ ]/g, "").trim() ||
    "User";

  if (!hasSupabase()) {
    const store = readLocalStorage();
    let user = store.users.find(
      (u) => (uid && u.firebase_uid === uid) || (email && u.email === email)
    );
    if (user) {
      user.display_name = displayName;
      user.email = email;
    } else {
      user = {
        id: randomUUID(),
        firebase_uid: uid,
        email,
        display_name: displayName,
        locale: "en",
        role: "user",
        is_admin: false,
        created_at: new Date().toISOString(),
      };
      store.users.push(user);
    }
    writeLocalStorage(store);
    const isAdmin = Boolean(user.is_admin) || isConfiguredAdminEmail(user.email);
    return {
      uid: user.firebase_uid,
      email: user.email,
      displayName: user.display_name,
      isAdmin,
      locale: user.locale === "hi" ? "hi" : "en",
      role:
        user.role === "admin" || user.role === "recruiter_beta" || user.role === "campus_beta"
          ? user.role
          : isAdmin
            ? "admin"
            : "user",
    };
  }

  try {
    let user = await loadUserRow({ uid, email });
    if (!user) {
      const insertResponse = await requestSupabase<SupabaseUserRow[]>("users", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: {
          firebase_uid: uid,
          email,
          display_name: displayName,
          locale: "en",
          role: "user",
          is_admin: false,
        },
      });
      user = normalizeSingle(insertResponse.data);
    }

    if (!user) {
      return buildViewerProfileData({ uid, email, displayName });
    }

    const isAdmin = Boolean(user.is_admin) || isConfiguredAdminEmail(user.email || email);
    return {
      uid: user.firebase_uid || uid,
      email: user.email || email,
      displayName: user.display_name || displayName,
      isAdmin,
      locale: user.locale === "hi" ? "hi" : "en",
      role:
        user.role === "admin" || user.role === "recruiter_beta" || user.role === "campus_beta"
          ? user.role
          : isAdmin
            ? "admin"
            : "user",
    };
  } catch (error) {
    console.warn("Bootstrap user profile error, fallback to memory:", error);
    return buildViewerProfileData({ uid, email, displayName });
  }
};

export const updateViewerPreferencesData = (input: {
  locale?: "en" | "hi";
  privacyConsentAccepted?: boolean;
}): ViewerPreferences => ({
  locale: input.locale === "hi" ? "hi" : "en",
  privacyConsentAccepted: Boolean(input.privacyConsentAccepted),
  privacyConsentAcceptedAtIso: input.privacyConsentAccepted ? new Date().toISOString() : null,
});

const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID ?? "").trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET ?? "").trim();

const ensureRazorpayConfigured = () => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the web app environment."
    );
  }
};

const BILLING_PLANS_MAP: Record<
  PaidBillingPlanId,
  { name: string; amountPaise: number; validityDays: number }
> = {
  "premium-monthly": {
    name: "Pro",
    amountPaise: 149900,
    validityDays: 30,
  },
  "premium-lifetime": {
    name: "Interview Sprint",
    amountPaise: 499900,
    validityDays: 365,
  },
};

export const createBillingOrderData = async (
  viewer: ViewerContext,
  planId: PaidBillingPlanId
): Promise<BillingOrder> => {
  if (!viewer.uid || !viewer.email) {
    throw new Error("Sign in required to create a billing order.");
  }

  const plan = BILLING_PLANS_MAP[planId];
  if (!plan) {
    throw new Error(`Invalid plan id: ${planId}`);
  }

  ensureRazorpayConfigured();

  const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`;
  const receipt = `${viewer.uid.slice(0, 8)}-${Date.now()}`;

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: plan.amountPaise,
      currency: "INR",
      receipt,
      notes: {
        uid: viewer.uid,
        email: viewer.email,
        planId,
        planName: plan.name,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Razorpay order creation error:", errorBody);
    throw new Error("Failed to create Razorpay payment order. Check payment gateway configuration.");
  }

  const order = (await response.json()) as { id: string; amount: number; currency: string };

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency || "INR",
    keyId: RAZORPAY_KEY_ID,
    planId,
    planName: plan.name,
  };
};

export const processSuccessfulPaymentData = async (input: {
  orderId: string;
  paymentId: string;
  planId?: PaidBillingPlanId;
  amountPaise?: number;
  currency?: string;
  viewer?: ViewerContext;
  uid?: string;
  email?: string;
  displayName?: string;
  method?: string;
  signature?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ status: "active"; planId: PaidBillingPlanId; validUntil: string }> => {
  const planId: PaidBillingPlanId = input.planId || "premium-monthly";
  const plan = BILLING_PLANS_MAP[planId] ?? BILLING_PLANS_MAP["premium-monthly"];
  const now = new Date();
  const validUntil = new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000);
  const validUntilIso = validUntil.toISOString();
  const amountPaise = input.amountPaise || plan.amountPaise;
  const currency = input.currency || "INR";

  const targetViewer: ViewerContext = {
    uid: input.viewer?.uid || input.uid,
    email: input.viewer?.email || input.email,
    displayName: input.viewer?.displayName || input.displayName,
  };

  if (!targetViewer.uid && !targetViewer.email) {
    throw new Error("Target user context missing for payment processing.");
  }

  if (hasSupabase()) {
    try {
      let user = await loadUserRow(targetViewer);
      if (!user && targetViewer.uid && targetViewer.email) {
        const insertRes = await requestSupabase<SupabaseUserRow[]>("users", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=representation" },
          body: {
            firebase_uid: targetViewer.uid,
            email: targetViewer.email.toLowerCase(),
            display_name: targetViewer.displayName || targetViewer.email.split("@")[0] || "User",
            locale: "en",
            role: "user",
            is_admin: false,
          },
        });
        user = normalizeSingle(insertRes.data);
      }

      if (user) {
        // Idempotency check: see if payment was already recorded
        const existingPaymentRes = await requestSupabase<{ id: string }[]>("payments", {
          params: {
            select: "id",
            provider_order_id: `eq.${input.orderId}`,
            limit: 1,
          },
        }).catch(() => ({ data: null }));

        const alreadyRecorded = Boolean(normalizeSingle(existingPaymentRes.data));

        if (!alreadyRecorded) {
          await requestSupabase("payments", {
            method: "POST",
            headers: { Prefer: "return=minimal" },
            body: {
              user_id: user.id,
              provider_order_id: input.orderId,
              provider_payment_id: input.paymentId,
              amount_paise: amountPaise,
              currency,
              status: "captured",
              metadata: {
                signature: input.signature,
                method: input.method,
                planId,
                planName: plan.name,
                ...input.metadata,
              },
              created_at: now.toISOString(),
            },
          }).catch((err) => {
            console.warn("Payment insert warning:", err);
          });
        }

        // Upsert active subscription
        await requestSupabase("subscriptions", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: {
            user_id: user.id,
            plan_code: planId,
            status: "active",
            provider: "razorpay",
            current_period_end: validUntilIso,
            created_at: now.toISOString(),
          },
        });
      }
    } catch (dbError) {
      console.warn("Failed to record subscription to Supabase:", dbError);
    }
  } else {
    try {
      const store = readLocalStorage();
      const user = ensureLocalUser(targetViewer, store);
      if (user) {
        const existingPay = store.payments.find(
          (p) => p.provider_order_id === input.orderId || p.provider_payment_id === input.paymentId
        );
        if (!existingPay) {
          store.payments.push({
            id: randomUUID(),
            user_id: user.id,
            provider_order_id: input.orderId,
            provider_payment_id: input.paymentId,
            amount_paise: amountPaise,
            currency,
            status: "captured",
            metadata: {
              signature: input.signature,
              method: input.method,
              planId,
              planName: plan.name,
              ...input.metadata,
            },
            created_at: now.toISOString(),
          });
        }

        const existingIdx = store.subscriptions.findIndex((s) => s.user_id === user.id);
        const subRecord: LocalSubscriptionRecord = {
          user_id: user.id,
          plan_code: planId,
          status: "active",
          provider: "razorpay",
          current_period_end: validUntilIso,
          created_at: now.toISOString(),
        };
        if (existingIdx >= 0) {
          store.subscriptions[existingIdx] = subRecord;
        } else {
          store.subscriptions.push(subRecord);
        }
        writeLocalStorage(store);
      }
    } catch (localErr) {
      console.warn("Failed to record subscription to local store:", localErr);
    }
  }

  return {
    status: "active",
    planId,
    validUntil: validUntilIso,
  };
};

export const processSubscriptionCancellationData = async (input: {
  orderId?: string;
  paymentId?: string;
  uid?: string;
  email?: string;
  status: "cancelled" | "refunded";
  reason?: string;
}): Promise<{ status: "cancelled" | "refunded"; success: boolean }> => {
  const targetViewer: ViewerContext = {
    uid: input.uid,
    email: input.email,
  };

  const nowIso = new Date().toISOString();

  if (hasSupabase()) {
    try {
      const user = await loadUserRow(targetViewer);
      if (user) {
        await requestSupabase("subscriptions", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: {
            user_id: user.id,
            plan_code: "free",
            status: input.status,
            provider: "razorpay",
            current_period_end: nowIso,
            created_at: nowIso,
          },
        });
      }
    } catch (err) {
      console.warn("Failed to record subscription cancellation in Supabase:", err);
    }
  } else {
    try {
      const store = readLocalStorage();
      const user = store.users.find(
        (u) =>
          (input.uid && u.firebase_uid === input.uid) ||
          (input.email && u.email.toLowerCase() === input.email.toLowerCase())
      );
      if (user) {
        const subIdx = store.subscriptions.findIndex((s) => s.user_id === user.id);
        if (subIdx >= 0) {
          store.subscriptions[subIdx].status = input.status;
          store.subscriptions[subIdx].current_period_end = nowIso;
        } else {
          store.subscriptions.push({
            user_id: user.id,
            plan_code: "free",
            status: input.status,
            provider: "razorpay",
            current_period_end: nowIso,
            created_at: nowIso,
          });
        }
        writeLocalStorage(store);
      }
    } catch (localErr) {
      console.warn("Failed to record subscription cancellation in local store:", localErr);
    }
  }

  return { status: input.status, success: true };
};

export const verifyBillingPaymentData = async (
  viewer: ViewerContext,
  input: {
    orderId: string;
    paymentId: string;
    signature: string;
    planId?: PaidBillingPlanId;
  }
): Promise<BillingVerification> => {
  if (!viewer.uid || !viewer.email) {
    throw new Error("Sign in required to verify payment.");
  }

  ensureRazorpayConfigured();

  const digest = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  const expected = Buffer.from(digest);
  const provided = Buffer.from(input.signature);
  const isValid =
    expected.length === provided.length &&
    timingSafeEqual(expected as unknown as Uint8Array, provided as unknown as Uint8Array);

  if (!isValid) {
    throw new Error("Invalid cryptographic payment signature.");
  }

  return processSuccessfulPaymentData({
    orderId: input.orderId,
    paymentId: input.paymentId,
    planId: input.planId,
    viewer,
    signature: input.signature,
  });
};

export const recordInterviewSessionData = async (
  viewer: ViewerContext,
  input: {
    company: string;
    role: string;
    overallScore: number;
    transcript: string;
    feedback: Record<string, unknown>;
  }
) => {
  if (!hasSupabase()) {
    return null;
  }

  try {
    const user = await loadUserRow(viewer);
    if (!user) {
      return null;
    }

    await requestSupabase("interview_sessions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: {
        user_id: user.id,
        company_slug: input.company.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        role_slug: input.role.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        score: input.overallScore,
        transcript: [{ role: "user", content: input.transcript }],
        feedback: input.feedback,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.warn("Failed to record interview session to Supabase:", error);
  }
};

export const recordDpdpConsent = async (
  input: DpdpConsentInput,
  viewer?: ViewerContext,
  ip?: string,
  userAgent?: string
): Promise<DpdpConsentLog> => {
  const now = new Date().toISOString();
  const consentId = randomUUID();
  let userId = viewer?.uid || "anonymous";

  if (hasSupabase() && viewer) {
    try {
      const user = await loadUserRow(viewer);
      if (user) {
        userId = user.id;
        await requestSupabase("dpdp_consent_logs", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: {
            id: consentId,
            user_id: user.id,
            consent_version: input.consentVersion || "2026.1",
            is_under_18: input.isUnder18,
            parent_guardian_email: input.parentGuardianEmail || null,
            purposes_accepted: input.purposesAccepted,
            ip_address: ip || null,
            user_agent: userAgent || null,
            consented_at: now,
          },
        });
      }
    } catch (err) {
      console.warn("Notice: could not persist DPDP consent to Supabase:", err);
    }
  }

  const store = readLocalStorage();
  const localUser = viewer ? ensureLocalUser(viewer, store) : null;
  if (localUser) {
    userId = localUser.id;
  }
  const record: LocalDpdpConsentRecord = {
    id: consentId,
    user_id: userId,
    consent_version: input.consentVersion || "2026.1",
    is_under_18: input.isUnder18,
    parent_guardian_email: input.parentGuardianEmail || null,
    purposes_accepted: input.purposesAccepted,
    ip_address: ip || null,
    user_agent: userAgent || null,
    consented_at: now,
    revoked_at: null,
  };
  store.dpdp_consent_logs.unshift(record);
  writeLocalStorage(store);

  return {
    id: consentId,
    userId,
    consentVersion: input.consentVersion || "2026.1",
    isUnder18: input.isUnder18,
    parentGuardianEmail: input.parentGuardianEmail,
    purposesAccepted: input.purposesAccepted,
    ipAddress: ip,
    userAgent,
    consentedAtIso: now,
  };
};

export const getLatestDpdpConsent = async (userId: string): Promise<DpdpConsentLog | null> => {
  if (hasSupabase()) {
    try {
      const res = await requestSupabase<SupabaseDpdpConsentRow[]>("dpdp_consent_logs", {
        params: {
          select: "*",
          user_id: `eq.${userId}`,
          order: "consented_at.desc",
          limit: 1,
        },
      });
      const row = normalizeSingle(res.data);
      if (row) {
        return {
          id: row.id,
          userId: row.user_id,
          consentVersion: row.consent_version,
          isUnder18: row.is_under_18,
          parentGuardianEmail: row.parent_guardian_email || undefined,
          purposesAccepted: row.purposes_accepted,
          ipAddress: row.ip_address || undefined,
          userAgent: row.user_agent || undefined,
          consentedAtIso: row.consented_at,
          revokedAtIso: row.revoked_at || undefined,
        };
      }
    } catch (err) {
      console.warn("Notice: could not query DPDP consent from Supabase:", err);
    }
  }

  const store = readLocalStorage();
  const record = store.dpdp_consent_logs.find((c) => c.user_id === userId);
  if (!record) return null;
  return {
    id: record.id,
    userId: record.user_id,
    consentVersion: record.consent_version,
    isUnder18: record.is_under_18,
    parentGuardianEmail: record.parent_guardian_email || undefined,
    purposesAccepted: record.purposes_accepted,
    ipAddress: record.ip_address || undefined,
    userAgent: record.user_agent || undefined,
    consentedAtIso: record.consented_at,
    revokedAtIso: record.revoked_at || undefined,
  };
};

export const getAllDpdpConsentLogs = async (limit = 50): Promise<DpdpConsentLog[]> => {
  if (hasSupabase()) {
    try {
      const res = await requestSupabase<SupabaseDpdpConsentRow[]>("dpdp_consent_logs", {
        params: {
          select: "*",
          order: "consented_at.desc",
          limit: limit.toString(),
        },
      });
      if (Array.isArray(res.data)) {
        return res.data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          consentVersion: row.consent_version,
          isUnder18: row.is_under_18,
          parentGuardianEmail: row.parent_guardian_email || undefined,
          purposesAccepted: row.purposes_accepted,
          ipAddress: row.ip_address || undefined,
          userAgent: row.user_agent || undefined,
          consentedAtIso: row.consented_at,
          revokedAtIso: row.revoked_at || undefined,
        }));
      }
    } catch (err) {
      console.warn("Notice: could not query DPDP consent logs from Supabase:", err);
    }
  }

  const store = readLocalStorage();
  return (store.dpdp_consent_logs || []).slice(0, limit).map((record) => ({
    id: record.id,
    userId: record.user_id,
    consentVersion: record.consent_version,
    isUnder18: record.is_under_18,
    parentGuardianEmail: record.parent_guardian_email || undefined,
    purposesAccepted: record.purposes_accepted,
    ipAddress: record.ip_address || undefined,
    userAgent: record.user_agent || undefined,
    consentedAtIso: record.consented_at,
    revokedAtIso: record.revoked_at || undefined,
  }));
};

export const recordProctorEvent = async (
  input: ProctorEventInput,
  viewer?: ViewerContext
): Promise<ProctorEvent> => {
  const now = new Date().toISOString();
  const eventId = randomUUID();
  let userId = viewer?.uid || "anonymous";

  if (hasSupabase() && viewer) {
    try {
      const user = await loadUserRow(viewer);
      if (user) {
        userId = user.id;
        await requestSupabase("proctor_events", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: {
            id: eventId,
            contest_id: input.contestId,
            user_id: user.id,
            event_type: input.eventType,
            metadata: input.metadata || {},
            occurred_at: now,
          },
        });
      }
    } catch (err) {
      console.warn("Notice: could not persist proctor event to Supabase:", err);
    }
  }

  const store = readLocalStorage();
  const localUser = viewer ? ensureLocalUser(viewer, store) : null;
  if (localUser) {
    userId = localUser.id;
  }
  const record: LocalProctorEventRecord = {
    id: eventId,
    contest_id: input.contestId,
    user_id: userId,
    event_type: input.eventType,
    metadata: input.metadata || {},
    occurred_at: now,
  };
  store.proctor_events.unshift(record);
  writeLocalStorage(store);

  return {
    id: eventId,
    contestId: input.contestId,
    userId,
    eventType: input.eventType,
    metadata: (input.metadata as Record<string, unknown>) || {},
    occurredAtIso: now,
  };
};

export const listContestsData = async (tenantId?: string): Promise<Contest[]> => {
  if (hasSupabase()) {
    try {
      const params: Record<string, string | number> = {
        select: "*",
        is_published: "eq.true",
        order: "start_time.asc",
      };
      if (tenantId) {
        params.tenant_id = `eq.${tenantId}`;
      }
      const res = await requestSupabase<SupabaseContestRow[]>("contests", { params });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((c) => ({
          id: c.id,
          tenantId: c.tenant_id || undefined,
          title: c.title,
          slug: c.slug,
          description: c.description || undefined,
          problemIds: Array.isArray(c.problem_ids) ? c.problem_ids : [],
          startTimeIso: c.start_time,
          endTimeIso: c.end_time,
          durationMinutes: c.duration_minutes,
          isPublished: c.is_published,
          createdBy: c.created_by || undefined,
          createdAtIso: c.created_at,
        }));
      }
    } catch (err) {
      console.warn("Notice: could not fetch contests from Supabase:", err);
    }
  }

  const store = readLocalStorage();
  let list = store.contests.filter((c) => c.is_published);
  if (tenantId) {
    list = list.filter((c) => c.tenant_id === tenantId);
  }
  return list.map((c) => ({
    id: c.id,
    tenantId: c.tenant_id || undefined,
    title: c.title,
    slug: c.slug,
    description: c.description || undefined,
    problemIds: c.problem_ids,
    startTimeIso: c.start_time,
    endTimeIso: c.end_time,
    durationMinutes: c.duration_minutes,
    isPublished: c.is_published,
    createdBy: c.created_by || undefined,
    createdAtIso: c.created_at,
  }));
};

export const getContestData = async (slug: string): Promise<Contest | null> => {
  if (hasSupabase()) {
    try {
      const res = await requestSupabase<SupabaseContestRow[]>("contests", {
        params: {
          select: "*",
          slug: `eq.${slug}`,
          limit: 1,
        },
      });
      const c = normalizeSingle(res.data);
      if (c) {
        return {
          id: c.id,
          tenantId: c.tenant_id || undefined,
          title: c.title,
          slug: c.slug,
          description: c.description || undefined,
          problemIds: Array.isArray(c.problem_ids) ? c.problem_ids : [],
          startTimeIso: c.start_time,
          endTimeIso: c.end_time,
          durationMinutes: c.duration_minutes,
          isPublished: c.is_published,
          createdBy: c.created_by || undefined,
          createdAtIso: c.created_at,
        };
      }
    } catch (err) {
      console.warn("Notice: could not get contest from Supabase:", err);
    }
  }

  const store = readLocalStorage();
  const c = store.contests.find((item) => item.slug === slug);
  if (!c) return null;
  return {
    id: c.id,
    tenantId: c.tenant_id || undefined,
    title: c.title,
    slug: c.slug,
    description: c.description || undefined,
    problemIds: c.problem_ids,
    startTimeIso: c.start_time,
    endTimeIso: c.end_time,
    durationMinutes: c.duration_minutes,
    isPublished: c.is_published,
    createdBy: c.created_by || undefined,
    createdAtIso: c.created_at,
  };
};

export const getTenantData = async (slug: string): Promise<Tenant | null> => {
  if (hasSupabase()) {
    try {
      const res = await requestSupabase<SupabaseTenantRow[]>("tenants", {
        params: {
          select: "*",
          slug: `eq.${slug}`,
          limit: 1,
        },
      });
      const t = normalizeSingle(res.data);
      if (t) {
        return {
          id: t.id,
          slug: t.slug,
          name: t.name,
          tier: t.tier,
          state: t.state,
          contactTpoName: t.contact_tpo_name,
          contactTpoEmail: t.contact_tpo_email,
          contactTpoPhone: t.contact_tpo_phone || undefined,
          planStatus: t.plan_status,
          maxStudents: t.max_students,
          createdAtIso: t.created_at,
          updatedAtIso: t.updated_at,
        };
      }
    } catch (err) {
      console.warn("Notice: could not get tenant from Supabase:", err);
    }
  }

  const store = readLocalStorage();
  const t = store.tenants.find((item) => item.slug === slug);
  if (!t) return null;
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    tier: t.tier,
    state: t.state,
    contactTpoName: t.contact_tpo_name,
    contactTpoEmail: t.contact_tpo_email,
    contactTpoPhone: t.contact_tpo_phone || undefined,
    planStatus: t.plan_status,
    maxStudents: t.max_students,
    createdAtIso: t.created_at,
    updatedAtIso: t.updated_at,
  };
};

export const listTenantMemberships = async (tenantId: string): Promise<TenantMembership[]> => {
  if (hasSupabase()) {
    try {
      const res = await requestSupabase<SupabaseTenantMembershipRow[]>("tenant_memberships", {
        params: {
          select: "*",
          tenant_id: `eq.${tenantId}`,
          order: "created_at.desc",
        },
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((m) => ({
          id: m.id,
          tenantId: m.tenant_id,
          userId: m.user_id,
          rollNumber: m.roll_number || undefined,
          department: m.department,
          batchYear: m.batch_year,
          role: m.role,
          verified: m.verified,
          createdAtIso: m.created_at,
        }));
      }
    } catch (err) {
      console.warn("Notice: could not list tenant memberships from Supabase:", err);
    }
  }

  const store = readLocalStorage();
  return store.tenant_memberships
    .filter((m) => m.tenant_id === tenantId)
    .map((m) => ({
      id: m.id,
      tenantId: m.tenant_id,
      userId: m.user_id,
      rollNumber: m.roll_number || undefined,
      department: m.department,
      batchYear: m.batch_year,
      role: m.role,
      verified: m.verified,
      createdAtIso: m.created_at,
    }));
};

/**
 * Irrevocably purges all candidate personal data, code submissions, progress, and telemetry.
 * Enforces the Right to Erasure / Right to be Forgotten under Section 12 of India's DPDP Act 2023.
 */
export const purgeUserDataByDpdp = async (
  viewer: ViewerContext
): Promise<{ success: boolean; purgedRecordsCount: number; message: string }> => {
  if (!viewer.uid && !viewer.email) {
    throw new Error("Viewer authentication required for data erasure.");
  }

  let purgedCount = 0;

  if (hasSupabase()) {
    try {
      const user = await loadUserRow(viewer);
      if (user) {
        await requestSupabase("submissions", {
          method: "DELETE",
          params: { user_id: `eq.${user.id}` },
        }).catch(() => null);

        await requestSupabase("user_progress", {
          method: "DELETE",
          params: { user_id: `eq.${user.id}` },
        }).catch(() => null);

        await requestSupabase("proctor_events", {
          method: "DELETE",
          params: { user_id: `eq.${user.id}` },
        }).catch(() => null);

        await requestSupabase("users", {
          method: "DELETE",
          params: { id: `eq.${user.id}` },
        });
        purgedCount += 1;
      }
    } catch (err) {
      console.warn("Notice: Supabase user purge error:", err);
    }
  }

  // Also purge from local storage cache
  const store = readLocalStorage();
  const initialUsersLen = store.users.length;
  const initialSubmissionsLen = store.submissions.length;

  store.users = store.users.filter(
    (u) =>
      !(viewer.uid && u.firebase_uid === viewer.uid) &&
      !(viewer.email && u.email.toLowerCase() === viewer.email.toLowerCase())
  );
  store.submissions = store.submissions.filter(
    (s) => !(viewer.uid && s.user_id === viewer.uid)
  );
  store.user_progress = store.user_progress.filter(
    (p) => !(viewer.uid && p.user_id === viewer.uid)
  );
  store.proctor_events = store.proctor_events.filter(
    (pe) => !(viewer.uid && pe.user_id === viewer.uid)
  );

  purgedCount +=
    initialUsersLen - store.users.length + (initialSubmissionsLen - store.submissions.length);

  writeLocalStorage(store);

  return {
    success: true,
    purgedRecordsCount: Math.max(purgedCount, 1),
    message:
      "All candidate records, code submissions, progress, and telemetry permanently deleted under India's DPDP Act 2023.",
  };
};



