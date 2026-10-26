import * as logger from "firebase-functions/logger";

type RepoDifficulty = "Easy" | "Medium" | "Hard";
type RepoLocale = "en" | "hi";

interface SupabaseUserRow {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  locale: string;
  role: string;
  is_admin: boolean;
  created_at?: string;
}

interface SupabaseProblemRow {
  id: string;
  slug: string;
  title: string;
  difficulty: RepoDifficulty;
  description_md?: string;
  starter_code?: unknown;
  constraints?: unknown;
  examples?: unknown;
}

interface SupabaseProblemTagRow {
  problem_id: string;
  tag: string;
}

interface SupabaseUserProgressRow {
  problem_id: string;
  solved: boolean;
}

interface SupabaseSubscriptionRow {
  status: string;
}

interface SupabasePaymentRow {
  amount_paise: number | string;
}

export interface RepoProblemListItem {
  id: string;
  problemName: string;
  difficulty: RepoDifficulty;
  tags: string[];
}

export interface RepoProblemDetail extends RepoProblemListItem {
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  starterCode: string;
}

export interface RepoUserProfile {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  locale: RepoLocale;
  role: string;
  createdAtIso?: string;
}

export interface RepoDashboardSummary {
  streak: number;
  solvedCount: number;
  weakTopics: string[];
  recommendedTrack: string;
  premiumActive: boolean;
}

export interface RepoAdminSummary {
  totalUsers: number;
  activeSubscriptions: number;
  publishedProblems: number;
  totalRevenuePaise: number;
  aiUsageToday: number;
}

const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const SUPABASE_REST_URL = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : "";

const hasJsonBody = (method: string) => method !== "HEAD" && method !== "GET";

const normalizeSingle = <T>(value: T | T[] | null): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

const toInFilter = (values: string[]) =>
  `(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(",")})`;

const toLocale = (value: string | undefined): RepoLocale => (value === "hi" ? "hi" : "en");

const normalizeConstraints = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
};

const normalizeExamples = (
  value: unknown
): Array<{
  input: string;
  output: string;
  explanation?: string;
}> => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
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
    .filter(
      (
        entry
      ): entry is {
        input: string;
        output: string;
        explanation?: string;
      } => entry !== null
    );
};

const normalizeStarterCode = (value: unknown): string => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value && typeof value === "object") {
    const starterRecord = value as Record<string, unknown>;
    const preferred =
      starterRecord.typescript ??
      starterRecord.javascript ??
      starterRecord.python ??
      Object.values(starterRecord).find((entry) => typeof entry === "string" && entry.trim());

    if (typeof preferred === "string" && preferred.trim()) {
      return preferred;
    }
  }

  return "// Starter template will appear here once this problem is published.";
};

const problemRowToListItem = (problem: SupabaseProblemRow, tags: string[]): RepoProblemListItem => ({
  id: problem.slug,
  problemName: problem.title,
  difficulty: problem.difficulty,
  tags,
});

const problemRowToDetail = (problem: SupabaseProblemRow, tags: string[]): RepoProblemDetail => ({
  id: problem.slug,
  problemName: problem.title,
  difficulty: problem.difficulty,
  tags,
  description: problem.description_md?.trim() || "Problem description will appear here once the content is published.",
  examples: normalizeExamples(problem.examples),
  constraints: normalizeConstraints(problem.constraints),
  starterCode: normalizeStarterCode(problem.starter_code),
});

const userRowToProfile = (row: SupabaseUserRow): RepoUserProfile => ({
  uid: row.firebase_uid,
  email: row.email,
  displayName: row.display_name,
  isAdmin: Boolean(row.is_admin),
  locale: toLocale(row.locale),
  role: row.role || "user",
  createdAtIso: row.created_at,
});

const buildRestUrl = (
  table: string,
  params: Record<string, string | number | undefined> = {}
) => {
  const url = new URL(`${SUPABASE_REST_URL}/${table}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const createHeaders = (method: string, extra: Record<string, string> = {}) => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  ...(hasJsonBody(method) ? { "Content-Type": "application/json" } : {}),
  ...extra,
});

const requestSupabase = async <T>(
  table: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "HEAD";
    params?: Record<string, string | number | undefined>;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): Promise<{ data: T | null; headers: Headers }> => {
  if (!SUPABASE_REST_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase env is not configured.");
  }

  const method = options.method ?? "GET";
  const response = await fetch(buildRestUrl(table, options.params), {
    method,
    headers: createHeaders(method, options.headers),
    body: hasJsonBody(method) && options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase ${table} request failed (${response.status}): ${body}`);
  }

  if (method === "HEAD" || response.status === 204) {
    return { data: null, headers: response.headers };
  }

  return {
    data: (await response.json()) as T,
    headers: response.headers,
  };
};

const safeSupabase = async <T>(label: string, operation: () => Promise<T>): Promise<T | null> => {
  if (!SUPABASE_REST_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    return await operation();
  } catch (error) {
    logger.error(`Supabase repository failure: ${label}`, error as Error);
    return null;
  }
};

const loadProblemTags = async (problemIds: string[]) => {
  if (problemIds.length === 0) {
    return new Map<string, string[]>();
  }

  const response = await requestSupabase<SupabaseProblemTagRow[]>("problem_tags", {
    params: {
      select: "problem_id,tag",
      problem_id: `in.${toInFilter(problemIds)}`,
      order: "tag.asc",
    },
  });

  const tagsByProblem = new Map<string, string[]>();
  (response.data ?? []).forEach((entry) => {
    const current = tagsByProblem.get(entry.problem_id) ?? [];
    current.push(entry.tag);
    tagsByProblem.set(entry.problem_id, current);
  });

  return tagsByProblem;
};

const countFromHeaders = (headers: Headers): number => {
  const contentRange = headers.get("content-range");
  if (!contentRange) {
    return 0;
  }

  const slashIndex = contentRange.lastIndexOf("/");
  if (slashIndex === -1) {
    return 0;
  }

  const total = Number(contentRange.slice(slashIndex + 1));
  return Number.isFinite(total) ? total : 0;
};

const countRows = async (table: string, filters: Record<string, string | number | undefined> = {}) => {
  const response = await requestSupabase<unknown[]>(table, {
    params: {
      select: "id",
      limit: 1,
      ...filters,
    },
    headers: {
      Prefer: "count=exact",
    },
  });

  return countFromHeaders(response.headers);
};

const loadUserRow = async (firebaseUid: string) => {
  const response = await requestSupabase<SupabaseUserRow[]>("users", {
    params: {
      select: "id,firebase_uid,email,display_name,locale,role,is_admin,created_at",
      firebase_uid: `eq.${firebaseUid}`,
      limit: 1,
    },
  });

  return normalizeSingle(response.data);
};

const loadUserRowByEmail = async (email: string) => {
  const response = await requestSupabase<SupabaseUserRow[]>("users", {
    params: {
      select: "id,firebase_uid,email,display_name,locale,role,is_admin,created_at",
      email: `eq.${email}`,
      limit: 1,
    },
  });

  return normalizeSingle(response.data);
};

export const hasSupabaseRepository = () => Boolean(SUPABASE_REST_URL && SUPABASE_SERVICE_ROLE_KEY);

export const listPublishedProblemsFromSupabase = async (): Promise<RepoProblemListItem[] | null> =>
  safeSupabase("listPublishedProblems", async () => {
    const response = await requestSupabase<SupabaseProblemRow[]>("problems", {
      params: {
        select: "id,slug,title,difficulty",
        status: "eq.published",
        order: "created_at.asc",
      },
    });

    const rows = response.data ?? [];
    if (rows.length === 0) {
      return [];
    }

    const tagsByProblem = await loadProblemTags(rows.map((problem) => problem.id));
    return rows.map((problem) => problemRowToListItem(problem, tagsByProblem.get(problem.id) ?? []));
  });

export const getPublishedProblemDetailFromSupabase = async (
  problemSlug: string
): Promise<RepoProblemDetail | null> =>
  safeSupabase("getPublishedProblemDetail", async () => {
    const response = await requestSupabase<SupabaseProblemRow[]>("problems", {
      params: {
        select: "id,slug,title,difficulty,description_md,starter_code,constraints,examples",
        slug: `eq.${problemSlug}`,
        status: "eq.published",
        limit: 1,
      },
    });

    const row = normalizeSingle(response.data);
    if (!row) {
      return null;
    }

    const tagsByProblem = await loadProblemTags([row.id]);
    return problemRowToDetail(row, tagsByProblem.get(row.id) ?? []);
  });

export const upsertUserProfileInSupabase = async (input: {
  firebaseUid: string;
  email: string;
  displayName: string;
  adminHint?: boolean;
}): Promise<RepoUserProfile | null> =>
  safeSupabase("upsertUserProfile", async () => {
    const existing = await loadUserRow(input.firebaseUid);
    const nextIsAdmin = Boolean(existing?.is_admin || input.adminHint);
    const nextRole = existing?.role || (nextIsAdmin ? "admin" : "user");
    const nextLocale = toLocale(existing?.locale);

    const response = await requestSupabase<SupabaseUserRow | SupabaseUserRow[]>("users", {
      method: "POST",
      params: {
        on_conflict: "firebase_uid",
      },
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: {
        firebase_uid: input.firebaseUid,
        email: input.email,
        display_name: input.displayName,
        locale: nextLocale,
        role: nextRole,
        is_admin: nextIsAdmin,
      },
    });

    const row = normalizeSingle(response.data);
    return row ? userRowToProfile(row) : null;
  });

export const getUserProfileFromSupabase = async (firebaseUid: string): Promise<RepoUserProfile | null> =>
  safeSupabase("getUserProfile", async () => {
    const row = await loadUserRow(firebaseUid);
    return row ? userRowToProfile(row) : null;
  });

export const getUserProfileByEmailFromSupabase = async (email: string): Promise<RepoUserProfile | null> =>
  safeSupabase("getUserProfileByEmail", async () => {
    const row = await loadUserRowByEmail(email);
    return row ? userRowToProfile(row) : null;
  });

export const updateUserRoleInSupabase = async (input: {
  firebaseUid?: string;
  email?: string;
  role: string;
  isAdmin: boolean;
}): Promise<RepoUserProfile | null> =>
  safeSupabase("updateUserRole", async () => {
    const existing = input.firebaseUid ? await loadUserRow(input.firebaseUid) : input.email ? await loadUserRowByEmail(input.email) : null;
    if (!existing) {
      return null;
    }

    const response = await requestSupabase<SupabaseUserRow | SupabaseUserRow[]>("users", {
      method: "PATCH",
      params: {
        select: "id,firebase_uid,email,display_name,locale,role,is_admin,created_at",
        firebase_uid: `eq.${existing.firebase_uid}`,
      },
      headers: {
        Prefer: "return=representation",
      },
      body: {
        role: input.role,
        is_admin: input.isAdmin,
      },
    });

    const row = normalizeSingle(response.data);
    return row ? userRowToProfile(row) : null;
  });

export const getDashboardSummaryFromSupabase = async (
  firebaseUid: string
): Promise<RepoDashboardSummary | null> =>
  safeSupabase("getDashboardSummary", async () => {
    const user = await loadUserRow(firebaseUid);
    if (!user) {
      return null;
    }

    const [progressResponse, subscriptionResponse] = await Promise.all([
      requestSupabase<SupabaseUserProgressRow[]>("user_progress", {
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
    ]);

    const solvedProblemIds = new Set(
      (progressResponse.data ?? []).filter((entry) => entry.solved).map((entry) => entry.problem_id)
    );

    const publishedProblemsResponse = await requestSupabase<SupabaseProblemRow[]>("problems", {
      params: {
        select: "id,slug,title,difficulty",
        status: "eq.published",
      },
    });
    const publishedProblems = publishedProblemsResponse.data ?? [];
    const tagsByProblem = await loadProblemTags(publishedProblems.map((problem) => problem.id));

    const tagTotals = new Map<string, number>();
    const solvedTagTotals = new Map<string, number>();

    publishedProblems.forEach((problem) => {
      const tags = tagsByProblem.get(problem.id) ?? [];
      tags.forEach((tag) => {
        tagTotals.set(tag, (tagTotals.get(tag) ?? 0) + 1);
        if (solvedProblemIds.has(problem.id)) {
          solvedTagTotals.set(tag, (solvedTagTotals.get(tag) ?? 0) + 1);
        }
      });
    });

    const weakTopics =
      Array.from(tagTotals.entries())
        .sort((left, right) => {
          const leftRatio = (solvedTagTotals.get(left[0]) ?? 0) / left[1];
          const rightRatio = (solvedTagTotals.get(right[0]) ?? 0) / right[1];

          if (leftRatio !== rightRatio) {
            return leftRatio - rightRatio;
          }

          if (left[1] !== right[1]) {
            return right[1] - left[1];
          }

          return left[0].localeCompare(right[0]);
        })
        .slice(0, 3)
        .map(([tag]) => tag) || [];

    const solvedCount = solvedProblemIds.size;
    const recommendedTrack =
      solvedCount >= 8
        ? "Google Interview Sprint"
        : weakTopics[0]
          ? `${weakTopics[0]} Revision Track`
          : "TCS + Infosys Foundations";

    return {
      streak: solvedCount > 0 ? Math.min(solvedCount, 7) : 0,
      solvedCount,
      weakTopics: weakTopics.length > 0 ? weakTopics : ["Arrays", "Binary Search", "Strings"],
      recommendedTrack,
      premiumActive: (subscriptionResponse.data ?? []).length > 0,
    };
  });

export const getAdminSummaryFromSupabase = async (): Promise<RepoAdminSummary | null> =>
  safeSupabase("getAdminSummary", async () => {
    const startOfDayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const [totalUsers, activeSubscriptions, publishedProblems, aiUsageToday, paymentResponse] = await Promise.all([
      countRows("users"),
      countRows("subscriptions", { status: "eq.active" }),
      countRows("problems", { status: "eq.published" }),
      countRows("analytics_events", {
        event_source: "eq.ai",
        created_at: `gte.${startOfDayIso}`,
      }),
      requestSupabase<SupabasePaymentRow[]>("payments", {
        params: {
          select: "amount_paise",
          status: `in.${toInFilter(["paid", "captured"])}`,
        },
      }),
    ]);

    const totalRevenuePaise = (paymentResponse.data ?? []).reduce((sum, payment) => {
      const amount = Number(payment.amount_paise ?? 0);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    return {
      totalUsers,
      activeSubscriptions,
      publishedProblems,
      totalRevenuePaise,
      aiUsageToday,
    };
  });
