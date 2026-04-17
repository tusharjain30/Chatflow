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

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
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
            value: `INR ${Number(billing?.summary.walletBalance ?? 0).toLocaleString()}`,
            icon: Wallet,
          },
          {
            label: "Recharge history total",
            value: `INR ${Number(billing?.summary.totalRecharge ?? 0).toLocaleString()}`,
            icon: Receipt,
          },
          {
            label: "Invoice revenue",
            value: `INR ${Number(billing?.summary.totalRevenue ?? 0).toLocaleString()}`,
            icon: FileText,
          },
          {
            label: "Profit tracked",
            value: `INR ${Number(billing?.summary.totalProfit ?? 0).toLocaleString()}`,
            icon: Wallet,
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
            <CardTitle>Recharge history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billing?.rechargeHistory?.length ? (
              billing.rechargeHistory.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{item.companyName}</p>
                      <p className="text-sm text-slate-400">{item.description}</p>
                      <p className="text-xs text-slate-500">
                        {item.reference || "No reference"} •{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {item.currency} {item.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-slate-400">
                No recharge history yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle>Invoices & profit tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billing?.invoices?.map((invoice) => (
              <div key={invoice.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{invoice.companyName}</p>
                    <p className="text-sm text-slate-400">
                      {invoice.invoiceNumber} • {invoice.planName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Issued {new Date(invoice.issuedAt).toLocaleDateString()} • {invoice.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {invoice.currency} {invoice.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-cyan-300">
                      Profit: {invoice.currency} {invoice.profit.toLocaleString()}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
                      onClick={() => downloadInvoice(invoice)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download invoice
                    </Button>
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
