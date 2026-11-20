import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info, Loader2, X } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  maxTemplates: number;
  maxBots?: number | null;
  monthlyMessageLimit?: number | null;
};

const PAYMENT_METHODS = [
  "Paypal",
  "Stripe",
  "Flutterwave",
  "Razorpay",
  "Pabbly Subscriptions",
] as const;

function planFeatures(plan: Plan) {
  const unlimitedUsers = plan.name.toLowerCase() !== "starter";
  const embeddedSignup = plan.name.toLowerCase() !== "starter";
  return [
    {
      label: `${plan.maxTemplates.toLocaleString()} Campaigns`,
      included: true,
    },
    {
      label: `${(plan.monthlyMessageLimit || 0).toLocaleString()} Messages`,
      included: true,
    },
    {
      label: `${Math.max(100, (plan.maxBots || 1) * 50).toLocaleString()} Contacts`,
      included: true,
    },
    {
      label: `${Math.max(50, plan.maxTemplates * 5).toLocaleString()} Canned replies`,
      included: true,
    },
    {
      label: unlimitedUsers ? "Unlimited Users" : "1 User",
      included: true,
    },
    { label: "Embedded Signup", included: embeddedSignup },
    { label: "AI Assistant", included: true },
    { label: "Webhooks", included: true },
    { label: "Flow builder", included: true },
    { label: "WhatsApp QR connect", included: true },
  ];
}

export default function Subscription() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch("/user/account/plans");
      const nextPlans: Plan[] = json.data?.plans || [];
      setPlans(nextPlans);
      if (nextPlans.length && !selectedPlanId) {
        setSelectedPlanId(nextPlans[nextPlans.length - 1]?.id || nextPlans[0].id);
      }
    } catch (error) {
      toast({
        title: "Unable to load plans",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || null,
    [plans, selectedPlanId],
  );

  const discount = appliedCoupon.trim().toUpperCase() === "SAVE10" ? 0.1 : 0;
  const gross = selectedPlan?.price || 0;
  const totalDue = Math.max(0, Math.round(gross * (1 - discount)));

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Validation",
        description: "Enter a coupon code",
        variant: "destructive",
      });
      return;
    }
    if (couponCode.trim().toUpperCase() === "SAVE10") {
      setAppliedCoupon(couponCode.trim());
      toast({ title: "Coupon applied", description: "10% discount applied." });
    } else {
      setAppliedCoupon("");
      toast({
        title: "Invalid coupon",
        description: "Try SAVE10 for a demo discount.",
        variant: "destructive",
      });
    }
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      toast({
        title: "Select a plan",
        description: "Choose a plan to continue",
        variant: "destructive",
      });
      return;
    }
    if (!paymentMethod) {
      toast({
        title: "Select payment method",
        description: "Choose how you want to pay",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/user/account/subscribe", {
        method: "POST",
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod,
          couponCode: appliedCoupon || undefined,
        }),
      });
      toast({
        title: "Subscription updated",
        description: `You are now on ${selectedPlan.name}.`,
      });
      navigate("/billing");
    } catch (error) {
      toast({
        title: "Subscribe failed",
        description:
          error instanceof Error ? error.message : "Unable to subscribe",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header
        title="Billing & Subscription"
        subtitle="Select the plan that you want to subscribe to."
      />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Billing & Subscription
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Select the plan that you want to subscribe to.
            </p>
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading plans...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  const selected = plan.id === selectedPlanId;
                  const features = planFeatures(plan);
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "text-left rounded-xl border bg-white p-5 transition-all",
                        selected
                          ? "border-primary shadow-sm ring-1 ring-primary/20"
                          : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">
                            {plan.name}
                          </h2>
                          <p className="text-sm text-slate-500 mt-1">
                            {plan.currency === "INR" ? "₹" : ""}
                            {plan.price.toLocaleString()} Per month
                          </p>
                        </div>
                        <span
                          className={cn(
                            "h-5 w-5 rounded border flex items-center justify-center",
                            selected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-slate-300",
                          )}
                        >
                          {selected ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {features.map((feature) => (
                          <li
                            key={feature.label}
                            className="flex items-center gap-2 text-sm text-slate-700"
                          >
                            {feature.included ? (
                              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-rose-500 shrink-0" />
                            )}
                            <span
                              className={cn(
                                !feature.included && "text-slate-400",
                              )}
                            >
                              {feature.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              <aside className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 sticky top-6">
                <h3 className="text-base font-semibold text-slate-900">
                  Summary
                </h3>
                {!selectedPlan ? (
                  <p className="text-sm text-slate-500">Select plan to continue</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800">
                        {selectedPlan.name}
                      </span>
                      <span className="text-slate-700">
                        {selectedPlan.currency === "INR" ? "₹" : ""}
                        {selectedPlan.price.toLocaleString()} / mo
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Coupon code"
                      />
                      <Button variant="outline" onClick={applyCoupon}>
                        Apply
                      </Button>
                    </div>

                    <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gross Total</span>
                        <span>₹{gross.toLocaleString()}</span>
                      </div>
                      {discount > 0 ? (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount</span>
                          <span>-₹{Math.round(gross * discount).toLocaleString()}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between font-semibold text-slate-900">
                        <span>Total due</span>
                        <span>₹{totalDue.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <p className="text-sm font-medium text-slate-800">Pay via</p>
                      {PAYMENT_METHODS.map((method) => (
                        <label
                          key={method}
                          className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="subscribe-pay"
                            checked={paymentMethod === method}
                            onChange={() => setPaymentMethod(method)}
                            className="accent-primary"
                          />
                          {method}
                        </label>
                      ))}
                    </div>

                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={!paymentMethod || submitting}
                      onClick={handleContinue}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
