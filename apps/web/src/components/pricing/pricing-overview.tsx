"use client";

import type { BillingSummary, PaidBillingPlanId } from "@codeorbit/schema";
import { BRAND } from "@codeorbit/ui";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  STUDENT_PRICING_PLANS,
  CAMPUS_PRICING_PLANS,
  RECRUITER_PRICING_PLANS,
} from "@/data/pricing-plans";
import { usePlatformAuth } from "@/lib/auth-context";
import { platformApi } from "@/lib/platform-api";

type RazorpayResponse = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

const defaultSummary: BillingSummary = {
  planId: "free",
  planName: "Free Open DSA",
  status: "inactive",
  premiumActive: false,
  validUntilIso: null,
};

const loadRazorpayCheckout = async (): Promise<boolean> => {
  if (typeof window !== "undefined" && (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const formatValidity = (value: string | null) => {
  if (!value) return "Free Plan";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export function PricingOverview() {
  const router = useRouter();
  const { authEnabled, user } = usePlatformAuth();
  const [activeTab, setActiveTab] = useState<"students" | "campuses" | "recruiters">("students");
  const [summary, setSummary] = useState<BillingSummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (!authEnabled || !user) {
          if (!cancelled) {
            setSummary(defaultSummary);
            setErrorMessage(null);
          }
          return;
        }

        const response = await platformApi.getBillingSummary();
        if (!cancelled) {
          setSummary(response);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Billing summary fallback:", error);
          setSummary(defaultSummary);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authEnabled, user]);

  const handlePaidCheckout = async (planId: PaidBillingPlanId) => {
    if (!authEnabled || !user?.email) {
      router.push("/login?redirect=/pricing");
      return;
    }

    setActivePlan(planId);
    setErrorMessage(null);
    setNotice(null);

    try {
      const sdkLoaded = await loadRazorpayCheckout();
      if (!sdkLoaded) {
        throw new Error("Razorpay checkout SDK failed to load. Please verify your connection.");
      }

      const order = await platformApi.createBillingOrder(planId);
      const RazorpayCtor = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;

      if (!RazorpayCtor) {
        throw new Error("Razorpay constructor unavailable.");
      }

      const razorpay = new RazorpayCtor({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: BRAND.name,
        description: `${order.planName} (Instant UPI Access)`,
        order_id: order.orderId,
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#4f46e5",
        },
        handler: async (response: RazorpayResponse) => {
          const paymentId = response.razorpay_payment_id;
          const orderId = response.razorpay_order_id;
          const signature = response.razorpay_signature;

          if (!paymentId || !orderId || !signature) {
            setErrorMessage("Payment verification failed: missing payment signature details.");
            return;
          }

          try {
            const verification = await platformApi.verifyBillingPayment({
              planId,
              orderId,
              paymentId,
              signature,
            });

            if (verification.status === "active") {
              setNotice("Payment successful! Your pass is now active.");
              const updated = await platformApi.getBillingSummary();
              setSummary(updated);
            } else {
              setErrorMessage("Payment verification could not be confirmed. Contact support with reference: " + paymentId);
            }
          } catch {
            setErrorMessage("Payment captured, but server verification is processing. Please refresh shortly.");
          }
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout failed:", error);
      setErrorMessage((error as Error)?.message || "Checkout could not be initialized.");
    } finally {
      setActivePlan(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active User Status Strip */}
      <div className="surface-card p-5 sm:p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Active Workspace Plan</p>
            <h3 className="mt-1 text-xl font-bold text-white flex items-center gap-2">
              <span>{summary.planName}</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  summary.premiumActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {summary.premiumActive ? "Paid Pass Active" : "Free Tier"}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block">Access Status</span>
              <span className="font-semibold text-white">{summary.status === "active" ? "Active" : "Standard"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Valid Until</span>
              <span className="font-semibold text-white">{formatValidity(summary.validUntilIso)}</span>
            </div>
          </div>
        </div>

        {/* Trust Badges Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-400">
            ✓ Instant UPI Activation (GPay / PhonePe / Paytm / Cards)
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            ✓ Zero Recurring Mandates (No Auto-Renewal Trap)
          </span>
          <span className="flex items-center gap-1.5 text-indigo-400">
            ✓ Instant Commercial Tax Invoice with GST
          </span>
        </div>
      </div>

      {/* 3-Tab Audience Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/90 p-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`rounded-lg px-5 py-2.5 text-xs font-bold transition ${
              activeTab === "students"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👨‍🎓 For Students (One-Time UPI Passes)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("campuses")}
            className={`rounded-lg px-5 py-2.5 text-xs font-bold transition ${
              activeTab === "campuses"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🏛️ For Colleges & TPOs (Campus License)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recruiters")}
            className={`rounded-lg px-5 py-2.5 text-xs font-bold transition ${
              activeTab === "recruiters"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            💼 For Recruiters (Talent Directory)
          </button>
        </div>
      </div>

      {notice && (
        <div className="surface-card border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs text-emerald-300">
          {notice}
        </div>
      )}

      {errorMessage && (
        <div className="surface-card border border-rose-500/40 bg-rose-950/20 p-4 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* TAB 1: STUDENTS */}
      {activeTab === "students" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {STUDENT_PRICING_PLANS.map((plan) => {
            const isProcessing = activePlan === plan.id;
            const isCurrent = summary.planId === plan.id && (plan.id === "free" || summary.status === "active");

            return (
              <div
                key={plan.id}
                className={`surface-card p-6 flex flex-col justify-between transition-all duration-200 ${
                  plan.recommended
                    ? "border-indigo-500 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50 bg-gradient-to-b from-indigo-950/30 to-slate-900"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-white">{plan.title}</h4>
                      <p className="text-xs text-slate-400">{plan.cadence}</p>
                    </div>
                    {plan.highlight && (
                      <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                        {plan.highlight}
                      </span>
                    )}
                  </div>

                  <p className="text-3xl font-extrabold text-white mb-4 tracking-tight">{plan.priceLabel}</p>

                  <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  {isCurrent ? (
                    <button disabled className="btn-secondary w-full py-2.5 text-xs font-bold opacity-60 cursor-not-allowed">
                      Current Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        if (!plan.paid) {
                          if (!user) router.push("/signup?redirect=/problems");
                          else router.push("/problems");
                          return;
                        }
                        if (!user) {
                          router.push("/login?redirect=/pricing");
                          return;
                        }
                        void handlePaidCheckout(plan.id as PaidBillingPlanId);
                      }}
                      className={`w-full py-2.5 text-xs font-bold rounded-xl transition ${
                        plan.recommended
                          ? "btn-primary shadow-md hover:scale-[1.02]"
                          : "btn-secondary hover:border-slate-600"
                      }`}
                    >
                      {isProcessing ? "Opening Razorpay UPI..." : plan.cta}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CAMPUSES */}
      {activeTab === "campuses" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CAMPUS_PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`surface-card p-6 flex flex-col justify-between ${
                plan.highlight?.includes("Popular")
                  ? "border-indigo-500 shadow-xl shadow-indigo-950/40 bg-gradient-to-b from-indigo-950/30 to-slate-900"
                  : "border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white">{plan.title}</h4>
                    <p className="text-xs text-slate-400">{plan.cadence}</p>
                  </div>
                  {plan.highlight && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      {plan.highlight}
                    </span>
                  )}
                </div>

                <p className="text-3xl font-extrabold text-white mb-2">{plan.priceLabel}</p>
                <p className="text-xs text-slate-400 mb-4">{plan.description}</p>

                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.href}
                className="btn-primary block w-full py-2.5 text-center text-xs font-bold"
              >
                {plan.cta} →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: RECRUITERS */}
      {activeTab === "recruiters" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {RECRUITER_PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`surface-card p-5 flex flex-col justify-between ${
                plan.highlight?.includes("Best Value")
                  ? "border-cyan-500 shadow-lg shadow-cyan-950/30 bg-gradient-to-b from-cyan-950/20 to-slate-900"
                  : "border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <h4 className="text-base font-bold text-white">{plan.title}</h4>
                  {plan.highlight && (
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300">
                      {plan.highlight}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-1">{plan.cadence}</p>
                <p className="text-2xl font-extrabold text-white mb-2">{plan.priceLabel}</p>
                <p className="text-[11px] text-slate-400 mb-4">{plan.description}</p>

                <ul className="space-y-2 text-xs text-slate-300 mb-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-bold shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.href}
                className="btn-secondary block w-full py-2 text-center text-xs font-bold hover:border-slate-500"
              >
                {plan.cta} →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
