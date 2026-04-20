import { useEffect, useState } from "react";
import { Download, FileText, Receipt, Wallet } from "lucide-react";

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
};

const downloadInvoice = (invoice: BillingData["invoices"][number]) => {
  const lines = [
    `Invoice: ${invoice.invoiceNumber}`,
    `Company: ${invoice.companyName}`,
    `Plan: ${invoice.planName}`,
    `Amount: ${invoice.currency} ${invoice.amount.toLocaleString()}`,
    `Profit: ${invoice.currency} ${invoice.profit.toLocaleString()}`,
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

  useEffect(() => {
    const fetchBilling = async () => {
      const response = await fetch(`${API_BASE}/reseller/billing`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const json = await response.json();
      if (response.ok && json.status === 1) {
        setBilling(json.data);
      }
    };

    fetchBilling();
  }, []);

  return (
    <ResellerShell title="Billing & transactions" eyebrow="Finance Desk">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Wallet balance",
            value: `₹ ${Number(billing?.summary.walletBalance ?? 0).toLocaleString()}`,
            icon: Wallet,
          },
          {
            label: "Recharge total",
            value: `₹ ${Number(billing?.summary.totalRecharge ?? 0).toLocaleString()}`,
            icon: Receipt,
          },
          {
            label: "Revenue",
            value: `₹ ${Number(billing?.summary.totalRevenue ?? 0).toLocaleString()}`,
            icon: FileText,
          },
          {
            label: "Profit",
            value: `₹ ${Number(billing?.summary.totalProfit ?? 0).toLocaleString()}`,
            icon: Wallet,
          },
        ].map((metric) => (
          <Card
            key={metric.label}
            className="relative rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-[#16A249]" />

            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs text-gray-500 uppercase">
                {metric.label}
              </CardTitle>

              <div className="p-2 rounded-lg bg-green-50">
                <metric.icon className="h-4 w-4 text-[#16A249]" />
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-2xl font-semibold text-gray-900">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="bg-white border shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Recharge history</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {billing?.rechargeHistory?.length ? (
              billing.rechargeHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.companyName}
                    </p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                    <p className="text-xs text-gray-400">
                      {item.reference || "No ref"} •{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-[#16A249]">
                    +{item.currency} {item.amount.toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-green-200 bg-green-50 p-10 text-center">
                {/* ICON */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <Wallet className="h-6 w-6 text-[#16A249]" />
                </div>

                {/* TITLE */}
                <p className="text-sm font-semibold text-gray-900">
                  No recharge history yet
                </p>

                {/* DESCRIPTION */}
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Once you add credits, your recharge transactions will appear
                  here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm rounded-2xl">
          {/* HEADER */}
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900">Invoices & Profit</CardTitle>

            <p className="text-xs text-gray-500">Track revenue & earnings</p>
          </CardHeader>

          <CardContent className="space-y-3">
            {billing?.invoices?.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-xl border bg-white px-4 py-4 hover:shadow-sm transition"
              >
                {/* LEFT */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {invoice.companyName}
                  </p>

                  <p className="text-xs text-gray-500">
                    {invoice.invoiceNumber} • {invoice.planName}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>
                      {new Date(invoice.issuedAt).toLocaleDateString()}
                    </span>

                    {/* STATUS BADGE */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        invoice.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-right space-y-1">
                  {/* AMOUNT */}
                  <p className="text-sm font-semibold text-gray-900">
                    {invoice.currency} {invoice.amount.toLocaleString()}
                  </p>

                  {/* PROFIT */}
                  <p className="text-xs font-medium text-[#16A249]">
                    +{invoice.currency} {invoice.profit.toLocaleString()}
                  </p>

                  {/* ACTION */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => downloadInvoice(invoice)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}

            {/* EMPTY STATE */}
            {!billing?.invoices?.length && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
                <p className="text-sm font-semibold text-gray-900">
                  No invoices yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Your billing activity will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResellerShell>
  );
}
