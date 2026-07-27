import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Layers3,
  MessageSquare,
  PencilLine,
  Plus,
  Power,
  RefreshCcw,
  Search,
  Users,
} from "lucide-react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Modal } from "@/components/shared/Modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type PlanOverview = {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  totalSubscribers: number;
  monthlyRevenue: number;
};

type PlanItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  maxTemplates: number;
  maxBots: number | null;
  monthlyMessageLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalSubscribers: number;
    activeSubscribers: number;
    activeAccounts: number;
    monthlyRevenue: number;
  };
};

type PlanForm = {
  name: string;
  description: string;
  price: string;
  currency: string;
  maxTemplates: string;
  maxBots: string;
  monthlyMessageLimit: string;
};

const emptyForm: PlanForm = {
  name: "",
  description: "",
  price: "",
  currency: "INR",
  maxTemplates: "",
  maxBots: "",
  monthlyMessageLimit: "",
};

const toOptionalNumber = (value: string) =>
  value.trim() === "" ? null : Number(value);

const toRequiredNumber = (value: string) => Number(value || 0);

export default function PlansManagement() {
  const { toast } = useToast();
  const token = localStorage.getItem("auth_token");

  const [overview, setOverview] = useState<PlanOverview | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PlanForm>(emptyForm);
  const [editForm, setEditForm] = useState<PlanForm>(emptyForm);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);

  const fetchPlans = async (
    nextSearch = search,
    nextStatus = statusFilter,
  ) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);

    const response = await fetch(`${API_BASE}/super-admin/plans/list?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();

    if (!response.ok || json.status !== 1) {
      throw new Error(json.message || "Unable to load plans");
    }

    setOverview(json.data.overview || null);
    setItems(json.data.items || []);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      await fetchPlans();
    } catch (error) {
      toast({
        title: "Unable to load plans",
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

  const refreshWithFilters = async (
    nextSearch = search,
    nextStatus = statusFilter,
  ) => {
    try {
      setLoading(true);
      await fetchPlans(nextSearch, nextStatus);
    } catch (error) {
      toast({
        title: "Unable to refresh plans",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPayload = (form: PlanForm) => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: toRequiredNumber(form.price),
    currency: form.currency.trim() || "INR",
    maxTemplates: toRequiredNumber(form.maxTemplates),
    maxBots: toOptionalNumber(form.maxBots),
    monthlyMessageLimit: toOptionalNumber(form.monthlyMessageLimit),
  });

  const handleCreatePlan = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/super-admin/plans/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createPayload(createForm)),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to create plan");
      }

      toast({
        title: "Plan created",
        description: `${json.data.name} is now available for subscriptions.`,
      });

      setCreateForm(emptyForm);
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

  const openEditModal = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description || "",
      price: String(plan.price),
      currency: plan.currency || "INR",
      maxTemplates: String(plan.maxTemplates),
      maxBots: plan.maxBots == null ? "" : String(plan.maxBots),
      monthlyMessageLimit:
        plan.monthlyMessageLimit == null ? "" : String(plan.monthlyMessageLimit),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/super-admin/plans/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          isActive: selectedPlan.isActive,
          ...createPayload(editForm),
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to update plan");
      }

      toast({
        title: "Plan updated",
        description: `${json.data.name} pricing and limits are saved.`,
      });

      setIsEditModalOpen(false);
      await refreshWithFilters();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan: PlanItem) => {
    try {
      setBusyKey(plan.id);
      const response = await fetch(`${API_BASE}/super-admin/plans/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          isActive: !plan.isActive,
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to update plan status");
      }

      toast({
        title: plan.isActive ? "Plan disabled" : "Plan activated",
        description: `${plan.name} visibility has been updated.`,
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

  const statCards = [
    {
      label: "Total Plans",
      value: overview?.totalPlans ?? 0,
      icon: Layers3,
    },
    {
      label: "Active Plans",
      value: overview?.activePlans ?? 0,
      icon: Power,
    },
    {
      label: "Subscribers",
      value: overview?.totalSubscribers ?? 0,
      icon: Users,
    },
    {
      label: "Monthly Revenue",
      value: `INR ${Number(overview?.monthlyRevenue || 0).toLocaleString()}`,
      icon: MessageSquare,
    },
  ];

  const renderPlanForm = (
    form: PlanForm,
    setForm: Dispatch<SetStateAction<PlanForm>>,
  ) => (
    <div className="grid gap-4 py-2 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label>Plan name</Label>
        <Input
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          className="rounded-xl"
          placeholder="Growth, Scale, Enterprise..."
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          className="min-h-[110px] rounded-xl"
          placeholder="Short internal description of who this plan is for."
        />
      </div>

      <div className="space-y-2">
        <Label>Pricing</Label>
        <Input
          type="number"
          value={form.price}
          onChange={(event) =>
            setForm((current) => ({ ...current, price: event.target.value }))
          }
          className="rounded-xl"
          placeholder="1999"
        />
      </div>

      <div className="space-y-2">
        <Label>Currency</Label>
        <Input
          value={form.currency}
          onChange={(event) =>
            setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))
          }
          className="rounded-xl"
          placeholder="INR"
        />
      </div>

      <div className="space-y-2">
        <Label>Template limit</Label>
        <Input
          type="number"
          value={form.maxTemplates}
          onChange={(event) =>
            setForm((current) => ({ ...current, maxTemplates: event.target.value }))
          }
          className="rounded-xl"
          placeholder="25"
        />
      </div>

      <div className="space-y-2">
        <Label>Bot limit</Label>
        <Input
          type="number"
          value={form.maxBots}
          onChange={(event) =>
            setForm((current) => ({ ...current, maxBots: event.target.value }))
          }
          className="rounded-xl"
          placeholder="10"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Monthly message limit</Label>
        <Input
          type="number"
          value={form.monthlyMessageLimit}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              monthlyMessageLimit: event.target.value,
            }))
          }
          className="rounded-xl"
          placeholder="50000"
        />
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">
                Master Control
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Plan Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Control every commercial plan from one place. Create new offerings,
                update pricing, and lock message, template, and bot limits.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => refreshWithFilters()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                className="rounded-xl bg-rose-500 text-white hover:bg-rose-600"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
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
                  placeholder="Search by plan name or description"
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
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => {
                    setStatusFilter("inactive");
                    refreshWithFilters(search, "inactive");
                  }}
                >
                  Inactive
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
              <CardTitle className="text-lg text-slate-900">Plan Catalog</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{plan.name}</p>
                          <p className="text-xs text-slate-500">
                            {plan.description || "No description added yet"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            plan.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">
                          <p className="font-medium">
                            {plan.currency} {Number(plan.price || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">Monthly billing</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs text-slate-600">
                          <p>Messages: {plan.monthlyMessageLimit ?? "Unlimited"}</p>
                          <p>Templates: {plan.maxTemplates}</p>
                          <p>Bots: {plan.maxBots ?? "Unlimited"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">
                          <p>{plan.stats.activeSubscribers} active</p>
                          <p className="text-xs text-slate-500">
                            {plan.stats.totalSubscribers} total
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.currency}{" "}
                        {Number(plan.stats.monthlyRevenue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => openEditModal(plan)}
                          >
                            <PencilLine className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            className={
                              plan.isActive
                                ? "rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                                : "rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            }
                            onClick={() => handleToggleStatus(plan)}
                            disabled={busyKey === plan.id}
                          >
                            {plan.isActive ? "Disable" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!loading && filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                  <Layers3 className="h-8 w-8 text-slate-400" />
                  <p className="font-medium text-slate-900">No plans found</p>
                  <p className="text-sm text-slate-500">
                    Try a different search or create the first pricing plan.
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
        title="Create plan"
        description="Define pricing and hard usage limits for the new offer."
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
              onClick={handleCreatePlan}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create plan"}
            </Button>
          </>
        }
      >
        {renderPlanForm(createForm, setCreateForm)}
      </Modal>

      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title={selectedPlan ? `Edit ${selectedPlan.name}` : "Edit plan"}
        description="Update commercial pricing and control consumption ceilings."
        size="2xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-500 text-white hover:bg-rose-600"
              onClick={handleUpdatePlan}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </>
        }
      >
        {renderPlanForm(editForm, setEditForm)}

        {selectedPlan ? (
          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Messages</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {selectedPlan.monthlyMessageLimit ?? "Unlimited"}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Templates</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {selectedPlan.maxTemplates}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bots</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {selectedPlan.maxBots ?? "Unlimited"}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
