import crypto from "node:crypto";
import type {
  CampusBetaWorkspace,
  CampusCohortIntervention,
  CampusCohortSnapshot,
  RecruiterBetaWorkspace,
  RecruiterCandidateReview,
  RecruiterCandidateSummary,
  RecruiterExportInput,
  RecruiterExportResponse,
  TpoBatchAnalytics,
  VerifiedProofBadge,
} from "@codeorbit/schema";
import { recordDpdpConsent } from "./platform-data.ts";

const PROOF_SECRET = process.env.PROOF_BADGE_SALT || "codeorbit_national_proof_secret_salt_2026";

// -----------------------------------------------------------------------------
// Cryptographic Proof Badge Engine
// -----------------------------------------------------------------------------

export const generateCandidateProofBadge = ({
  candidateHandle,
  fullName,
  overallReadiness,
  proctorTrustScore,
  solvesCount,
  contestsParticipated,
  skillsVerified,
}: {
  candidateHandle: string;
  fullName: string;
  overallReadiness: number;
  proctorTrustScore: number;
  solvesCount: number;
  contestsParticipated: number;
  skillsVerified: string[];
}): VerifiedProofBadge => {
  const verifiedAtIso = new Date().toISOString();
  const payload = `${candidateHandle}:${overallReadiness}:${proctorTrustScore}:${verifiedAtIso}`;
  const verificationHash = crypto.createHmac("sha256", PROOF_SECRET).update(payload).digest("hex");

  return {
    candidateHandle,
    fullName,
    verificationHash,
    verifiedAtIso,
    overallReadiness,
    proctorTrustScore,
    solvesCount,
    contestsParticipated,
    issuer: "CodeOrbit Verified National Placement Authority",
    skillsVerified,
  };
};

export const verifyProofBadgeIntegrity = (badge: VerifiedProofBadge): boolean => {
  const payload = `${badge.candidateHandle}:${badge.overallReadiness}:${badge.proctorTrustScore}:${badge.verifiedAtIso}`;
  const expectedHash = crypto.createHmac("sha256", PROOF_SECRET).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(badge.verificationHash), Buffer.from(expectedHash));
};

// -----------------------------------------------------------------------------
// TPO Batch Placement Analytics Engine
// -----------------------------------------------------------------------------

export const SAMPLE_TPO_BATCH_ANALYTICS: TpoBatchAnalytics = {
  cohortId: "nit-trichy-cse-2026",
  collegeName: "National Institute of Technology (NIT), Trichy",
  batchYear: 2026,
  totalStudents: 140,
  verifiedStudents: 112,
  readinessTiers: {
    dayOneFaangReady: 28,      // 20%
    strongCampusShortlist: 54, // 38.5%
    borderlineOaScreen: 42,    // 30%
    needsOverhaul: 16,         // 11.5%
  },
  companyOaClearancePredictions: [
    {
      company: "TCS Digital / Ninja",
      estimatedClearanceRatePercent: 88,
      predictedShortlistsCount: 123,
    },
    {
      company: "Infosys Specialist Programmer (SP)",
      estimatedClearanceRatePercent: 71,
      predictedShortlistsCount: 99,
    },
    {
      company: "Amazon SDE-1 / Intern",
      estimatedClearanceRatePercent: 48,
      predictedShortlistsCount: 67,
    },
    {
      company: "Flipkart GRiD / SDE-1",
      estimatedClearanceRatePercent: 39,
      predictedShortlistsCount: 54,
    },
    {
      company: "Google SDE-1",
      estimatedClearanceRatePercent: 24,
      predictedShortlistsCount: 33,
    },
  ],
  weakTopicHeatmap: [
    {
      topic: "Dynamic Programming (2D & State Compression)",
      batchAverageMasteryPercent: 41,
      priorityStatus: "Critical Weakness",
    },
    {
      topic: "System Design & P99 Latency SLA",
      batchAverageMasteryPercent: 46,
      priorityStatus: "Critical Weakness",
    },
    {
      topic: "Graph Traversal & Shortest Path (Dijkstra/Bellman)",
      batchAverageMasteryPercent: 58,
      priorityStatus: "Moderate",
    },
    {
      topic: "Trees & Binary Search Trees",
      batchAverageMasteryPercent: 76,
      priorityStatus: "Strong",
    },
    {
      topic: "Arrays, Two-Pointers & Sliding Window",
      batchAverageMasteryPercent: 89,
      priorityStatus: "Strong",
    },
  ],
};

export const getTpoBatchAnalyticsData = async (
  cohortId = "nit-trichy-cse-2026"
): Promise<TpoBatchAnalytics> => {
  if (cohortId === SAMPLE_TPO_BATCH_ANALYTICS.cohortId) {
    return SAMPLE_TPO_BATCH_ANALYTICS;
  }

  return {
    ...SAMPLE_TPO_BATCH_ANALYTICS,
    cohortId,
  };
};

// -----------------------------------------------------------------------------
// Campus Beta Workspace Storage
// -----------------------------------------------------------------------------

const localCampusInterventions: CampusCohortIntervention[] = [
  {
    cohortId: "nit-trichy-cse-2026",
    priorityFocus: "Mandatory 3-day Dynamic Programming and System Design boot camp before Amazon OA drive.",
    note: "TPO flagged that 42 students are borderline in DP. Scheduled peer practice on CodeOrbit.",
    updatedAtIso: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const defaultCohorts: CampusCohortSnapshot[] = [
  {
    id: "nit-trichy-cse-2026",
    cohortLabel: "NIT Trichy CSE Batch 2026",
    studentsActive: 140,
    studentsReady: 82,
    applicationsTracked: 410,
    interviewsTracked: 165,
    topWeakAreas: ["Dynamic Programming", "System Design", "Graph Traversal"],
  },
  {
    id: "vit-vellore-ece-2026",
    cohortLabel: "VIT Vellore ECE Batch 2026",
    studentsActive: 220,
    studentsReady: 94,
    applicationsTracked: 530,
    interviewsTracked: 110,
    topWeakAreas: ["Concurrency & Locking", "Binary Search", "OOPs Invariants"],
  },
];

export const getCampusBetaWorkspaceData = async (): Promise<CampusBetaWorkspace> => {
  return {
    cohorts: defaultCohorts,
    interventions: localCampusInterventions,
  };
};

export const saveCampusCohortInterventionData = async ({
  cohortId,
  priorityFocus,
  note,
}: {
  cohortId: string;
  priorityFocus: string;
  note: string;
}): Promise<CampusCohortIntervention> => {
  const intervention: CampusCohortIntervention = {
    cohortId,
    priorityFocus,
    note,
    updatedAtIso: new Date().toISOString(),
  };

  const existingIdx = localCampusInterventions.findIndex((item) => item.cohortId === cohortId);
  if (existingIdx >= 0) {
    localCampusInterventions[existingIdx] = intervention;
  } else {
    localCampusInterventions.push(intervention);
  }

  return intervention;
};

// -----------------------------------------------------------------------------
// Recruiter Beta Workspace & Candidate Shortlist
// -----------------------------------------------------------------------------

const sampleCandidates: RecruiterCandidateSummary[] = [
  {
    handle: "aarav-sharma",
    fullName: "Aarav Sharma",
    headline: "Incoming SDE-1 @ Amazon | NIT Trichy CSE '26",
    readinessScore: 92,
    targetRoleSlugs: ["sde-1", "backend-engineer"],
    targetCompanySlugs: ["amazon", "flipkart"],
    interviewMomentum: "rising",
    proofProfileShared: true,
    dpdpConsentGranted: true,
    proctorScore: 98,
    verifiedBadge: generateCandidateProofBadge({
      candidateHandle: "aarav-sharma",
      fullName: "Aarav Sharma",
      overallReadiness: 92,
      proctorTrustScore: 98,
      solvesCount: 420,
      contestsParticipated: 14,
      skillsVerified: ["Data Structures", "Algorithms", "Kafka", "AWS", "Java"],
    }),
  },
  {
    handle: "priya-patel",
    fullName: "Priya Patel",
    headline: "Competitive Programmer (Codeforces 1850) | IIT BHU '26",
    readinessScore: 89,
    targetRoleSlugs: ["sde-1", "algorithms-engineer"],
    targetCompanySlugs: ["google", "microsoft"],
    interviewMomentum: "rising",
    proofProfileShared: true,
    dpdpConsentGranted: true,
    proctorScore: 96,
    verifiedBadge: generateCandidateProofBadge({
      candidateHandle: "priya-patel",
      fullName: "Priya Patel",
      overallReadiness: 89,
      proctorTrustScore: 96,
      solvesCount: 580,
      contestsParticipated: 22,
      skillsVerified: ["C++", "Dynamic Programming", "Graph Theory", "Invariants"],
    }),
  },
  {
    handle: "rohit-verma",
    fullName: "Rohit Verma",
    headline: "Full Stack Engineer | Distributed Systems & Go | BITS Pilani '26",
    readinessScore: 81,
    targetRoleSlugs: ["full-stack", "backend-engineer"],
    targetCompanySlugs: ["flipkart", "swiggy", "razorpay"],
    interviewMomentum: "steady",
    proofProfileShared: true,
    dpdpConsentGranted: true,
    proctorScore: 94,
    verifiedBadge: generateCandidateProofBadge({
      candidateHandle: "rohit-verma",
      fullName: "Rohit Verma",
      overallReadiness: 81,
      proctorTrustScore: 94,
      solvesCount: 310,
      contestsParticipated: 8,
      skillsVerified: ["Go", "Redis", "PostgreSQL", "Microservices", "Docker"],
    }),
  },
  {
    handle: "ananya-deshmukh",
    fullName: "Ananya Deshmukh",
    headline: "CS Undergrad | TCS Digital Candidate | Pune University '26",
    readinessScore: 74,
    targetRoleSlugs: ["software-engineer"],
    targetCompanySlugs: ["tcs", "infosys"],
    interviewMomentum: "steady",
    proofProfileShared: true,
    dpdpConsentGranted: false, // Explicitly no consent granted for testing DPDP filter!
    proctorScore: 90,
  },
];

const localRecruiterReviews: RecruiterCandidateReview[] = [
  {
    candidateHandle: "aarav-sharma",
    status: "shortlisted",
    note: "Exceptional system design and Kafka latency explanation. Scheduled for Day-1 Onsite.",
    updatedAtIso: new Date().toISOString(),
  },
];

export const getRecruiterBetaWorkspaceData = async (): Promise<RecruiterBetaWorkspace> => {
  return {
    candidates: sampleCandidates,
    reviews: localRecruiterReviews,
  };
};

export const saveRecruiterCandidateReviewData = async ({
  candidateHandle,
  status,
  note,
}: {
  candidateHandle: string;
  status: RecruiterCandidateReview["status"];
  note: string;
}): Promise<RecruiterCandidateReview> => {
  const review: RecruiterCandidateReview = {
    candidateHandle,
    status,
    note,
    updatedAtIso: new Date().toISOString(),
  };

  const existingIdx = localRecruiterReviews.findIndex((r) => r.candidateHandle === candidateHandle);
  if (existingIdx >= 0) {
    localRecruiterReviews[existingIdx] = review;
  } else {
    localRecruiterReviews.push(review);
  }

  return review;
};

// -----------------------------------------------------------------------------
// DPDP-Compliant Recruiter Candidate Export
// -----------------------------------------------------------------------------

export const exportRecruiterCandidatesWithDpdp = async (
  input: RecruiterExportInput,
  viewerEmail = "recruiter@codeorbit.app"
): Promise<RecruiterExportResponse> => {
  const allowedCandidates: RecruiterCandidateSummary[] = [];
  let blockedCount = 0;

  for (const handle of input.candidateHandles) {
    const candidate = sampleCandidates.find((c) => c.handle === handle);
    if (!candidate) continue;

    // Strict DPDP compliance check: candidate MUST have explicit recruiter_sharing consent
    if (candidate.dpdpConsentGranted) {
      allowedCandidates.push(candidate);
    } else {
      blockedCount++;
    }
  }

  const dpdpAuditRef = `DPDP-EXP-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  // Log audit trail for data fiduciary compliance
  void recordDpdpConsent(
    {
      consentVersion: "2026.1",
      isUnder18: false,
      purposesAccepted: [`recruiter_export_${input.format}`, "campus_placement_hiring"],
    },
    { email: viewerEmail, uid: viewerEmail },
    "127.0.0.1"
  );

  if (input.format === "csv") {
    const headers = [
      "Handle",
      "Full Name",
      "Readiness Score",
      "Proctor Trust Score",
      "Target Roles",
      "Target Companies",
      "Verified Hash",
    ];
    const rows = allowedCandidates.map((c) => [
      c.handle,
      `"${c.fullName}"`,
      c.readinessScore,
      c.proctorScore ?? 90,
      `"${c.targetRoleSlugs.join(", ")}"`,
      `"${c.targetCompanySlugs.join(", ")}"`,
      c.verifiedBadge?.verificationHash ?? "Unverified",
    ]);

    const csvData = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return {
      exportedCount: allowedCandidates.length,
      blockedCount,
      csvData,
      dpdpAuditRef,
    };
  }

  const jsonData = allowedCandidates.map((c) => ({
    handle: c.handle,
    fullName: c.fullName,
    headline: c.headline,
    readinessScore: c.readinessScore,
    proctorScore: c.proctorScore,
    verifiedBadge: c.verifiedBadge,
    targetRoleSlugs: c.targetRoleSlugs,
    targetCompanySlugs: c.targetCompanySlugs,
  }));

  return {
    exportedCount: allowedCandidates.length,
    blockedCount,
    jsonData,
    dpdpAuditRef,
  };
};
