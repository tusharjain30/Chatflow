import { useEffect, useState } from "react";
import { BadgePercent, ReceiptText, Wallet } from "lucide-react";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Earnings = {
  commissionRate: number;
  walletBalance: number;
  monthlyRecurringRevenue: number;
  monthlyCommission: number;
  totalCustomers: number;
  trend: Array<{
    month: string;
    revenue: number;
    commission: number;
  }>;
  payouts: Array<{
    id: string;
    companyName: string;
    planName: string;
    amount: number;
    commission: number;
    currency: string;
    startDate: string;
    status: string;
  }>;
};

export default function ResellerEarnings() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      const response = await fetch(`${API_BASE}/reseller/earnings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const json = await response.json();
      if (response.ok && json.status === 1) {
        setEarnings(json.data);
      }
    };

    fetchEarnings();
  }, []);

  return (
    <ResellerShell title="Earnings & commissions" eyebrow="Revenue Desk">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Wallet balance",
            value: `INR ${Number(earnings?.walletBalance ?? 0).toLocaleString()}`,
            icon: Wallet,
          },
          {
            label: "Monthly recurring revenue",
            value: `INR ${Number(earnings?.monthlyRecurringRevenue ?? 0).toLocaleString()}`,
            icon: ReceiptText,
          },
          {
            label: "Monthly commission",
            value: `INR ${Number(earnings?.monthlyCommission ?? 0).toLocaleString()}`,
            icon: BadgePercent,
          },
          {
            label: "Commission rate",
            value: `${Number(earnings?.commissionRate ?? 0).toLocaleString()}%`,
            icon: BadgePercent,
          },
        ].map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-slate-900/80 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-slate-300">{metric.label}</CardTitle>
              <metric.icon className="h-5 w-5 text-cyan-300" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-white/10 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle>6 month trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {earnings?.trend?.map((item) => (
              <div key={item.month} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{item.month}</p>
                  <p className="text-sm text-slate-400">
                    INR {item.commission.toLocaleString()} commission
                  </p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-cyan-300"
                    style={{
                      width: `${Math.min(
                        100,
                        earnings?.monthlyRecurringRevenue
                          ? (item.revenue / earnings.monthlyRecurringRevenue) * 100
                          : 0,
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  INR {item.revenue.toLocaleString()} revenue
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle>Recent subscription payouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {earnings?.payouts?.map((payout) => (
              <div key={payout.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{payout.companyName}</p>
                    <p className="text-sm text-slate-400">
                      {payout.planName} • {new Date(payout.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {payout.currency} {payout.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-cyan-300">
                      Commission: {payout.currency} {payout.commission.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ResellerShell>
  );
}
