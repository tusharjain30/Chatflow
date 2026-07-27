import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Percent,
  Power,
  Shield,
} from "lucide-react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type OverviewStats = {
  totalResellers: number;
  activeResellers: number;
  suspendedResellers: number;
  managedCustomers: number;
  averageCommissionRate: number;
};

type ResellerPreview = {
  id: string;
  companyName: string;
  firstName: string;
  lastName: string;
  commissionRate: number;
  isActive: boolean;
  stats: {
    totalCustomers: number;
    monthlyRevenue: number;
  };
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const token = localStorage.getItem("auth_token");
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [recentResellers, setRecentResellers] = useState<ResellerPreview[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsResponse, listResponse] = await Promise.all([
          fetch(`${API_BASE}/super-admin/resellers/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/super-admin/resellers/list?page=1&limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const statsJson = await statsResponse.json();
        const listJson = await listResponse.json();

        if (!statsResponse.ok || statsJson.status !== 1) {
          throw new Error(statsJson.message || "Unable to load dashboard stats");
        }

        if (!listResponse.ok || listJson.status !== 1) {
          throw new Error(listJson.message || "Unable to load reseller preview");
        }

        setOverview(statsJson.data);
        setRecentResellers(listJson.data.items || []);
      } catch (error) {
        toast({
          title: "Dashboard unavailable",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    };

    load();
  }, [toast, token]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-300">
              Super Admin
            </p>
            <h1 className="mt-3 text-3xl font-semibold">
              Keep reseller growth fast without losing control.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              This control center is focused on reseller operations first:
              onboarding, suspension, commission management, and portfolio visibility.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild className="rounded-xl bg-rose-500 text-white hover:bg-rose-600">
                <Link to="/admin/resellers">
                  Open Reseller Management
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Total Resellers", value: overview?.totalResellers ?? 0, icon: Building2 },
              { label: "Active", value: overview?.activeResellers ?? 0, icon: Power },
              { label: "Suspended", value: overview?.suspendedResellers ?? 0, icon: Shield },
              { label: "Managed Customers", value: overview?.managedCustomers ?? 0, icon: BarChart3 },
              {
                label: "Avg Commission",
                value: `${overview?.averageCommissionRate ?? 0}%`,
                icon: Percent,
              },
            ].map((card) => (
              <Card key={card.label} className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">{card.label}</CardTitle>
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-500">
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-900">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Newest Resellers</CardTitle>
                  <CardDescription>Recent partners added to the platform.</CardDescription>
                </div>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/admin/resellers">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentResellers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-medium text-slate-900">{item.companyName}</p>
                      <p className="text-sm text-slate-500">
                        {item.firstName} {item.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}>
                        {item.isActive ? "Active" : "Suspended"}
                      </Badge>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.stats.totalCustomers} customers • {item.commissionRate}% commission
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Priority Actions</CardTitle>
                <CardDescription>Most important super-admin tasks right now.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    title: "Create reseller",
                    description: "Onboard a new partner with owner credentials and a commission rate.",
                    to: "/admin/resellers",
                  },
                  {
                    title: "Suspend risky reseller",
                    description: "Pause partner access quickly if misuse or billing issues appear.",
                    to: "/admin/resellers",
                  },
                  {
                    title: "Rebalance commission",
                    description: "Adjust payout percentages based on performance or agreements.",
                    to: "/admin/resellers",
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    to={item.to}
                    className="block rounded-2xl border border-slate-200 p-4 transition hover:border-rose-300 hover:bg-rose-50/60"
                  >
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
