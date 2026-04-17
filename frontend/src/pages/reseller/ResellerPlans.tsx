import { useEffect, useState } from "react";
import { CreditCard, Layers3 } from "lucide-react";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  maxTemplates: number;
  maxBots: number | null;
  monthlyMessageLimit: number | null;
  isActive: boolean;
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    monthlyRevenue: number;
  };
  customers: Array<{
    id: string;
    companyName: string;
    isActive: boolean;
  }>;
};

export default function ResellerPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      const response = await fetch(`${API_BASE}/reseller/plans`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const json = await response.json();
      if (response.ok && json.status === 1) {
        setPlans(json.data);
      }
    };

    fetchPlans();
  }, []);

  return (
    <ResellerShell title="Plan catalogue" eyebrow="Commercial Offers">
      <div className="grid gap-6 xl:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className="border-white/10 bg-slate-900/80 text-slate-100">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-cyan-300" />
                    {plan.name}
                  </CardTitle>
                  <p className="mt-2 text-sm text-slate-400">
                    {plan.description || "Reseller-ready plan for managed customer accounts."}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    plan.isActive
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-slate-400/15 text-slate-300"
                  }`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-400">Monthly price</p>
                  <p className="text-3xl font-semibold">
                    {plan.currency} {plan.price.toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <p>{plan.stats.activeCustomers} active customers</p>
                  <p>{plan.currency} {plan.stats.monthlyRevenue.toLocaleString()} MRR</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Templates</p>
                  <p className="mt-2 text-2xl font-semibold">{plan.maxTemplates}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Bots</p>
                  <p className="mt-2 text-2xl font-semibold">{plan.maxBots ?? "Flexible"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Messages</p>
                  <p className="mt-2 text-2xl font-semibold">{plan.monthlyMessageLimit ?? "Open"}</p>
                </div>
              </div>

              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Layers3 className="h-4 w-4 text-cyan-300" />
                  Active customers on this plan
                </p>
                <div className="space-y-2">
                  {plan.customers.length ? (
                    plan.customers.map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p>{customer.companyName}</p>
                        <span className="text-sm text-slate-400">
                          {customer.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-slate-400">
                      No active customers on this plan yet.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ResellerShell>
  );
}
