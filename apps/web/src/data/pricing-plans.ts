import type { BillingPlanId, PaidBillingPlanId } from "@codeorbit/schema";

export interface PricingPlan {
  id: BillingPlanId;
  title: string;
  priceLabel: string;
  cadence: string;
  highlight?: string;
  cta: string;
  recommended?: boolean;
  paid: boolean;
  features: string[];
}

export interface B2BPlan {
  id: string;
  title: string;
  priceLabel: string;
  cadence: string;
  highlight?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
}

export const STUDENT_PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    title: "Free Open DSA",
    priceLabel: "₹0",
    cadence: "Free Forever",
    highlight: "Student Baseline",
    cta: "Start Free Practice",
    paid: false,
    features: [
      "All 44 core LeetCode-grade DSA problems with 0ms Pyodide/Worker execution",
      "Instant ATS resume audit and actionable score",
      "1 Sample AI Socratic Mock Interview diagnostic round",
      "Public candidate proof profile baseline",
    ],
  },
  {
    id: "drive-booster-7d",
    title: "7-Day Drive Booster",
    priceLabel: "₹99",
    cadence: "one-time · 7 days",
    highlight: "Last-Minute OA Prep",
    cta: "Get Drive Booster",
    paid: true,
    features: [
      "Targeted company track sprint (Amazon, Google, TCS Digital)",
      "2 Proctored Online Assessment (OA) simulations",
      "1 Complete Gemini Voice/Chat Mock Interview with full scorecard",
      "Verified readiness score & shareable LinkedIn badge",
    ],
  },
  {
    id: "sprint-pass-30d",
    title: "30-Day Sprint Pass",
    priceLabel: "₹499",
    cadence: "one-time · 30 days",
    highlight: "Most Popular for Hiring Drives",
    cta: "Get Sprint Pass",
    paid: true,
    recommended: true,
    features: [
      "Everything in Drive Booster for a full 30 days",
      "10 Proctored OA Simulations with anti-cheat telemetry",
      "5 Full Gemini AI Voice/Chat Mock Interview rounds",
      "Accredited Cryptographic Proof Badge (DPDP-Verified)",
      "Unlimited ATS Resume tailoring & LaTeX/PDF exports",
    ],
  },
  {
    id: "season-pass-120d",
    title: "4-Month Season Pass",
    priceLabel: "₹1,499",
    cadence: "one-time · 120 days (4 months)",
    highlight: "Full Campus Placement Season",
    cta: "Get Season Pass",
    paid: true,
    features: [
      "Everything in Sprint Pass across the entire college semester",
      "Up to 30 AI Voice Mock Interviews (capped at 30 sessions)",
      "Priority candidate placement in the Recruiter Talent Directory",
      "Official NAAC/NIRF aligned skill-gap audit certificate",
      "Instant commercial tax invoice with GST breakdown",
    ],
  },
  {
    id: "interview-topup-5",
    title: "5-Interview Top-Up",
    priceLabel: "₹199",
    cadence: "one-time add-on",
    highlight: "Interview Pack",
    cta: "Get Interview Pack",
    paid: true,
    features: [
      "5 Additional Gemini Voice/Chat Mock Interview sessions",
      "Detailed question-by-question scoring and defense rubrics",
      "Direct code defense against submitted problem code",
      "Requires an active Sprint or Season Pass",
    ],
  },
];

// Backwards-compatible PRICING_PLANS export mapping to primary 3 tiers
export const PRICING_PLANS: PricingPlan[] = [
  STUDENT_PRICING_PLANS[0], // Free
  {
    ...STUDENT_PRICING_PLANS[2], // 30-Day Sprint Pass
    id: "premium-monthly",
  },
  {
    ...STUDENT_PRICING_PLANS[3], // 120-Day Season Pass
    id: "premium-lifetime",
  },
];

export const PAID_PRICING_PLAN_IDS: PaidBillingPlanId[] = [
  "drive-booster-7d",
  "sprint-pass-30d",
  "season-pass-120d",
  "interview-topup-5",
  "premium-monthly",
  "premium-lifetime",
];

export const CAMPUS_PRICING_PLANS: B2BPlan[] = [
  {
    id: "campus-pilot",
    title: "Department Pilot",
    priceLabel: "₹0",
    cadence: "30-Day Trial",
    highlight: "Zero Risk",
    description: "For Head of Department or Placement Officer exploring verified student readiness.",
    features: [
      "Up to 50 students in 1 cohort batch",
      "CSV batch student onboarding with automated credentials",
      "Basic cohort readiness distribution & weak topic diagnosis",
      "Preview of NIRF Metric 5.2.1 / NAAC Criterion V audit report",
    ],
    cta: "Launch TPO Demo",
    href: "/for-campuses/demo",
  },
  {
    id: "campus-department",
    title: "Department License",
    priceLabel: "₹29,999",
    cadence: "per year · up to 200 students",
    highlight: "Most Popular for Engineering Colleges",
    description: "Complete placement readiness command center for a single department (CSE, IT, ECE).",
    features: [
      "Full coverage up to 200 enrolled students (₹199 / extra student)",
      "Live student proctoring telemetry & anti-cheat audit logs",
      "1-Click Official NAAC Criterion V & NIRF Graduation Outcomes PDF Export",
      "Automated Company OA clearance predictor (TCS, Infosys, Amazon)",
      "Dedicated institutional TPO onboarding support",
    ],
    cta: "Request Campus License",
    href: "/for-campuses",
  },
  {
    id: "campus-institution",
    title: "Full-College License",
    priceLabel: "₹74,999",
    cadence: "per year · up to 750 students",
    highlight: "Campus-Wide Rollout",
    description: "Campus-wide technical placement OS across all engineering & MCA departments.",
    features: [
      "Coverage for up to 750 students across all branches",
      "Multi-department cohort management & cross-branch leaderboards",
      "Custom company track syllabus injection & campus test scheduling",
      "Comprehensive Institutional NIRF/NAAC Accreditation Dossier",
      "Direct recruiter interview pipeline sharing",
    ],
    cta: "Contact Campus Sales",
    href: "/for-campuses",
  },
];

export const RECRUITER_PRICING_PLANS: B2BPlan[] = [
  {
    id: "recruiter-search",
    title: "Talent Discovery",
    priceLabel: "Free",
    cadence: "Unlimited Search",
    highlight: "Open Exploration",
    description: "Search, filter, and review verified student readiness percentiles without commitment.",
    features: [
      "Full talent directory search with multi-criteria filters",
      "Filter by Minimum PFI Score (0-1,000), Role Track, and Tech Stack",
      "View anonymized readiness graphs, proctor trust scores, and contest history",
      "Instant candidate count and skill distribution analytics",
    ],
    cta: "Explore Talent Directory",
    href: "/recruiter-beta",
  },
  {
    id: "recruiter-single",
    title: "Single Candidate Unlock",
    priceLabel: "₹199",
    cadence: "per unlocked profile",
    highlight: "Pay-As-You-Hire",
    description: "Ideal for startups or boutique teams hiring for a specific technical opening.",
    features: [
      "Unmask 1 verified candidate's direct email, phone, and LinkedIn",
      "Full access to candidate's submitted problem code & test execution logs",
      "Gemini AI voice interview transcript and question-by-question scoring rubric",
      "100% India DPDP Act 2023 compliance with immutable DPDP-EXP-* audit ref",
    ],
    cta: "Unlock Candidate",
    href: "/recruiter-beta",
  },
  {
    id: "recruiter-pack",
    title: "15-Unlock Pack",
    priceLabel: "₹1,999",
    cadence: "one-time pack (₹133/profile)",
    highlight: "Best Value for Fast Drives",
    description: "For active screening drives looking to interview a curated shortlist of pre-screened talent.",
    features: [
      "15 Verified candidate profile unlocks across any role track",
      "1-Click CSV/JSON export to your internal ATS (Workday, Greenhouse, Lever)",
      "Cryptographic SHA-256 proof badge validation",
      "Direct candidate interview scheduling dispatch",
    ],
    cta: "Get 15-Unlock Pack",
    href: "/recruiter-beta",
  },
  {
    id: "recruiter-agency",
    title: "Agency Unlimited Pass",
    priceLabel: "₹4,999",
    cadence: "per month",
    highlight: "High-Volume Recruiting",
    description: "For high-volume talent acquisition teams, agencies, and staffing firms.",
    features: [
      "Unlimited candidate profile unlocks for 30 days",
      "Continuous campus cohort talent pipeline updates",
      "Priority candidate outreach & bulk contact extraction",
      "Comprehensive compliance audit logs and recruiter analytics",
    ],
    cta: "Activate Agency Pass",
    href: "/for-recruiters",
  },
];
