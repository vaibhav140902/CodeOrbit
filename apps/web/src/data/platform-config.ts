/**
 * CodeOrbit Single Source of Truth Configuration
 * 
 * Every metric, plan name, price, and claim must be defined here or computed
 * directly from data to prevent discrepancies across the homepage, pricing,
 * and roaster components.
 */

import { mockProblems } from "@codeorbit/ui";
import { PREP_QUESTIONS } from "./prep-catalog";

export const PLATFORM_METRICS = {
  /**
   * Verified count of interactive IDE problems with server-side Judge0 testcases.
   */
  interactiveProblemCount: mockProblems.length, // 14

  /**
   * Verified count of curriculum-aligned company track questions.
   */
  curriculumQuestionCount: PREP_QUESTIONS.length, // 38

  /**
   * Verified count of localized Indian & global hiring profiles in the Resume Roaster.
   */
  companyProfileCount: 8,

  /**
   * Core execution languages supported in the isolated Judge0 runner.
   */
  supportedLanguages: ["Python", "C++", "Java", "JavaScript"] as const,

  /**
   * Number of technical readiness dimensions evaluated.
   */
  readinessDimensionsCount: 5,
} as const;

export const COMMERCIAL_PLANS = {
  free: {
    id: "free",
    title: "Free",
    priceLabel: "₹0",
    cadence: "Free core practice",
    description: "Core DSA practice, browser IDE, and ATS resume scoring without credit card.",
    cta: "Start Free Practice",
    features: [
      `${PLATFORM_METRICS.interactiveProblemCount} interactive IDE challenges`,
      `${PLATFORM_METRICS.curriculumQuestionCount} curated company prep questions`,
      "Instant ATS resume audit & actionable scoring",
      "Public proof profile preview",
    ],
  },
  pro: {
    id: "premium-monthly",
    title: "30-Day Sprint Pass",
    priceLabel: "₹499",
    cadence: "one-time · 30 days",
    description: "Full company and role tracks, verified readiness graph, and Gemini AI mock interviews for 30 days.",
    cta: "Get Sprint Pass",
    recommended: true,
    features: [
      "All Free features included",
      "Full company tracks (Amazon, Google, TCS, Infosys, etc.)",
      "Gemini 2.5 voice & chat mock interviews",
      "Verified readiness score & shareable badge",
      "Detailed weakness diagnosis & topic mastery map",
    ],
  },
  interviewSprint: {
    id: "premium-lifetime",
    title: "4-Month Season Pass",
    priceLabel: "₹1,499",
    cadence: "one-time · 4 months",
    description: "Complete campus placement season coverage with unlimited AI mock interviews and priority checkpoints.",
    cta: "Get Season Pass",
    features: [
      "Everything in 30-Day Sprint Pass",
      "Full 120-day campus placement season access",
      "Unlimited AI mock interview sessions",
      "Priority resume overhaul & application checkpoints",
    ],
  },
} as const;

export const HONEST_MARKETING_CLAIMS = {
  heroProblemBadge: `${PLATFORM_METRICS.interactiveProblemCount} Interactive IDE Challenges · ${PLATFORM_METRICS.curriculumQuestionCount} Company Track Questions`,
  heroExecutionBadge: `Isolated Code Sandbox (${PLATFORM_METRICS.supportedLanguages.join(", ")})`,
  heroAtsBadge: "Direct Plaintext Extraction (PDF & DOCX)",
  heroAccessBadge: "Free Core Practice & ATS Scoring · Pro for AI Mocks",
  
  // Qualitative truthful statements replacing fabricated percentages
  atsScreenContext: "A large majority of campus applicants fail initial ATS screening before reaching technical coding rounds.",
  resumeDiscardContext: "Fresher tech resumes face rigorous algorithmic filtering before human review.",
  
  // Track review timestamp
  tracksLastReviewed: "Updated for 2025–2026 Campus Hiring",
} as const;
