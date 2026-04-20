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
          <Card className="bg-white border shadow-sm rounded-2xl hover:shadow-md transition-all">
            {/* HEADER */}
            <CardHeader className="border-b bg-gray-50 rounded-t-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <CreditCard className="h-5 w-5 text-[#16A249]" />
                    {plan.name}
                  </CardTitle>

                  <p className="mt-2 text-sm text-gray-500 max-w-md">
                    {plan.description ||
                      "Reseller-ready plan for managed customer accounts."}
                  </p>
                </div>

                {/* STATUS */}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    plan.isActive
                      ? "bg-green-50 text-[#16A249] border border-green-200"
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </CardHeader>

            {/* CONTENT */}
            <CardContent className="space-y-6 pt-6">
              {/* PRICE + STATS */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-500">Monthly price</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {plan.currency} {plan.price.toLocaleString()}
                  </p>
                </div>

                <div className="text-right text-sm">
                  <p className="text-gray-600">
                    {plan.stats.activeCustomers} active customers
                  </p>
                  <p className="text-[#16A249] font-medium">
                    {plan.currency} {plan.stats.monthlyRevenue.toLocaleString()}{" "}
                    MRR
                  </p>
                </div>
              </div>

              {/* FEATURES */}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Templates", value: plan.maxTemplates },
                  { label: "Bots", value: plan.maxBots ?? "Flexible" },
                  {
                    label: "Messages",
                    value: plan.monthlyMessageLimit ?? "Open",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border bg-gray-50 p-4 text-center"
                  >
                    <p className="text-xs text-gray-500 uppercase">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* CUSTOMERS */}
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Layers3 className="h-4 w-4 text-[#16A249]" />
                  Customers on this plan
                </p>

                <div className="space-y-2">
                  {plan.customers.length ? (
                    plan.customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                      >
                        <p className="text-sm text-gray-900">
                          {customer.companyName}
                        </p>

                        <span
                          className={`text-xs font-medium ${
                            customer.isActive
                              ? "text-[#16A249]"
                              : "text-gray-400"
                          }`}
                        >
                          {customer.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
                      <p className="text-sm text-gray-500">
                        No customers on this plan yet
                      </p>
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
