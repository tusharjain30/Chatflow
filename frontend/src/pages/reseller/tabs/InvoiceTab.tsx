import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function InvoiceTab({
  billing,
  loading,
}: {
  billing: {
    invoices: Array<{ id: string }>;
    summary: {
      totalRevenue: number;
      totalProfit: number;
      activeCustomers: number;
    };
  } | null;
  loading: boolean;
}) {
  const invoiceCount = billing?.invoices.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Invoice Settings</h2>
          <p className="text-sm text-gray-500">
            Monitor invoice volume, recurring revenue, and jump into invoice actions.
          </p>
        </div>
        <Button asChild className="rounded-xl bg-[#16A249] text-white hover:bg-[#12813a]">
          <Link to="/reseller/billing">Open Invoices</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Invoice records", value: invoiceCount },
          { label: "Revenue covered", value: `INR ${Number(billing?.summary.totalRevenue ?? 0).toLocaleString("en-IN")}` },
          { label: "Profit tracked", value: `INR ${Number(billing?.summary.totalProfit ?? 0).toLocaleString("en-IN")}` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-gray-50 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {loading ? "..." : item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-gray-900">Invoice workflow</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            "Generate invoices from active subscriptions",
            "Track invoice profit against reseller pricing",
            "Review invoice history from billing and audit pages",
          ].map((item) => (
            <div key={item} className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
