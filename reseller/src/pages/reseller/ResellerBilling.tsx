import { useEffect, useMemo, useState } from "react";
import { getAuthToken } from "@/utils/authStorage";
import {
  ArrowUpRight,
  Download,
  FileText,
  Receipt,
  RefreshCcw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type BillingData = {
  summary: {
    walletBalance: number;
    totalProfit: number;
    totalRevenue: number;
    totalRecharge: number;
    activeCustomers: number;
    averageRevenuePerCustomer: number;
    commissionRate: number;
  };
  rechargeHistory: Array<{
    id: string;
    companyName: string;
    amount: number;
    currency: string;
    description: string;
    reference: string | null;
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    companyName: string;
    planName: string;
    amount: number;
    currency: string;
    profit: number;
    issuedAt: string;
    status: string;
  }>;
  customerRevenue: Array<{
    accountId: string;
    companyName: string;
    isActive: boolean;
    walletBalance: number;
    planName: string;
    basePrice: number;
    resellerPrice: number;
    profit: number;
    marginPercent: number;
    currency: string;
    totalRecharge: number;
  }>;
  planPerformance: Array<{
    planId: string;
    planName: string;
    currency: string;
    customers: number;
    revenue: number;
    profit: number;
  }>;
};

const formatMoney = (amount = 0, currency = "INR") =>
  `${currency} ${Number(amount).toLocaleString()}`;

const downloadInvoice = (invoice: BillingData["invoices"][number]) => {
  const lines = [
    `Invoice: ${invoice.invoiceNumber}`,
    `Company: ${invoice.companyName}`,
    `Plan: ${invoice.planName}`,
    `Amount: ${formatMoney(invoice.amount, invoice.currency)}`,
    `Profit: ${formatMoney(invoice.profit, invoice.currency)}`,
    `Issued At: ${new Date(invoice.issuedAt).toLocaleDateString()}`,
    `Status: ${invoice.status}`,
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoice.invoiceNumber}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function ResellerBilling() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/reseller/billing`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const json = await response.json();
      if (response.ok && json.status === 1) {
        setBilling(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const topCustomers = useMemo(
    () =>
      [...(billing?.customerRevenue || [])]
        .sort((a, b) => b.resellerPrice - a.resellerPrice)
        .slice(0, 8),
    [billing?.customerRevenue],
  );

  return (
    <ResellerShell title="Billing & Revenue" eyebrow="Revenue Command Center">
      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Plans, pricing, invoices, wallet and customer-wise revenue in one place.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Current margin is {billing?.summary.commissionRate ?? 0}% on active plan pricing.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={fetchBilling}
            disabled={loading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild size="sm" className="rounded-lg bg-[#16A249] hover:bg-[#12813a]">
            <Link to="/reseller/customers">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Assign / Change Plan
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Wallet balance",
            value: formatMoney(billing?.summary.walletBalance),
            helper: "Recharge pool",
            icon: Wallet,
          },
          {
            label: "Customer revenue",
            value: formatMoney(billing?.summary.totalRevenue),
            helper: `${billing?.summary.activeCustomers ?? 0} active customers`,
            icon: TrendingUp,
          },
          {
            label: "Profit margin",
            value: formatMoney(billing?.summary.totalProfit),
            helper: `${billing?.summary.commissionRate ?? 0}% custom pricing`,
            icon: Receipt,
          },
          {
            label: "Wallet recharges",
            value: formatMoney(billing?.summary.totalRecharge),
            helper: "Total customer top-ups",
            icon: FileText,
          },
        ].map((metric) => (
          <Card
            key={metric.label}
            className="relative overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-[#16A249]" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {metric.label}
              </CardTitle>
              <div className="rounded-lg bg-green-50 p-2">
                <metric.icon className="h-4 w-4 text-[#16A249]" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-gray-900">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-gray-500">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-900">Customer-wise revenue</CardTitle>
              <p className="mt-1 text-xs text-gray-500">
                Base price, reseller price and profit per customer.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-lg">
              <Link to="/reseller/customers">Manage</Link>
            </Button>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3">Custom price</th>
                  <th className="px-4 py-3">Profit</th>
                  <th className="px-4 py-3">Wallet</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer) => (
                  <tr key={customer.accountId} className="border-b last:border-0">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{customer.companyName}</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          customer.isActive
                            ? "bg-green-50 text-[#16A249]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{customer.planName}</td>
                    <td className="px-4 py-4 text-gray-700">
                      {formatMoney(customer.basePrice, customer.currency)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900">
                      {formatMoney(customer.resellerPrice, customer.currency)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#16A249]">
                      +{formatMoney(customer.profit, customer.currency)}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {formatMoney(customer.walletBalance, customer.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!topCustomers.length && (
              <div className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
                <p className="text-sm font-semibold text-gray-900">
                  No customer revenue yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Assign plans to customers to start tracking revenue.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Plan performance</CardTitle>
            <p className="mt-1 text-xs text-gray-500">
              Which plans are driving recurring revenue.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {billing?.planPerformance?.map((plan) => (
              <div key={plan.planId} className="rounded-xl border bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{plan.planName}</p>
                    <p className="text-xs text-gray-500">{plan.customers} customers</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatMoney(plan.revenue, plan.currency)}
                    </p>
                    <p className="text-xs font-medium text-[#16A249]">
                      +{formatMoney(plan.profit, plan.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {!billing?.planPerformance?.length && (
              <div className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
                <p className="text-sm font-semibold text-gray-900">No active plan revenue</p>
                <p className="mt-1 text-xs text-gray-500">
                  Active subscriptions will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Recharge / wallet system</CardTitle>
            <p className="mt-1 text-xs text-gray-500">
              Latest customer wallet top-ups.
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            {billing?.rechargeHistory?.length ? (
              billing.rechargeHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-gray-50 px-4 py-3 transition hover:bg-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.companyName}
                    </p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                    <p className="text-xs text-gray-400">
                      {item.reference || "No ref"} | {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <p className="whitespace-nowrap text-sm font-semibold text-[#16A249]">
                    +{formatMoney(item.amount, item.currency)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
                <Wallet className="mx-auto mb-3 h-6 w-6 text-[#16A249]" />
                <p className="text-sm font-semibold text-gray-900">
                  No recharge history yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Customer wallet transactions will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-900">Invoice generation</CardTitle>
              <p className="mt-1 text-xs text-gray-500">
                Download subscription invoices with profit details.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {billing?.invoices?.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col gap-4 rounded-xl border bg-white px-4 py-4 transition hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {invoice.companyName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {invoice.invoiceNumber} | {invoice.planName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{new Date(invoice.issuedAt).toLocaleDateString()}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        invoice.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatMoney(invoice.amount, invoice.currency)}
                    </p>
                    <p className="text-xs font-medium text-[#16A249]">
                      +{formatMoney(invoice.profit, invoice.currency)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
                    onClick={() => downloadInvoice(invoice)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}

            {!billing?.invoices?.length && (
              <div className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
                <p className="text-sm font-semibold text-gray-900">No invoices yet</p>
                <p className="mt-1 text-xs text-gray-500">
                  Invoices are generated from customer subscriptions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResellerShell>
  );
}
