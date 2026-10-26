import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  type ActivitySummary,
  type AdminSummary,
  type BillingOrder,
  type BillingSummary,
  type BillingVerification,
  type DashboardSummary,
  type LeaderboardSummary,
  type PaidBillingPlanId,
  type ProblemDetail,
  type ProblemListItem,
  type UserProfile,
  type ViewerPreferences,
} from "@codeorbit/schema";
import { getProblemById, mockProblems } from "@codeorbit/ui";

const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const SUPABASE_REST_URL = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : "";

export interface ViewerContext {
  uid?: string;
  email?: string;
  displayName?: string;
}

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

const hasSupabase = () => Boolean(SUPABASE_REST_URL && SUPABASE_SERVICE_ROLE_KEY);

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
    method?: "GET" | "POST" | "PATCH" | "HEAD";
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

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const getViewerContextFromHeaders = (headers: Headers): ViewerContext => {
  const authHeader = headers.get("authorization") ?? headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const payload = decodeJwtPayload(token);
    if (payload && (payload.user_id || payload.sub)) {
      return {
        uid: String(payload.user_id || payload.sub),
        email: typeof payload.email === "string" ? payload.email : undefined,
        displayName: typeof payload.name === "string" ? payload.name : undefined,
      };
    }
  }

  // In development only, allow header context fallback for testing
  if (process.env.NODE_ENV === "development") {
    return {
      uid: headers.get("x-codeorbit-viewer-uid") ?? undefined,
      email: headers.get("x-codeorbit-viewer-email") ?? undefined,
      displayName: headers.get("x-codeorbit-viewer-name") ?? undefined,
    };
  }

  return {};
};

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
    return freeBillingSummary;
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
    if (!row || row.status !== "active") {
      return freeBillingSummary;
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
    return emptyDashboardSummary;
  }

  try {
    const user = await loadUserRow(viewer);
    if (!user) {
      return emptyDashboardSummary;
    }

    const [progressResponse, subscriptionResponse, problemsResponse] = await Promise.all([
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
    };
  } catch (error) {
    console.warn("Dashboard summary falling back to local defaults:", error);
    return emptyDashboardSummary;
  }
};

export const getActivitySummaryData = async (viewer: ViewerContext): Promise<ActivitySummary> => {
  if (!hasSupabase()) {
    return emptyActivitySummary;
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
    return fallbackLeaderboardSummary;
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
  if (!hasSupabase()) {
    return null;
  }

  try {
    const user = await loadUserRow(viewer);
    if (!user) {
      return null;
    }

    const problemResponse = await requestSupabase<SupabaseProblemRow[]>("problems", {
      params: {
        select: "id,slug",
        slug: `eq.${payload.problemId}`,
        limit: 1,
      },
    }).catch(() => ({ data: null }));

    const problem = normalizeSingle(problemResponse.data);
    if (!problem) {
      return null;
    }

    const submissionId = randomUUID();
    const nowIso = new Date().toISOString();

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

    const isSolved = payload.passed === true || payload.status === "Accepted";
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
    console.warn("Failed to persist submission to Supabase:", error);
    return null;
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

export const buildViewerProfileData = (viewer: ViewerContext): UserProfile | null => {
  if (!viewer.uid || !viewer.email) {
    return null;
  }

  const displayName =
    viewer.displayName?.trim() || viewer.email.split("@")[0].replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "User";

  return {
    uid: viewer.uid,
    email: viewer.email,
    displayName,
    isAdmin: false,
    locale: "en",
    role: "user",
  };
};

export const getViewerProfileData = async (viewer: ViewerContext): Promise<UserProfile | null> => {
  if (!viewer.uid || !viewer.email) {
    return null;
  }

  if (!hasSupabase()) {
    return buildViewerProfileData(viewer);
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

    return {
      uid: user.firebase_uid || viewer.uid,
      email: user.email || viewer.email,
      displayName: user.display_name || viewer.displayName || "User",
      isAdmin: Boolean(user.is_admin),
      locale: user.locale === "hi" ? "hi" : "en",
      role:
        user.role === "admin" || user.role === "recruiter_beta" || user.role === "campus_beta"
          ? user.role
          : Boolean(user.is_admin)
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
    return {
      uid,
      email,
      displayName,
      isAdmin: false,
      locale: "en",
      role: "user",
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

    return {
      uid: user.firebase_uid || uid,
      email: user.email || email,
      displayName: user.display_name || displayName,
      isAdmin: Boolean(user.is_admin),
      locale: user.locale === "hi" ? "hi" : "en",
      role:
        user.role === "admin" || user.role === "recruiter_beta" || user.role === "campus_beta"
          ? user.role
          : Boolean(user.is_admin)
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

const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || "rzp_test_SSbURnPNWloMSA").trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || "2P2juOCrkewylBrojMmVBXws").trim();

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

  const planId: PaidBillingPlanId = input.planId || "premium-monthly";
  const plan = BILLING_PLANS_MAP[planId] ?? BILLING_PLANS_MAP["premium-monthly"];
  const now = new Date();
  const validUntil = new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000);
  const validUntilIso = validUntil.toISOString();

  if (hasSupabase()) {
    try {
      const user = await loadUserRow(viewer);
      if (user) {
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

        await requestSupabase("payments", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: {
            user_id: user.id,
            provider_order_id: input.orderId,
            provider_payment_id: input.paymentId,
            amount_paise: plan.amountPaise,
            currency: "INR",
            status: "captured",
            metadata: {
              signature: input.signature,
              planId,
              planName: plan.name,
            },
            created_at: now.toISOString(),
          },
        }).catch((err) => {
          console.warn("Payment insert warning:", err);
        });
      }
    } catch (dbError) {
      console.warn("Failed to record subscription to Supabase:", dbError);
    }
  }

  return {
    status: "active",
    planId,
    validUntil: validUntilIso,
  };
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

