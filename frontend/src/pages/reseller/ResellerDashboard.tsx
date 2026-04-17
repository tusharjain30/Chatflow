import { useEffect, useState } from "react";
import {
  Activity,
  BadgePercent,
  Building2,
  MessageSquareText,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Stats = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalTeamMembers: number;
  totalSubscriptions: number;
  activePlans: number;
  totalMessages: number;
  monthlyRevenue: number;
  commissionEarned: number;
  walletBalance: number;
};

type Overview = {
  recentCustomers: Array<{
    id: string;
    companyName: string;
    isActive: boolean;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    subscription: {
      plan?: {
        name?: string;
        price?: number;
        currency?: string;
      };
    } | null;
    counts: {
      contacts: number;
      campaigns: number;
    };
  }>;
  revenueByPlan: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    customers: number;
    revenue: number;
  }>;
  revenueTrend: Array<{
    month: string;
    revenue: number;
    commission: number;
  }>;
  recentSubscriptions: Array<{
    id: string;
    companyName: string;
    planName: string;
    amount: number;
    currency: string;
  }>;
  recentMessages: Array<{
    id: string;
    to: string;
    status: string;
    direction: string;
    account: {
      companyName: string;
    };
  }>;
};

const metrics = [
  { key: "totalCustomers", label: "Total customers", icon: Building2 },
  { key: "activeCustomers", label: "Active accounts", icon: Activity },
  { key: "totalTeamMembers", label: "Team members", icon: Users },
  { key: "totalMessages", label: "Messages tracked", icon: MessageSquareText },
  { key: "monthlyRevenue", label: "Monthly revenue", icon: Wallet, currency: true },
  { key: "commissionEarned", label: "Commission earned", icon: BadgePercent, currency: true },
] as const;

export default function ResellerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("auth_token");
      const [statsResponse, overviewResponse] = await Promise.all([
        fetch(`${API_BASE}/reseller/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE}/reseller/dashboard/overview`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const statsJson = await statsResponse.json();
      const overviewJson = await overviewResponse.json();

      if (statsResponse.ok && statsJson.status === 1) {
        setStats(statsJson.data);
      }

      if (overviewResponse.ok && overviewJson.status === 1) {
        setOverview(overviewJson.data);
      }
    };

    fetchStats();
  }, []);

  return (
    <ResellerShell title="Portfolio overview" eyebrow="Reseller Command">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.key} className="border-white/10 bg-slate-900/80 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-slate-300">{metric.label}</CardTitle>
              <metric.icon className="h-5 w-5 text-cyan-300" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {metric.currency
                  ? `INR ${Number(stats?.[metric.key] ?? 0).toLocaleString()}`
                  : Number(stats?.[metric.key] ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-white/10 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle>Account mix</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Active customers", value: stats?.activeCustomers ?? 0 },
              { label: "Inactive customers", value: stats?.inactiveCustomers ?? 0 },
              { label: "Active subscriptions", value: stats?.totalSubscriptions ?? 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(56,189,248,0.16),rgba(15,23,42,0.96))] text-slate-100">
          <CardHeader>
            <CardTitle>Payout snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-300">Wallet balance</p>
              <p className="mt-2 text-3xl font-semibold">
                INR {Number(stats?.walletBalance ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">Plans currently active</p>
              <p className="mt-2 text-2xl font-semibold">{stats?.activePlans ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-300" />
              Recent customers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview?.recentCustomers?.map((customer) => (
              <div key={customer.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{customer.companyName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {customer.owner
                        ? `${customer.owner.firstName} ${customer.owner.lastName} • ${customer.owner.email}`
                        : "No owner linked"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                      <span>Contacts: {customer.counts.contacts}</span>
                      <span>Campaigns: {customer.counts.campaigns}</span>
                      <span>
                        Plan: {customer.subscription?.plan?.name || "Not assigned"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      customer.isActive
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-amber-400/15 text-amber-300"
                    }`}
                  >
                    {customer.isActive ? "Active" : "Paused"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              Revenue by plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview?.revenueByPlan?.map((plan) => (
              <div key={plan.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-slate-400">{plan.customers} customers</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {plan.currency} {plan.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-400">
                      {plan.currency} {plan.price.toLocaleString()} / month
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="border-white/10 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle>Recent subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview?.recentSubscriptions?.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="font-medium">{subscription.companyName}</p>
                  <p className="text-sm text-slate-400">{subscription.planName}</p>
                </div>
                <p className="font-semibold">
                  {subscription.currency} {subscription.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle>Recent message activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview?.recentMessages?.map((message) => (
              <div key={message.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="font-medium">{message.account.companyName}</p>
                  <p className="text-sm text-slate-400">
                    {message.direction} • {message.to}
                  </p>
                </div>
                <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-300">
                  {message.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ResellerShell>
  );
}
