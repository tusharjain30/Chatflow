import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResellerSettingsProfile } from "../ResellerSettings";

export default function CommissionTab({
  profile,
  earnings,
  onSave,
  saving,
  loading,
}: {
  profile: ResellerSettingsProfile | null;
  earnings: {
    monthlyRecurringRevenue: number;
    monthlyCommission: number;
    commissionRate: number;
    totalCustomers: number;
  } | null;
  onSave: (payload: Partial<ResellerSettingsProfile>) => Promise<void>;
  saving: boolean;
  loading: boolean;
}) {
  const [commissionRate, setCommissionRate] = useState("0");

  useEffect(() => {
    setCommissionRate(String(profile?.commissionRate ?? 0));
  }, [profile?.commissionRate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Commission Settings</h2>
          <p className="text-sm text-gray-500">
            Set the default margin that drives reseller profit calculations.
          </p>
        </div>
        <Button
          className="rounded-xl bg-[#16A249] px-5 text-white hover:bg-[#12813a]"
          onClick={() => onSave({ commissionRate: Number(commissionRate) })}
          disabled={saving || loading}
        >
          {saving ? "Saving..." : "Save Commission"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-2 rounded-2xl border bg-white p-6 shadow-sm">
          <Label>Default Commission (%)</Label>
          <Input
            value={commissionRate}
            onChange={(event) => setCommissionRate(event.target.value)}
            className="border bg-gray-50 focus:border-[#16A249]"
          />
          <p className="text-xs text-gray-500">
            This rate is used across billing, revenue, and plan profitability.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Current rate",
              value: `${earnings?.commissionRate ?? profile?.commissionRate ?? 0}%`,
            },
            {
              label: "Monthly commission",
              value: `INR ${Number(earnings?.monthlyCommission ?? 0).toLocaleString("en-IN")}`,
            },
            {
              label: "Managed customers",
              value: Number(earnings?.totalCustomers ?? 0).toLocaleString("en-IN"),
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border bg-gray-50 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
