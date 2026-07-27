import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  KeyRound,
  Percent,
  Plus,
  Power,
  Search,
  Wallet,
} from "lucide-react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type OverviewStats = {
  totalResellers: number;
  activeResellers: number;
  suspendedResellers: number;
  managedCustomers: number;
  averageCommissionRate: number;
};

type ResellerItem = {
  id: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  commissionRate: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    suspendedCustomers: number;
    monthlyRevenue: number;
  };
};

type ResellerDetailStats = {
  reseller: {
    id: string;
    companyName: string;
    commissionRate: number;
    balance: number;
    isActive: boolean;
  };
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    suspendedCustomers: number;
    managedUsers: number;
    monthlyRevenue: number;
  };
};

type CreateForm = {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  commissionRate: string;
};

const initialForm: CreateForm = {
  companyName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  commissionRate: "15",
};

export default function ResellerManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const token = localStorage.getItem("auth_token");

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [items, setItems] = useState<ResellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<ResellerItem | null>(null);
  const [selectedStats, setSelectedStats] = useState<ResellerDetailStats | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [commissionRateInput, setCommissionRateInput] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const fetchOverview = async () => {
    const response = await fetch(`${API_BASE}/super-admin/resellers/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();

    if (!response.ok || json.status !== 1) {
      throw new Error(json.message || "Unable to load reseller overview");
    }

    setOverview(json.data);
  };

  const fetchResellers = async (query = search, status = statusFilter) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "50");
    if (query.trim()) params.set("search", query.trim());
    if (status !== "all") params.set("status", status);

    const response = await fetch(
      `${API_BASE}/super-admin/resellers/list?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const json = await response.json();

    if (!response.ok || json.status !== 1) {
      throw new Error(json.message || "Unable to load resellers");
    }

    setItems(json.data.items || []);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchResellers()]);
    } catch (error) {
      toast({
        title: "Unable to load reseller panel",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const filteredItems = useMemo(() => items, [items]);

  const refreshWithFilters = async (nextSearch = search, nextStatus = statusFilter) => {
    try {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchResellers(nextSearch, nextStatus)]);
    } catch (error) {
      toast({
        title: "Unable to refresh resellers",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReseller = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/super-admin/resellers/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...createForm,
          commissionRate: Number(createForm.commissionRate),
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to create reseller");
      }

      toast({
        title: "Reseller created",
        description: `${json.data.companyName} is ready for onboarding.`,
      });

      setCreateForm(initialForm);
      setIsCreateModalOpen(false);
      await refreshWithFilters();
    } catch (error) {
      toast({
        title: "Create failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: ResellerItem) => {
    try {
      setBusyKey(`status-${item.id}`);
      const response = await fetch(`${API_BASE}/super-admin/resellers/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resellerId: item.id,
          isActive: !item.isActive,
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to update reseller status");
      }

      toast({
        title: item.isActive ? "Reseller suspended" : "Reseller activated",
        description: `${item.companyName} status has been updated.`,
      });

      await refreshWithFilters();
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const loginAsReseller = async (item: ResellerItem) => {
    try {
      setBusyKey(`login-${item.id}`);
      const response = await fetch(`${API_BASE}/super-admin/tools/login-as-reseller`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resellerId: item.id,
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to login as reseller");
      }

      localStorage.setItem(
        "support_session",
        JSON.stringify({
          originToken: token,
          originPortal: "admin",
          originLabel: user?.email || "Super Admin",
          adminName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          adminEmail: user?.email,
          resellerCompanyName: json.data.supportSession?.resellerCompanyName,
        }),
      );
      localStorage.setItem("auth_token", json.data.token);
      localStorage.setItem("auth_portal", json.data.portal || "reseller");
      window.location.assign(json.data.redirectTo || "/reseller");
    } catch (error) {
      toast({
        title: "Login as reseller failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setBusyKey(null);
    }
  };

  const openCommissionModal = (item: ResellerItem) => {
    setSelectedReseller(item);
    setCommissionRateInput(String(item.commissionRate));
    setIsCommissionModalOpen(true);
  };

  const handleUpdateCommission = async () => {
    if (!selectedReseller) return;

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/super-admin/resellers/commission`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resellerId: selectedReseller.id,
          commissionRate: Number(commissionRateInput),
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to update commission");
      }

      toast({
        title: "Commission updated",
        description: `${selectedReseller.companyName} is now set to ${json.data.commissionRate}% commission.`,
      });

      setIsCommissionModalOpen(false);
      await refreshWithFilters();
    } catch (error) {
      toast({
        title: "Commission update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openStatsModal = async (item: ResellerItem) => {
    try {
      setSelectedReseller(item);
      setIsStatsModalOpen(true);
      setSelectedStats(null);

      const response = await fetch(
        `${API_BASE}/super-admin/resellers/stats?resellerId=${item.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to load reseller stats");
      }

      setSelectedStats(json.data);
    } catch (error) {
      toast({
        title: "Stats unavailable",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setIsStatsModalOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">
                Core Module
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Reseller Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Onboard new reseller partners, control commission, suspend risky
                accounts, and monitor how much portfolio each reseller manages.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => refreshWithFilters()}
              >
                Refresh
              </Button>
              <Button
                className="rounded-xl bg-rose-500 text-white hover:bg-rose-600"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Reseller
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Total Resellers",
                value: overview?.totalResellers ?? 0,
                icon: Building2,
              },
              {
                label: "Active",
                value: overview?.activeResellers ?? 0,
                icon: Power,
              },
              {
                label: "Suspended",
                value: overview?.suspendedResellers ?? 0,
                icon: Power,
              },
              {
                label: "Managed Customers",
                value: overview?.managedCustomers ?? 0,
                icon: BarChart3,
              },
              {
                label: "Avg Commission",
                value: `${overview?.averageCommissionRate ?? 0}%`,
                icon: Percent,
              },
            ].map((card) => (
              <Card key={card.label} className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {card.label}
                  </CardTitle>
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-500">
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-900">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by company, owner, email, or phone"
                  className="rounded-xl border-slate-200 pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => {
                    setStatusFilter("all");
                    refreshWithFilters(search, "all");
                  }}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => {
                    setStatusFilter("active");
                    refreshWithFilters(search, "active");
                  }}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "suspended" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => {
                    setStatusFilter("suspended");
                    refreshWithFilters(search, "suspended");
                  }}
                >
                  Suspended
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => refreshWithFilters(search, statusFilter)}
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-sm">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-lg text-slate-900">
                Reseller Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.companyName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.firstName} {item.lastName} • {item.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }
                        >
                          {item.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.commissionRate}%</TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">
                          <p>{item.stats.totalCustomers} total</p>
                          <p className="text-xs text-slate-500">
                            {item.stats.activeCustomers} active
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        INR {Number(item.stats.monthlyRevenue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        INR {Number(item.balance || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => loginAsReseller(item)}
                            disabled={busyKey === `login-${item.id}`}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Login As
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => openStatsModal(item)}
                          >
                            Stats
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => openCommissionModal(item)}
                          >
                            Commission
                          </Button>
                          <Button
                            size="sm"
                            className={
                              item.isActive
                                ? "rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                                : "rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            }
                            onClick={() => handleToggleStatus(item)}
                            disabled={busyKey === `status-${item.id}`}
                          >
                            {item.isActive ? "Suspend" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!loading && filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                  <Building2 className="h-8 w-8 text-slate-400" />
                  <p className="font-medium text-slate-900">No resellers found</p>
                  <p className="text-sm text-slate-500">
                    Adjust filters or create your first reseller account.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Create reseller"
        description="Set up a new reseller partner account with owner credentials and commission."
        size="2xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-500 text-white hover:bg-rose-600"
              onClick={handleCreateReseller}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create reseller"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 md:grid-cols-2">
          {[
            { key: "companyName", label: "Company name" },
            { key: "firstName", label: "Owner first name" },
            { key: "lastName", label: "Owner last name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "password", label: "Password", type: "password" },
            { key: "commissionRate", label: "Commission %" },
          ].map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                type={field.type || "text"}
                value={createForm[field.key as keyof CreateForm]}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                className="rounded-xl"
              />
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={isCommissionModalOpen}
        onOpenChange={setIsCommissionModalOpen}
        title="Update commission"
        description={`Change the commission rate for ${selectedReseller?.companyName || "this reseller"}.`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsCommissionModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-500 text-white hover:bg-rose-600"
              onClick={handleUpdateCommission}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save commission"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2">
          <Label>Commission percentage</Label>
          <Input
            value={commissionRateInput}
            onChange={(event) => setCommissionRateInput(event.target.value)}
            className="rounded-xl"
          />
        </div>
      </Modal>

      <Modal
        open={isStatsModalOpen}
        onOpenChange={setIsStatsModalOpen}
        title={selectedReseller ? `${selectedReseller.companyName} stats` : "Reseller stats"}
        description="A quick portfolio snapshot for this reseller."
        size="xl"
      >
        {selectedStats ? (
          <div className="grid gap-4 py-2 md:grid-cols-2">
            {[
              {
                label: "Total customers",
                value: selectedStats.stats.totalCustomers,
                icon: Building2,
              },
              {
                label: "Active customers",
                value: selectedStats.stats.activeCustomers,
                icon: Power,
              },
              {
                label: "Managed users",
                value: selectedStats.stats.managedUsers,
                icon: BarChart3,
              },
              {
                label: "Monthly revenue",
                value: `INR ${Number(selectedStats.stats.monthlyRevenue || 0).toLocaleString()}`,
                icon: Wallet,
              },
            ].map((card) => (
              <Card key={card.label} className="border border-slate-200 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {card.label}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-900">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-6 text-sm text-slate-500">Loading reseller stats...</div>
        )}
      </Modal>
    </AdminLayout>
  );
}
