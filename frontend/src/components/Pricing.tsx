import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { db, functions } from "../utils/firebase";
import { PRICING_PLANS, type BillingPlanId } from "../data/pricingPlans";
import { InlineError } from "./system/InlineError";
import { SkeletonCard } from "./system/SkeletonCard";
import { BRAND } from "../config/brand";

interface DailyQuotaResponse {
  dateKey: string;
  maxDailySlots: number;
  claimedCount: number;
  slotsRemaining: number;
}

interface ClaimDailyPassResponse {
  granted: boolean;
  dateKey: string;
  maxDailySlots: number;
  claimedCount: number;
  slotsRemaining: number;
}

interface CreateBillingOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: BillingPlanId;
  planName: string;
}

interface VerifyBillingPaymentResponse {
  status: string;
  planId: string;
  validUntil: string;
}

interface SubscriptionSnapshot {
  planId?: string;
  planName?: string;
  status?: string;
  source?: string;
  validUntil?: { toDate?: () => Date };
}

const loadRazorpayCheckout = async (): Promise<boolean> => {
  if ((window as Window & { Razorpay?: unknown }).Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const toDateLabel = (value?: { toDate?: () => Date }): string => {
  if (!value || typeof value.toDate !== "function") return "Not set";
  return value.toDate().toLocaleString();
};

export const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quota, setQuota] = useState<DailyQuotaResponse | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const checkDailyFreeQuota = httpsCallable<Record<string, never>, DailyQuotaResponse>(functions, "checkDailyFreeQuota");
  const claimDailyFreePass = httpsCallable<Record<string, never>, ClaimDailyPassResponse>(functions, "claimDailyFreePass");
  const createBillingOrder = httpsCallable<{ planId: BillingPlanId }, CreateBillingOrderResponse>(functions, "createBillingOrder");
  const verifyBillingPayment = httpsCallable<{ orderId: string; paymentId: string; signature: string }, VerifyBillingPaymentResponse>(functions, "verifyBillingPayment");

  const refreshQuota = async () => {
    try {
      const snapshot = await checkDailyFreeQuota({});
      setQuota(snapshot.data);
    } catch (error) {
      console.error("Failed to load daily quota:", error);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        await refreshQuota();
      } catch (error) {
        console.error("Pricing bootstrap failed:", error);
        setErrorMessage("Failed to load pricing data.");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setSubscription(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "subscriptions", user.uid),
      (snapshot) => {
        if (!snapshot.exists()) {
          setSubscription(null);
          return;
        }
        setSubscription(snapshot.data() as SubscriptionSnapshot);
      },
      (error) => {
        console.error("Failed to watch subscription:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const currentPlanLabel = useMemo(() => {
    if (!subscription?.planName) return "No active plan";
    return `${subscription.planName} (${subscription.status ?? "active"})`;
  }, [subscription?.planName, subscription?.status]);

  const handleClaimDailyPass = async () => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    setActivePlan("daily-free");
    setErrorMessage(null);

    try {
      const result = await claimDailyFreePass({});
      await refreshQuota();
      if (!result.data.granted) {
        setErrorMessage("Daily free quota is full right now. Try again tomorrow or choose a paid plan.");
      }
    } catch (error) {
      console.error("Failed to claim daily pass:", error);
      setErrorMessage("Could not claim daily free pass right now.");
    } finally {
      setActivePlan(null);
    }
  };

  const handlePaidCheckout = async (planId: BillingPlanId) => {
    if (!user?.uid || !user.email) {
      navigate("/login");
      return;
    }

    setActivePlan(planId);
    setErrorMessage(null);

    try {
      const sdkLoaded = await loadRazorpayCheckout();
      if (!sdkLoaded) {
        throw new Error("Razorpay checkout SDK failed to load.");
      }

      const orderResult = await createBillingOrder({ planId });
      const order = orderResult.data;

      const RazorpayCtor = (window as Window & {
        Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
      }).Razorpay;

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
        handler: async (response: Record<string, string>) => {
          const paymentId = response.razorpay_payment_id;
          const orderId = response.razorpay_order_id;
          const signature = response.razorpay_signature;

          if (!paymentId || !orderId || !signature) {
            setErrorMessage("Payment completed but verification payload is incomplete.");
            return;
          }

          try {
            await verifyBillingPayment({
              orderId,
              paymentId,
              signature,
            });
            await refreshQuota();
            alert("Subscription activated successfully.");
          } catch (verificationError) {
            console.error("Payment verification failed:", verificationError);
            setErrorMessage("Payment captured, but verification failed. Contact support with your order id.");
          }
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout failed:", error);
      const message =
        (error as { message?: string })?.message ||
        "Checkout failed. Ensure Firebase Functions and Razorpay keys are configured.";
      setErrorMessage(message);
    } finally {
      setActivePlan(null);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="page-container space-y-4">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-container">
        <header className="surface-card mb-6 p-5 sm:mb-8 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Affordable Plans</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Pricing</h1>
          <p className="text-muted mt-2 max-w-2xl text-sm sm:text-base">
            Start free, then scale to paid only when you need uninterrupted high-intensity prep.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="surface-soft p-3">
              <p className="text-muted text-xs uppercase">Daily Free Slots Left</p>
              <p className="text-2xl font-bold">{quota?.slotsRemaining ?? "--"}</p>
            </div>
            <div className="surface-soft p-3">
              <p className="text-muted text-xs uppercase">Current Plan</p>
              <p className="text-lg font-semibold">{currentPlanLabel}</p>
            </div>
            <div className="surface-soft p-3">
              <p className="text-muted text-xs uppercase">Valid Until</p>
              <p className="text-sm font-semibold">{toDateLabel(subscription?.validUntil)}</p>
            </div>
          </div>
        </header>

        {errorMessage && <InlineError message={errorMessage} className="mb-6" />}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {PRICING_PLANS.map((plan) => {
            const isActive = activePlan === plan.id;
            const isCurrent = subscription?.planId === plan.id && subscription?.status === "active";
            return (
              <article
                key={plan.id}
                className={`surface-card p-5 sm:p-6 ${plan.recommended ? "ring-2 ring-[color:var(--ring)]" : ""}`}
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold">{plan.title}</h2>
                    <p className="text-muted text-sm">{plan.cadence}</p>
                  </div>
                  {plan.highlight && (
                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-400">
                      {plan.highlight}
                    </span>
                  )}
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
                  <button disabled className="btn-secondary w-full cursor-not-allowed opacity-70">
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => (plan.paid ? handlePaidCheckout(plan.id) : handleClaimDailyPass())}
                    disabled={isActive}
                    className={plan.recommended ? "btn-primary w-full" : "btn-secondary w-full"}
                  >
                    {isActive ? "Processing..." : plan.cta}
                  </button>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
};
