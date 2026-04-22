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
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          {/* HEADER */}
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Features</th>
              <th className="px-5 py-3">Customers</th>
              <th className="px-5 py-3">Revenue</th>
              <th className="px-5 py-3 text-center">Status</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {plans.map((plan) => (
              <tr
                key={plan.id}
                className="border-t hover:bg-gray-50 transition"
              >
                {/* PLAN NAME */}
                <td className="px-5 py-4">
                  <p className="font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-500">
                    {plan.description || "No description"}
                  </p>
                </td>

                {/* PRICE */}
                <td className="px-5 py-4 font-medium text-gray-900">
                  {plan.currency} {plan.price.toLocaleString()}
                </td>

                {/* FEATURES */}
                <td className="px-5 py-4 text-gray-700">
                  <div className="space-y-1 text-xs">
                    <p>Templates: {plan.maxTemplates}</p>
                    <p>Bots: {plan.maxBots ?? "Flexible"}</p>
                    <p>Messages: {plan.monthlyMessageLimit ?? "Open"}</p>
                  </div>
                </td>

                {/* CUSTOMERS */}
                <td className="px-5 py-4">
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsDrawerOpen(true);
                    }}
                    className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    View ({plan.stats.activeCustomers})
                  </button>
                </td>

                {/* REVENUE */}
                <td className="px-5 py-4">
                  <p className="text-gray-700 text-xs">
                    {plan.stats.activeCustomers} active
                  </p>
                  <p className="text-[#16A249] font-medium text-sm">
                    {plan.currency} {plan.stats.monthlyRevenue.toLocaleString()}
                  </p>
                </td>

                {/* STATUS */}
                <td className="px-5 py-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plan.isActive
                        ? "bg-green-50 text-[#16A249] border border-green-200"
                        : "bg-gray-100 text-gray-500 border border-gray-200"
                    }`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* DRAWER */}
        <div
          className={`fixed top-0 right-0 h-full w-[580px] bg-white border-l shadow-lg transform transition-transform duration-300 z-50 ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedPlan?.name} Customers
            </h3>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* CONTENT */}
          <div className="p-5 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
            {selectedPlan?.customers?.length ? (
              selectedPlan.customers.map((customer) => (
                <div
                  key={customer.id}
                  className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 hover:shadow-sm hover:border-gray-300 transition-all"
                >
                  {/* LEFT SIDE */}
                  <div className="flex items-center gap-3">
                    {/* AVATAR */}
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                      {customer.companyName?.charAt(0)}
                    </div>

                    {/* NAME */}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {customer.companyName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Customer ID: {customer.id.slice(0, 6)}
                      </p>
                    </div>
                  </div>

                  {/* STATUS */}
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${
                      customer.isActive
                        ? "bg-green-50 text-[#16A249] border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {customer.isActive ? "Active" : "Paused"}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-sm text-gray-500">No customers found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ResellerShell>
  );
}
