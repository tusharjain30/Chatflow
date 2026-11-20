import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  Megaphone,
  MessageSquare,
  Percent,
  Users,
  Wallet,
} from "lucide-react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Header } from "@/components/dashboard/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type AnalyticsData = {
  summary: {
    totalResellers: number;
    activeResellers: number;
    suspendedResellers: number;
    totalAccounts: number;
    activeAccounts: number;
    totalUsers: number;
    activePlans: number;
    monthlyRevenue: number;
    commissionPaid: number;
  };
  messages: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    read: number;
  };
  campaigns: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    paused: number;
    draft: number;
  };
  revenueTrend: Array<{
    label: string;
    revenue: number;
    subscriptions: number;
  }>;
};

export default function AnalyticsReports() {
  const { toast } = useToast();
  const token = getAuthToken();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/super-admin/overview/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to load analytics");
        }
        setData(json.data);
      } catch (error) {
        toast({
          title: "Analytics unavailable",
          description:
            error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast, token]);

  const summary = data?.summary;
  const maxRevenue = Math.max(
    ...(data?.revenueTrend.map((item) => item.revenue) || [0]),
    1,
  );

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full">
        <Header
          title="Analytics & Reports"
          subtitle="Platform-wide performance, messaging, and revenue"
        />

        <div className="flex-1 p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Active Resellers",
                  value: summary?.activeResellers ?? 0,
                  hint: `${summary?.totalResellers ?? 0} total`,
                  icon: Building2,
                },
                {
                  label: "Customer Accounts",
                  value: summary?.activeAccounts ?? 0,
                  hint: `${summary?.totalAccounts ?? 0} total`,
                  icon: Users,
                },
                {
                  label: "MRR",
                  value: `INR ${(summary?.monthlyRevenue ?? 0).toLocaleString()}`,
                  hint: `${summary?.activePlans ?? 0} active plans`,
                  icon: Wallet,
                },
                {
                  label: "Commission Accrued",
                  value: `INR ${(summary?.commissionPaid ?? 0).toLocaleString()}`,
                  hint: "From active subscriptions",
                  icon: Percent,
                },
              ].map((card) => (
                <Card key={card.label} className="border-slate-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">
                      {card.label}
                    </CardTitle>
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <card.icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-slate-900">
                      {loading ? "—" : card.value}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Revenue trend
                  </CardTitle>
                  <CardDescription>
                    Subscription starts by month (last 6 months)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.revenueTrend || []).map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {item.label}
                        </span>
                        <span className="text-slate-500">
                          INR {item.revenue.toLocaleString()} ·{" "}
                          {item.subscriptions} subs
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${Math.max(
                              4,
                              Math.round((item.revenue / maxRevenue) * 100),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {!loading && (!data?.revenueTrend || data.revenueTrend.length === 0) && (
                    <p className="text-sm text-slate-500 py-6 text-center">
                      No subscription data yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Message delivery
                  </CardTitle>
                  <CardDescription>
                    Aggregate message log status across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total", value: data?.messages.total ?? 0 },
                    { label: "Sent", value: data?.messages.sent ?? 0 },
                    { label: "Delivered", value: data?.messages.delivered ?? 0 },
                    { label: "Read", value: data?.messages.read ?? 0 },
                    { label: "Pending", value: data?.messages.pending ?? 0 },
                    { label: "Failed", value: data?.messages.failed ?? 0 },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        {loading ? "—" : item.value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Campaign status
                </CardTitle>
                <CardDescription>
                  Live campaign pipeline across all customer accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: "Total", value: data?.campaigns.total ?? 0 },
                  { label: "Running", value: data?.campaigns.running ?? 0 },
                  { label: "Completed", value: data?.campaigns.completed ?? 0 },
                  { label: "Paused", value: data?.campaigns.paused ?? 0 },
                  { label: "Draft", value: data?.campaigns.draft ?? 0 },
                  { label: "Failed", value: data?.campaigns.failed ?? 0 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {loading ? "—" : item.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
