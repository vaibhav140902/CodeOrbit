export type BillingPlanId = "daily-free" | "starter-monthly" | "pro-monthly" | "pro-yearly";

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
    id: "daily-free",
    title: "Daily Free Pass",
    priceLabel: "Rs 0",
    cadence: "first 100 users/day",
    highlight: "Daily quota",
    cta: "Claim Free Pass",
    paid: false,
    features: [
      "Full coding workspace access for the current UTC day",
      "All languages and submissions included",
      "Leaderboard and activity tracking included",
      "Best for daily consistency with zero cost",
    ],
  },
  {
    id: "starter-monthly",
    title: "Starter",
    priceLabel: "Rs 149",
    cadence: "per month",
    cta: "Choose Starter",
    paid: true,
    features: [
      "Unlimited daily access",
      "Company-wise prep tracks",
      "Priority runtime retries",
      "Email support",
    ],
  },
  {
    id: "pro-monthly",
    title: "Pro",
    priceLabel: "Rs 249",
    cadence: "per month",
    highlight: "Most popular",
    cta: "Choose Pro",
    paid: true,
    recommended: true,
    features: [
      "Everything in Starter",
      "Advanced analytics and streak insights",
      "Premium company packs",
      "Early access to AI-assisted features",
    ],
  },
  {
    id: "pro-yearly",
    title: "Pro Annual",
    priceLabel: "Rs 1999",
    cadence: "per year",
    highlight: "Save 33%",
    cta: "Choose Annual",
    paid: true,
    features: [
      "Everything in Pro Monthly",
      "Lowest effective monthly pricing",
      "Priority beta access for new products",
      "One plan for full-year interview prep",
    ],
  },
];

