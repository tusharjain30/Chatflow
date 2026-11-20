import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Download,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
} from "lucide-react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Header } from "@/components/dashboard/Header";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken, setAuthToken } from "@/utils/authStorage";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const OWNER_URL =
  import.meta.env.VITE_OWNER_URL || "http://localhost:8080/login";

type TenantItem = {
  id: string;
  organization: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  email: string | null;
  plan: { id: string; name: string; price: number; currency: string } | null;
  whatsappCount: number;
  usersCount: number;
  messagesCount: number;
  status: string;
  lifecycleStatus: string;
  isActive: boolean;
  trialEndsAt: string | null;
  createdAt: string;
};

type PlanOption = { id: string; name: string; price: number };

const statusClass: Record<string, string> = {
  Active: "bg-primary/10 text-primary",
  Trial: "bg-sky-50 text-sky-700",
  Suspended: "bg-red-50 text-red-700",
  Archived: "bg-slate-100 text-slate-700",
  Paused: "bg-amber-50 text-amber-700",
  Pending: "bg-amber-50 text-amber-700",
};

const emptyCreate = {
  companyName: "",
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerPassword: "",
  planId: "",
  lifecycleStatus: "TRIAL",
  trialDays: "14",
};

export default function TenantManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const token = getAuthToken("admin");

  const [items, setItems] = useState<TenantItem[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    trial: 0,
    suspended: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [planModal, setPlanModal] = useState<{
    open: boolean;
    tenant: TenantItem | null;
    planId: string;
  }>({ open: false, tenant: null, planId: "" });
  const [trialModal, setTrialModal] = useState<{
    open: boolean;
    tenant: TenantItem | null;
    days: string;
  }>({ open: false, tenant: null, days: "7" });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        status,
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(
        `${API_BASE}/super-admin/tenants?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to load tenants");
      }
      setItems(json.data.items || []);
      setSummary(json.data.summary || summary);
      setTotalPages(json.data.meta?.totalPages || 1);
    } catch (error) {
      toast({
        title: "Unable to load tenants",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, toast, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/super-admin/plans/list?page=1&limit=100`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (res.ok && json.status === 1) {
          setPlans(json.data.items || json.data.plans || []);
        }
      } catch {
        // optional
      }
    };
    loadPlans();
  }, [token]);

  const runAction = async (
    key: string,
    action: () => Promise<void>,
    success: string,
  ) => {
    try {
      setBusyKey(key);
      await action();
      toast({ title: success });
      await load();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const patchStatus = (tenant: TenantItem, action: "activate" | "suspend" | "archive") =>
    runAction(
      `${action}-${tenant.id}`,
      async () => {
        const res = await fetch(
          `${API_BASE}/super-admin/tenants/${tenant.id}/status`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action }),
          },
        );
        const json = await res.json();
        if (!res.ok || json.status !== 1) {
          throw new Error(json.message || `Unable to ${action} tenant`);
        }
      },
      `Tenant ${action}d`,
    );

  const softDelete = (tenant: TenantItem) => {
    if (!window.confirm(`Soft delete ${tenant.organization}?`)) return;
    runAction(
      `delete-${tenant.id}`,
      async () => {
        const res = await fetch(`${API_BASE}/super-admin/tenants/${tenant.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to delete tenant");
        }
      },
      "Tenant soft deleted",
    );
  };

  const resetLimits = (tenant: TenantItem) =>
    runAction(
      `limits-${tenant.id}`,
      async () => {
        const res = await fetch(
          `${API_BASE}/super-admin/tenants/${tenant.id}/reset-limits`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const json = await res.json();
        if (!res.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to reset limits");
        }
      },
      "Usage limits reset",
    );

  const impersonate = (tenant: TenantItem) =>
    runAction(
      `impersonate-${tenant.id}`,
      async () => {
        const res = await fetch(
          `${API_BASE}/super-admin/tenants/${tenant.id}/impersonate`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const json = await res.json();
        if (!res.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to impersonate");
        }
        setAuthToken("user", json.data.token);
        window.open(OWNER_URL.replace(/\/login$/, "") || "http://localhost:8080", "_blank");
      },
      "Impersonation started (audited)",
    );

  const createTenant = async () => {
    await runAction(
      "create",
      async () => {
        const res = await fetch(`${API_BASE}/super-admin/tenants`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: createForm.companyName,
            ownerFirstName: createForm.ownerFirstName,
            ownerLastName: createForm.ownerLastName,
            ownerEmail: createForm.ownerEmail,
            ownerPhone: createForm.ownerPhone,
            ownerPassword: createForm.ownerPassword,
            planId: createForm.planId || null,
            lifecycleStatus: createForm.lifecycleStatus,
            trialDays: Number(createForm.trialDays || 14),
          }),
        });
        const json = await res.json();
        if (!res.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to create tenant");
        }
        setCreateOpen(false);
        setCreateForm(emptyCreate);
      },
      "Tenant created",
    );
  };

  const changePlan = async () => {
    if (!planModal.tenant || !planModal.planId) return;
    await runAction(
      `plan-${planModal.tenant.id}`,
      async () => {
        const res = await fetch(
          `${API_BASE}/super-admin/tenants/${planModal.tenant!.id}/change-plan`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ planId: planModal.planId }),
          },
        );
        const json = await res.json();
        if (!res.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to change plan");
        }
        setPlanModal({ open: false, tenant: null, planId: "" });
      },
      "Subscription plan updated",
    );
  };

  const extendTrial = async () => {
    if (!trialModal.tenant) return;
    await runAction(
      `trial-${trialModal.tenant.id}`,
      async () => {
        const res = await fetch(
          `${API_BASE}/super-admin/tenants/${trialModal.tenant!.id}/extend-trial`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ days: Number(trialModal.days || 7) }),
          },
        );
        const json = await res.json();
        if (!res.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to extend trial");
        }
        setTrialModal({ open: false, tenant: null, days: "7" });
      },
      "Trial extended",
    );
  };

  const exportCsv = () => {
    fetch(`${API_BASE}/super-admin/tenants/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Export failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tenants-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((error) => {
        toast({
          title: "Export failed",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full">
        <Header
          title="Tenants / Organizations"
          subtitle="Manage every customer organization on the platform"
        />

        <div className="flex-1 p-6">
          <div className="mx-auto max-w-[1400px] space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                { label: "Total", value: summary.total, filter: "all" },
                { label: "Active", value: summary.active, filter: "active" },
                { label: "Trial", value: summary.trial, filter: "trial" },
                {
                  label: "Suspended",
                  value: summary.suspended,
                  filter: "suspended",
                },
                {
                  label: "Archived",
                  value: summary.archived,
                  filter: "archived",
                },
              ].map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setStatus(card.filter);
                  }}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      "border-slate-200 shadow-sm transition hover:border-primary/40",
                      status === card.filter && "border-primary ring-1 ring-primary/20",
                    )}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-500">
                        {card.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{card.value}</div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            {status === "archived" ? (
              <p className="text-sm text-slate-500">
                Showing archived tenants only. These are hidden from the default
                list and can be reactivated from the row actions menu.
              </p>
            ) : null}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    placeholder="Search organization, owner, email..."
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                  />
                </div>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setPage(1);
                    setStatus(value);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create tenant
                </Button>
              </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="py-10 text-center text-slate-500">
                          Loading tenants...
                        </TableCell>
                      </TableRow>
                    ) : items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="py-16 text-center">
                          <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                          <p className="font-medium">No tenants found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">
                            <Link
                              to={`/admin/tenants/${tenant.id}`}
                              className="text-slate-900 hover:text-primary"
                            >
                              {tenant.organization}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserRound className="h-3.5 w-3.5 text-slate-400" />
                              {tenant.owner?.name || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {tenant.email || "—"}
                          </TableCell>
                          <TableCell>{tenant.plan?.name || "—"}</TableCell>
                          <TableCell>{tenant.whatsappCount}</TableCell>
                          <TableCell>{tenant.usersCount}</TableCell>
                          <TableCell>
                            {tenant.messagesCount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                statusClass[tenant.status] ||
                                  "bg-slate-100 text-slate-700",
                              )}
                            >
                              {tenant.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={Boolean(busyKey)}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/admin/tenants/${tenant.id}`)
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => impersonate(tenant)}
                                >
                                  Impersonate tenant
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    setPlanModal({
                                      open: true,
                                      tenant,
                                      planId: tenant.plan?.id || "",
                                    })
                                  }
                                >
                                  Change subscription plan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setTrialModal({
                                      open: true,
                                      tenant,
                                      days: "7",
                                    })
                                  }
                                >
                                  Extend free trial
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => resetLimits(tenant)}
                                >
                                  Reset usage limits
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {tenant.status === "Suspended" ||
                                !tenant.isActive ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      patchStatus(tenant, "activate")
                                    }
                                  >
                                    Activate tenant
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      patchStatus(tenant, "suspend")
                                    }
                                  >
                                    Suspend tenant
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    patchStatus(tenant, "archive")
                                  }
                                >
                                  Archive tenant
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => softDelete(tenant)}
                                >
                                  Delete tenant
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create tenant"
        description="Manually onboard a customer organization with an owner account."
        size="2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTenant} disabled={busyKey === "create"}>
              {busyKey === "create" ? "Creating..." : "Create tenant"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 py-2">
          {[
            ["companyName", "Organization"],
            ["ownerFirstName", "Owner first name"],
            ["ownerLastName", "Owner last name"],
            ["ownerEmail", "Owner email"],
            ["ownerPhone", "Owner phone"],
            ["ownerPassword", "Owner password"],
            ["trialDays", "Trial days"],
          ].map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                type={key === "ownerPassword" ? "password" : "text"}
                value={(createForm as any)[key]}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label>Plan (optional)</Label>
            <Select
              value={createForm.planId || "none"}
              onValueChange={(value) =>
                setCreateForm((prev) => ({
                  ...prev,
                  planId: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No plan</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>

      <Modal
        open={planModal.open}
        onOpenChange={(open) =>
          setPlanModal((prev) => ({ ...prev, open, ...(open ? {} : { tenant: null }) }))
        }
        title="Change subscription plan"
        description={planModal.tenant?.organization}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() =>
                setPlanModal({ open: false, tenant: null, planId: "" })
              }
            >
              Cancel
            </Button>
            <Button onClick={changePlan}>Save plan</Button>
          </>
        }
      >
        <div className="space-y-2 py-2">
          <Label>Plan</Label>
          <Select
            value={planModal.planId || undefined}
            onValueChange={(value) =>
              setPlanModal((prev) => ({ ...prev, planId: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Modal>

      <Modal
        open={trialModal.open}
        onOpenChange={(open) =>
          setTrialModal((prev) => ({
            ...prev,
            open,
            ...(open ? {} : { tenant: null }),
          }))
        }
        title="Extend free trial"
        description={trialModal.tenant?.organization}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() =>
                setTrialModal({ open: false, tenant: null, days: "7" })
              }
            >
              Cancel
            </Button>
            <Button onClick={extendTrial}>Extend trial</Button>
          </>
        }
      >
        <div className="space-y-2 py-2">
          <Label>Days to add</Label>
          <Input
            type="number"
            min={1}
            value={trialModal.days}
            onChange={(e) =>
              setTrialModal((prev) => ({ ...prev, days: e.target.value }))
            }
          />
        </div>
      </Modal>
    </AdminLayout>
  );
}
