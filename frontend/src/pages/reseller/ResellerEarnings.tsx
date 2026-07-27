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
  const formatMoney = (value = 0, currency = "INR") =>
    `${currency} ${Number(value).toLocaleString("en-IN")}`;

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
            value: formatMoney(earnings?.walletBalance),
            icon: Wallet,
          },
          {
            label: "MRR",
            value: formatMoney(earnings?.monthlyRecurringRevenue),
            icon: ReceiptText,
          },
          {
            label: "Monthly commission",
            value: formatMoney(earnings?.monthlyCommission),
            icon: BadgePercent,
          },
          {
            label: "Commission rate",
            value: `${Number(earnings?.commissionRate ?? 0)}%`,
            icon: BadgePercent,
          },
        ].map((metric) => (
          <Card
            key={metric.label}
            className="relative rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-[#16A249]" />

            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase text-gray-500">
                {metric.label}
              </CardTitle>

              <div className="rounded-lg bg-green-50 p-2">
                <metric.icon className="h-4 w-4 text-[#16A249]" />
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-2xl border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">6 month trend</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {earnings?.trend?.map((item) => (
              <div key={item.month} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <p className="font-medium text-gray-700">{item.month}</p>
                  <p className="text-[#16A249]">{formatMoney(item.commission)}</p>
                </div>

                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-[#16A249]"
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

                <p className="text-xs text-gray-500">{formatMoney(item.revenue)} revenue</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent payouts</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {earnings?.payouts?.length ? (
              earnings.payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-3 transition hover:bg-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {payout.companyName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payout.planName} |{" "}
                      {new Date(payout.startDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatMoney(payout.amount, payout.currency)}
                    </p>
                    <p className="text-xs text-[#16A249]">
                      +{formatMoney(payout.commission, payout.currency)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
                <p className="text-sm text-gray-500">No payouts yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResellerShell>
  );
}
