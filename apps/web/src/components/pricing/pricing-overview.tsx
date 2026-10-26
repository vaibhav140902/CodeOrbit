"use client";

import type { BillingSummary, PaidBillingPlanId } from "@codeorbit/schema";
import { BRAND } from "@codeorbit/ui";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PRICING_PLANS } from "@/data/pricing-plans";
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
  planName: "Free",
  status: "inactive",
  premiumActive: false,
  validUntilIso: null,
};

const loadRazorpayCheckout = async (): Promise<boolean> => {
  if ((window as Window & { Razorpay?: RazorpayConstructor }).Razorpay) {
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
  if (!value) {
    return "Free plan";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function PricingOverview() {
  const router = useRouter();
  const { authEnabled, user } = usePlatformAuth();
  const [summary, setSummary] = useState<BillingSummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const requireSignedInWorkspace = (intent: "free" | "paid") => {
    setNotice(
      intent === "free"
        ? "Create a workspace to save your readiness baseline, activity, and free-plan progress."
        : "Secure checkout starts after you sign in, so billing is tied to the right workspace."
    );
    setErrorMessage(null);
  };

  const refreshSummary = async () => {
    if (!authEnabled || !user) {
      setSummary(defaultSummary);
      return;
    }

    const response = await platformApi.getBillingSummary();
    setSummary(response);
  };

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
          setErrorMessage("Billing status is unavailable in this environment right now.");
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
      requireSignedInWorkspace("paid");
      return;
    }

    setActivePlan(planId);
    setErrorMessage(null);
    setNotice(null);

    try {
      const sdkLoaded = await loadRazorpayCheckout();
      if (!sdkLoaded) {
        throw new Error("Razorpay checkout SDK failed to load.");
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
        description: `${order.planName} subscription`,
        order_id: order.orderId,
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#0ea5e9",
        },
        handler: async (response: RazorpayResponse) => {
          const paymentId = response.razorpay_payment_id;
          const orderId = response.razorpay_order_id;
          const signature = response.razorpay_signature;

          if (!paymentId || !orderId || !signature) {
            setErrorMessage("Payment completed but verification details were incomplete.");
            return;
          }

          try {
            await platformApi.verifyBillingPayment({
              orderId,
              paymentId,
              signature,
            });
            await refreshSummary();
            setNotice("Paid access activated successfully.");
          } catch (verificationError) {
            console.error("Payment verification failed:", verificationError);
            setErrorMessage("Payment was captured, but verification failed. Please retry or contact support.");
          }
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout failed:", error);
      setErrorMessage(
        (error as { message?: string })?.message ||
          "Checkout failed. Add Razorpay keys and Functions config to continue."
      );
    } finally {
      setActivePlan(null);
    }
  };

  return (
    <section className="surface-card p-6 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Secure checkout</p>
          <h2 className="mt-2 text-3xl font-bold">Upgrade inside the authenticated workspace.</h2>
          <p className="text-muted mt-2 max-w-2xl text-sm sm:text-base">
            Signed-in users can activate Pro or Interview Sprint through the secure billing flow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="surface-soft p-3">
            <p className="text-muted text-xs uppercase">Current Plan</p>
            <p className="text-lg font-semibold">{summary.planName}</p>
          </div>
          <div className="surface-soft p-3">
            <p className="text-muted text-xs uppercase">Access Level</p>
            <p className="text-lg font-semibold">{summary.premiumActive ? "Paid access" : "Free"}</p>
          </div>
          <div className="surface-soft p-3">
            <p className="text-muted text-xs uppercase">Valid Until</p>
            <p className="text-sm font-semibold">{formatValidity(summary.validUntilIso)}</p>
          </div>
        </div>
      </div>

      {loading && <div className="mt-6 surface-soft p-4 text-sm text-muted">Loading secure billing status...</div>}

      {errorMessage && (
        <div className="mt-6 surface-soft border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          {errorMessage}
        </div>
      )}

      {notice && (
        <div className="mt-6 surface-soft border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          const isActive = activePlan === plan.id;
          const isCurrent = summary.planId === plan.id && (plan.id === "free" || summary.status === "active");
          const actionLabel = plan.paid ? (isActive ? "Processing..." : plan.cta) : user ? "Continue on Free" : "Create Free Workspace";

          return (
            <article
              key={plan.id}
              className={`surface-soft p-5 sm:p-6 ${plan.recommended ? "border-[color:var(--accent)]" : ""}`}
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold">{plan.title}</h3>
                  <p className="text-muted text-sm">{plan.cadence}</p>
                </div>
                {plan.highlight ? (
                  <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs text-soft">
                    {plan.highlight}
                  </span>
                ) : null}
              </div>

              <p className="mb-4 text-3xl font-bold">{plan.priceLabel}</p>

              <div className="mb-5 space-y-2">
                {plan.features.map((feature) => (
                  <p key={feature} className="text-sm text-soft">
                    - {feature}
                  </p>
                ))}
              </div>

              {isCurrent ? (
                <button disabled={true} className="btn-secondary w-full cursor-not-allowed opacity-70">
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!plan.paid) {
                      if (!user) {
                        requireSignedInWorkspace("free");
                        return;
                      }
                      router.push("/problems");
                      return;
                    }
                    void handlePaidCheckout(plan.id as PaidBillingPlanId);
                  }}
                  disabled={Boolean(isActive)}
                  className={plan.recommended ? "btn-primary w-full" : "btn-secondary w-full"}
                >
                  {actionLabel}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
