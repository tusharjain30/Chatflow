import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function BillingTab({
  billing,
  earnings,
  loading,
}: {
  billing: {
    summary: {
      walletBalance: number;
      totalProfit: number;
      totalRevenue: number;
      totalRecharge: number;
      activeCustomers: number;
    };
    invoices: Array<{ id: string }>;
    rechargeHistory: Array<{ id: string }>;
  } | null;
  earnings: {
    monthlyRecurringRevenue: number;
    monthlyCommission: number;
    payouts: Array<{ id: string }>;
  } | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Billing Settings</h2>
          <p className="text-sm text-gray-500">
            Wallet, invoices, payouts, and revenue controls for reseller operations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/reseller/billing">Open Billing Page</Link>
          </Button>
          <Button asChild className="rounded-xl bg-[#16A249] text-white hover:bg-[#12813a]">
            <Link to="/reseller/audit">Open Billing History</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Wallet balance", value: billing?.summary.walletBalance ?? 0 },
          { label: "Total revenue", value: billing?.summary.totalRevenue ?? 0 },
          { label: "Total profit", value: billing?.summary.totalProfit ?? 0 },
          { label: "Monthly commission", value: earnings?.monthlyCommission ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-gray-50 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {loading ? "..." : `INR ${Number(item.value).toLocaleString("en-IN")}`}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Invoices generated",
            value: billing?.invoices.length ?? 0,
            helper: "Subscription invoice records",
          },
          {
            label: "Wallet recharges",
            value: billing?.rechargeHistory.length ?? 0,
            helper: "Recharge transactions tracked",
          },
          {
            label: "Payout records",
            value: earnings?.payouts.length ?? 0,
            helper: "Commission payout entries",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[#16A249]">{item.value}</p>
            <p className="mt-1 text-xs text-gray-500">{item.helper}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
