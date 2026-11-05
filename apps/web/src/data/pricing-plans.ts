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

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    title: "Free",
    priceLabel: "₹0",
    cadence: "to start",
    highlight: "Readiness baseline",
    cta: "Start free",
    paid: false,
    features: [
      "Public company-track previews and starter problem access",
      "Readiness baseline and private activity workspace",
      "Starter resume workflow",
      "Privacy-aware profile controls",
    ],
  },
  {
    id: "premium-monthly",
    title: "30-Day Sprint Pass",
    priceLabel: "₹499",
    cadence: "one-time · 30 days",
    highlight: "Most popular for OA prep",
    cta: "Get Sprint Pass",
    paid: true,
    recommended: true,
    features: [
      "Full company and role tracks",
      "Verified readiness graph and weakness map",
      "Resume variants, exports, and proof profile",
      "Mock interviews and job workflow support",
    ],
  },
  {
    id: "premium-lifetime",
    title: "4-Month Season Pass",
    priceLabel: "₹1,499",
    cadence: "one-time · 4 months",
    highlight: "Full Placement Season",
    cta: "Get Season Pass",
    paid: true,
    features: [
      "Everything in Sprint Pass for full season (120 days)",
      "Interview-priority workflow and tighter retry loop",
      "Resume refresh and application focus",
      "Best for full campus placement drive",
    ],
  },
];

export const PAID_PRICING_PLAN_IDS: PaidBillingPlanId[] = ["premium-monthly", "premium-lifetime"];
