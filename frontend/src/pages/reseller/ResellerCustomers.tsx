import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  CreditCard,
  MessageCircleMore,
  MessageSquareText,
  PlusCircle,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type CustomerItem = {
  id: string;
  companyName: string;
  isActive: boolean;
  creditBalance: number;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;
  subscription: {
    plan?: {
      name?: string;
      price?: number;
      currency?: string;
      monthlyMessageLimit?: number;
    };
    startDate?: string;
    endDate?: string | null;
  } | null;
  pricing: {
    basePrice: number;
    resellerPrice: number;
    profit: number;
    currency: string;
  } | null;
  usage: {
    used: number;
    limit: number;
    percentage: number;
  } | null;
  metrics: {
    messagesSentLast7Days: number;
    campaignSuccessRate: number;
    lastActivity: string | null;
  };
  subscriptionExpiryDate: string | null;
  counts: {
    users: number;
    contacts: number;
    campaigns: number;
  };
};

type PortfolioStats = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  monthlyRevenue: number;
  messagesUsedThisMonth: number;
};

type PlanOption = {
  id: string;
  name: string;
  price: number;
  currency: string;
};

type ActionType = "changePlan" | "recharge" | "team" | "message" | null;

export default function ResellerCustomers() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [filters, setFilters] = useState({
    status: "all",
    planId: "all",
    revenueMin: "",
    revenueMax: "",
    usageMin: "",
    usageMax: "",
  });
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [changePlanId, setChangePlanId] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [teamForm, setTeamForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    roleType: "CUSTOMER_AGENT",
  });
  const [messageForm, setMessageForm] = useState({
    to: "",
    message: "",
  });

  const token = localStorage.getItem("auth_token");

  const getSmartStatuses = (item: CustomerItem) => {
    const badges: Array<{ label: string; className: string }> = [];

    if (item.isActive) {
      badges.push({
        label: "Active",
        className: "bg-emerald-400/15 text-emerald-300",
      });
    } else {
      badges.push({
        label: "Paused",
        className: "bg-amber-400/15 text-amber-300",
      });
    }

    const startDate = item.subscription?.startDate
      ? new Date(item.subscription.startDate)
      : null;
    const expiryDate = item.subscriptionExpiryDate
      ? new Date(item.subscriptionExpiryDate)
      : null;
    const now = new Date();

    if (startDate) {
      const trialEndsAt = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      if (now <= trialEndsAt) {
        badges.push({
          label: "Trial",
          className: "bg-yellow-400/15 text-yellow-300",
        });
      }
    }

    if (expiryDate && expiryDate < now) {
      badges.push({
        label: "Expired",
        className: "bg-red-400/15 text-red-300",
      });
    }

    if (item.creditBalance <= 1000) {
      badges.push({
        label: "Low Balance",
        className: "bg-orange-400/15 text-orange-300",
      });
    }

    if ((item.usage?.percentage || 0) >= 80) {
      badges.push({
        label: "High Usage",
        className: "bg-sky-400/15 text-sky-300",
      });
    }

    return badges;
  };

  const fetchCustomers = async (query = "") => {
    const params = new URLSearchParams();
    params.set("limit", "20");
    if (query) params.set("search", query);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.planId !== "all") params.set("planId", filters.planId);
    if (filters.revenueMin) params.set("revenueMin", filters.revenueMin);
    if (filters.revenueMax) params.set("revenueMax", filters.revenueMax);
    if (filters.usageMin) params.set("usageMin", filters.usageMin);
    if (filters.usageMax) params.set("usageMax", filters.usageMax);

    const [customersResponse, statsResponse, plansResponse] = await Promise.all([
      fetch(`${API_BASE}/reseller/customers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${API_BASE}/reseller/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${API_BASE}/reseller/plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    const customersJson = await customersResponse.json();
    const statsJson = await statsResponse.json();
    const plansJson = await plansResponse.json();

    if (customersResponse.ok && customersJson.status === 1) {
      setItems(customersJson.data.items);
    }

    if (statsResponse.ok && statsJson.status === 1) {
      setStats(statsJson.data);
    }

    if (plansResponse.ok && plansJson.status === 1) {
      setPlans(plansJson.data);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleStatus = async (item: CustomerItem) => {
    const response = await fetch(`${API_BASE}/reseller/customers/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountId: item.id,
        isActive: !item.isActive,
      }),
    });

    const json = await response.json();
    if (response.ok && json.status === 1) {
      await fetchCustomers(search);
      toast({
        title: item.isActive ? "Customer paused" : "Customer activated",
        description: `${item.companyName} has been updated.`,
      });
    } else {
      toast({
        title: "Status update failed",
        description: json.message || "Unable to update customer status",
        variant: "destructive",
      });
    }
  };

  const closeDialog = () => {
    setActiveAction(null);
    setSelectedCustomer(null);
    setChangePlanId("");
    setRechargeAmount("");
    setTeamForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      roleType: "CUSTOMER_AGENT",
    });
    setMessageForm({
      to: "",
      message: "",
    });
  };

  const submitAction = async () => {
    if (!selectedCustomer || !activeAction) return;

    const endpointMap: Record<Exclude<ActionType, null>, string> = {
      changePlan: "change-plan",
      recharge: "recharge",
      team: "add-team-member",
      message: "send-test-message",
    };

    const bodyMap = {
      changePlan: {
        accountId: selectedCustomer.id,
        planId: changePlanId,
      },
      recharge: {
        accountId: selectedCustomer.id,
        amount: Number(rechargeAmount),
      },
      team: {
        accountId: selectedCustomer.id,
        ...teamForm,
      },
      message: {
        accountId: selectedCustomer.id,
        ...messageForm,
      },
    };

    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE}/reseller/customers/${endpointMap[activeAction]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyMap[activeAction]),
        },
      );
      const json = await response.json();
      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to complete action");
      }

      toast({
        title: "Action completed",
        description:
          activeAction === "changePlan"
            ? "Customer plan changed successfully."
            : activeAction === "recharge"
              ? "Credits added successfully."
              : activeAction === "team"
                ? "Team member added successfully."
                : "Test message recorded successfully.",
      });

      await fetchCustomers(search);
      closeDialog();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unable to complete action",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResellerShell title="Customer portfolio" eyebrow="Account Management">
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total Customers",
            value: stats?.totalCustomers ?? 0,
            icon: Users,
          },
          {
            label: "Active Customers",
            value: stats?.activeCustomers ?? 0,
            icon: Activity,
          },
          {
            label: "Paused Customers",
            value: stats?.inactiveCustomers ?? 0,
            icon: PauseCircle,
          },
          {
            label: "Monthly Revenue",
            value: `INR ${Number(stats?.monthlyRevenue ?? 0).toLocaleString()}`,
            icon: TrendingUp,
          },
          {
            label: "Messages Used (this month)",
            value: Number(stats?.messagesUsedThisMonth ?? 0).toLocaleString(),
            icon: MessageSquareText,
          },
        ].map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-slate-900/80 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-5 w-5 text-cyan-300" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6 border-white/10 bg-slate-900/80 text-slate-100">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, status: value }))
              }
            >
              <SelectTrigger className="border-white/10 bg-slate-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Plan type</Label>
            <Select
              value={filters.planId}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, planId: value }))
              }
            >
              <SelectTrigger className="border-white/10 bg-slate-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Revenue min</Label>
            <Input
              value={filters.revenueMin}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  revenueMin: event.target.value,
                }))
              }
              placeholder="0"
              className="border-white/10 bg-slate-950"
            />
          </div>

          <div className="space-y-2">
            <Label>Revenue max</Label>
            <Input
              value={filters.revenueMax}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  revenueMax: event.target.value,
                }))
              }
              placeholder="5000"
              className="border-white/10 bg-slate-950"
            />
          </div>

          <div className="space-y-2">
            <Label>Usage % min</Label>
            <Input
              value={filters.usageMin}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  usageMin: event.target.value,
                }))
              }
              placeholder="0"
              className="border-white/10 bg-slate-950"
            />
          </div>

          <div className="space-y-2">
            <Label>Usage % max</Label>
            <Input
              value={filters.usageMax}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  usageMax: event.target.value,
                }))
              }
              placeholder="100"
              className="border-white/10 bg-slate-950"
            />
          </div>

          <div className="flex gap-3 md:col-span-2 xl:col-span-6">
            <Button
              type="button"
              className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              onClick={() => fetchCustomers(search)}
            >
              Apply filters
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
              onClick={() => {
                setFilters({
                  status: "all",
                  planId: "all",
                  revenueMin: "",
                  revenueMax: "",
                  usageMin: "",
                  usageMax: "",
                });
                setTimeout(() => fetchCustomers(search), 0);
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-900/80 text-slate-100">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-300" />
            Managed customers
          </CardTitle>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                fetchCustomers(search);
              }
            }}
            placeholder="Search company or owner"
            className="max-w-sm border-white/10 bg-slate-950"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold">{item.companyName}</p>
                    <div className="flex flex-wrap gap-2">
                      {getSmartStatuses(item).map((badge) => (
                        <span
                          key={badge.label}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    Owner: {item.owner ? `${item.owner.firstName} ${item.owner.lastName}` : "Not assigned"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {item.owner?.email} {item.owner?.phone ? `• ${item.owner.phone}` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span>Users: {item.counts.users}</span>
                    <span>Contacts: {item.counts.contacts}</span>
                    <span>Campaigns: {item.counts.campaigns}</span>
                    <span>
                      Plan: {item.subscription?.plan?.name || "Not assigned"}
                      {item.subscription?.plan?.price
                        ? ` (${item.subscription.plan.currency} ${item.subscription.plan.price})`
                        : ""}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Price
                      </p>
                      {item.pricing ? (
                        <>
                          <p className="mt-2 text-sm text-slate-300">
                            Base: {item.pricing.currency}{" "}
                            {item.pricing.basePrice.toLocaleString()}
                          </p>
                          <p className="text-sm font-medium text-cyan-300">
                            Reseller: {item.pricing.currency}{" "}
                            {item.pricing.resellerPrice.toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">
                          Not assigned
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Usage
                      </p>
                      {item.usage ? (
                        <>
                          <p className="mt-2 text-sm text-slate-300">
                            {item.usage.used.toLocaleString()} /{" "}
                            {item.usage.limit.toLocaleString() || "Open"}
                          </p>
                          <p className="text-sm font-medium text-cyan-300">
                            {item.usage.percentage}% used
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">
                          No usage data
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Subscription
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Expires:{" "}
                        {item.subscriptionExpiryDate
                          ? new Date(item.subscriptionExpiryDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "Not set"}
                      </p>
                      <p className="text-sm font-medium text-cyan-300">
                        Profit: {item.pricing?.currency || "INR"}{" "}
                        {Number(item.pricing?.profit || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Messages sent (7d)
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-100">
                        {item.metrics.messagesSentLast7Days.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Campaign success
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-100">
                        {item.metrics.campaignSuccessRate}%
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Last activity
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-100">
                        {item.metrics.lastActivity
                          ? new Date(item.metrics.lastActivity).toLocaleString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "No activity yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
                    onClick={() => navigate(`/reseller/customers/${item.id}`)}
                  >
                    View details
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
                    onClick={() => {
                      setSelectedCustomer(item);
                      setChangePlanId("");
                      setActiveAction("changePlan");
                    }}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Change Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
                    onClick={() => {
                      setSelectedCustomer(item);
                      setRechargeAmount("");
                      setActiveAction("recharge");
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Recharge / Add Credits
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
                    onClick={() => {
                      setSelectedCustomer(item);
                      setActiveAction("team");
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
                    onClick={() => {
                      setSelectedCustomer(item);
                      setMessageForm({
                        to: item.owner?.phone || "",
                        message: "",
                      });
                      setActiveAction("message");
                    }}
                  >
                    <MessageCircleMore className="mr-2 h-4 w-4" />
                    Send Message (test)
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
                    onClick={() => toggleStatus(item)}
                  >
                    {item.isActive ? (
                      <PauseCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    {item.isActive ? "Pause account" : "Activate account"}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {!items.length ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-slate-400">
              No customers found yet.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={!!activeAction} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="border-white/10 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>
              {activeAction === "changePlan"
                ? "Change plan"
                : activeAction === "recharge"
                  ? "Recharge / Add credits"
                  : activeAction === "team"
                    ? "Add team member"
                    : "Send test message"}
            </DialogTitle>
          </DialogHeader>

          {activeAction === "changePlan" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select plan</Label>
                <Select value={changePlanId} onValueChange={setChangePlanId}>
                  <SelectTrigger className="border-white/10 bg-slate-950">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ({plan.currency} {plan.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {activeAction === "recharge" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recharge amount</Label>
                <Input
                  value={rechargeAmount}
                  onChange={(event) => setRechargeAmount(event.target.value)}
                  placeholder="Enter amount"
                  className="border-white/10 bg-slate-950"
                />
              </div>
            </div>
          ) : null}

          {activeAction === "team" ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { key: "firstName", label: "First name" },
                { key: "lastName", label: "Last name" },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                { key: "password", label: "Password" },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    type={field.key === "password" ? "password" : "text"}
                    value={teamForm[field.key as keyof typeof teamForm]}
                    onChange={(event) =>
                      setTeamForm((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    className="border-white/10 bg-slate-950"
                  />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <Label>Role</Label>
                <Select
                  value={teamForm.roleType}
                  onValueChange={(value) =>
                    setTeamForm((current) => ({ ...current, roleType: value }))
                  }
                >
                  <SelectTrigger className="border-white/10 bg-slate-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER_AGENT">Customer Agent</SelectItem>
                    <SelectItem value="CUSTOMER_ADMIN">Customer Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {activeAction === "message" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient phone</Label>
                <Input
                  value={messageForm.to}
                  onChange={(event) =>
                    setMessageForm((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                  className="border-white/10 bg-slate-950"
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input
                  value={messageForm.message}
                  onChange={(event) =>
                    setMessageForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  className="border-white/10 bg-slate-950"
                />
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={submitting}
              className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              onClick={submitAction}
            >
              {submitting ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ResellerShell>
  );
}
