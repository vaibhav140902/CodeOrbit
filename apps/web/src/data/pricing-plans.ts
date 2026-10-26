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
    title: "Pro",
    priceLabel: "₹1,499",
    cadence: "per month",
    highlight: "Most popular",
    cta: "Upgrade to Pro",
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
    title: "Interview Sprint",
    priceLabel: "₹4,999",
    cadence: "per sprint",
    highlight: "Focused hiring push",
    cta: "Start Sprint",
    paid: true,
    features: [
      "Everything in Pro for the sprint window",
      "Interview-priority workflow and tighter retry loop",
      "Resume refresh and application focus",
      "Best for active interview season",
    ],
  },
];

export const PAID_PRICING_PLAN_IDS: PaidBillingPlanId[] = ["premium-monthly", "premium-lifetime"];
