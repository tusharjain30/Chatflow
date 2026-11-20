import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Loader2, Lock, Search } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
const PAYMENT_METHODS = [
  "Paypal",
  "Stripe",
  "Flutterwave",
  "Razorpay",
  "Pabbly Subscriptions",
] as const;

type SubscriptionData = {
  plan?: { name: string; price: number; currency: string } | null;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  account?: {
    companyName?: string | null;
    trialEndsAt?: string | null;
    isTrial?: boolean;
    lifecycleStatus?: string | null;
    creditBalance?: number;
  };
};

type Invoice = {
  id: string;
  date: string;
  organization: string;
  description: string;
  amount: number;
  currency: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function Billing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      const [subJson, historyJson] = await Promise.all([
        apiFetch("/user/account/subscription"),
        apiFetch(
          `/user/account/billing-history${
            params.toString() ? `?${params.toString()}` : ""
          }`,
        ),
      ]);
      setSubscription(subJson.data || null);
      setInvoices(historyJson.data?.invoices || []);
    } catch (error) {
      toast({
        title: "Unable to load billing",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const planLabel = useMemo(() => {
    if (subscription?.account?.isTrial) return "Trial period";
    return subscription?.plan?.name || "No active plan";
  }, [subscription]);

  const expiresLabel = useMemo(() => {
    if (subscription?.account?.isTrial && subscription.account.trialEndsAt) {
      return formatDateTime(subscription.account.trialEndsAt);
    }
    if (subscription?.endDate) return formatDateTime(subscription.endDate);
    return "—";
  }, [subscription]);

  const handleAddPayment = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast({
        title: "Validation",
        description: "Enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    if (!paymentMethod) {
      toast({
        title: "Validation",
        description: "Select a payment method",
        variant: "destructive",
      });
      return;
    }

    setSavingPayment(true);
    try {
      await apiFetch("/user/account/add-payment", {
        method: "POST",
        body: JSON.stringify({ amount: value, paymentMethod }),
      });
      toast({ title: "Payment recorded" });
      setPaymentOpen(false);
      setAmount("");
      setPaymentMethod("");
      await load();
    } catch (error) {
      toast({
        title: "Payment failed",
        description:
          error instanceof Error ? error.message : "Unable to record payment",
        variant: "destructive",
      });
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header
        title="Billing & Subscription"
        subtitle="View & manage your billing history."
      />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Billing & Subscription
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              View & manage your billing history.
            </p>
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading billing...
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-slate-500">Current Plan:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {planLabel}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500">
                      {subscription?.account?.isTrial
                        ? "Trial Expires On:"
                        : "Plan Ends On:"}
                    </span>{" "}
                    <span className="font-medium text-slate-800">
                      {expiresLabel}
                    </span>
                  </p>
                  {typeof subscription?.account?.creditBalance === "number" ? (
                    <p>
                      <span className="text-slate-500">Credit Balance:</span>{" "}
                      <span className="font-medium text-slate-800">
                        ₹{subscription.account.creditBalance.toLocaleString()}
                      </span>
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setPaymentOpen(true)}
                  >
                    Add Payment
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => navigate("/subscription")}
                  >
                    Subscribe to plan
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Invoices
                  </h2>
                  <p className="text-sm text-slate-500">
                    You can view your invoices and past billing details here
                  </p>
                </div>

                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="search billing logs."
                    className="pl-9 h-11"
                  />
                  {search !== debouncedSearch && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[280px]">
                  <div className="grid grid-cols-[1.1fr_1.2fr_1.6fr_0.8fr] gap-2 px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Date</span>
                    <span>Organization</span>
                    <span>Description</span>
                    <span>Amount</span>
                  </div>
                  {invoices.length === 0 ? (
                    <div className="py-16 text-center text-sm text-slate-500">
                      No billing logs found.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="grid grid-cols-[1.1fr_1.2fr_1.6fr_0.8fr] gap-2 px-5 py-4 text-sm"
                        >
                          <p className="text-slate-700">
                            {formatDateTime(invoice.date)}
                          </p>
                          <p className="text-slate-700 truncate">
                            {invoice.organization}
                          </p>
                          <p className="text-slate-700 truncate">
                            {invoice.description}
                          </p>
                          <p className="font-medium text-slate-900">
                            {invoice.currency === "INR" ? "₹" : ""}
                            {Number(invoice.amount).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Modal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        title="Add Payment"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Add your own custom amount</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Pay via</Label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="accent-primary"
                  />
                  {method}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleAddPayment}
              disabled={savingPayment}
            >
              {savingPayment ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Continue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
