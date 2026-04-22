import { useEffect, useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import EmojiPicker from "emoji-picker-react";
import { FiRotateCcw, FiSmile } from "react-icons/fi";
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
import Swal from "sweetalert2";
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

type ActionType =
  | "changePlan"
  | "recharge"
  | "team"
  | "message"
  | "bulkChangePlan"
  | "bulkCampaign"
  | null;

export default function ResellerCustomers() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    planId: "all",
    revenueMin: "",
    revenueMax: "",
    usageMin: "",
    usageMax: "",
  });
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(
    null,
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  const selectedCustomers = items.filter((item) => selectedIds.includes(item.id));
  const allOnPageSelected = items.length > 0 && selectedIds.length === items.length;
  const hasSomeSelected = selectedIds.length > 0 && !allOnPageSelected;

  const getSmartStatuses = (item: CustomerItem) => {
    const badges: Array<{ label: string; className: string }> = [];

    const now = new Date();
    const startDate = item.subscription?.startDate
      ? new Date(item.subscription.startDate)
      : null;
    const expiryDate = item.subscriptionExpiryDate
      ? new Date(item.subscriptionExpiryDate)
      : null;

    // ACTIVE / PAUSED
    if (item.isActive) {
      badges.push({
        label: "Active",
        className: "bg-green-50 text-[#16A249] border border-green-200",
      });
    } else {
      badges.push({
        label: "Paused",
        className: "bg-gray-100 text-gray-600 border border-gray-200",
      });
    }

    // TRIAL
    if (startDate) {
      const trialEndsAt = new Date(
        startDate.getTime() + 14 * 24 * 60 * 60 * 1000,
      );

      if (now <= trialEndsAt) {
        badges.push({
          label: "Trial",
          className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
        });
      }
    }

    // EXPIRED
    if (expiryDate && expiryDate < now) {
      badges.push({
        label: "Expired",
        className: "bg-red-50 text-red-600 border border-red-200",
      });
    }

    // LOW BALANCE
    if (item.creditBalance <= 1000) {
      badges.push({
        label: "Low Balance",
        className: "bg-orange-50 text-orange-600 border border-orange-200",
      });
    }

    // HIGH USAGE
    if ((item.usage?.percentage || 0) >= 80) {
      badges.push({
        label: "High Usage",
        className: "bg-purple-50 text-purple-600 border border-purple-200",
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

    const [customersResponse, statsResponse, plansResponse] = await Promise.all(
      [
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
      ],
    );

    const customersJson = await customersResponse.json();
    const statsJson = await statsResponse.json();
    const plansJson = await plansResponse.json();

    if (customersResponse.ok && customersJson.status === 1) {
      setItems(customersJson.data.items);
      setSelectedIds((current) =>
        current.filter((id) =>
          customersJson.data.items.some((item: CustomerItem) => item.id === id),
        ),
      );
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
    const actionText = item.isActive ? "pause" : "activate";

    // CONFIRMATION POPUP
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `You are about to ${actionText} this customer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16A249",
      cancelButtonColor: "#d33",
      confirmButtonText: `Yes, ${actionText} it`,
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      // LOADING STATE
      Swal.fire({
        title: "Processing...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

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

        // SUCCESS
        Swal.fire({
          icon: "success",
          title: item.isActive ? "Customer Paused" : "Customer Activated",
          text: `${item.companyName} has been updated successfully.`,
          confirmButtonColor: "#16A249",
        });
      } else {
        throw new Error(json.message);
      }
    } catch (error: any) {
      // ERROR
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.message || "Something went wrong",
        confirmButtonColor: "#d33",
      });
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((item) => item.id) : []);
  };

  const toggleSelectCustomer = (accountId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, accountId])] : current.filter((id) => id !== accountId),
    );
  };

  const openBulkPlanDialog = () => {
    setChangePlanId("");
    setActiveAction("bulkChangePlan");
  };

  const openBulkCampaignDialog = () => {
    setMessageForm({
      to: "",
      message: "",
    });
    setActiveAction("bulkCampaign");
  };

  const handleBulkPause = async () => {
    if (!selectedIds.length) return;

    const activeCount = selectedCustomers.filter((item) => item.isActive).length;
    if (!activeCount) {
      toast({
        title: "No active customers selected",
        description: "Choose at least one active customer to pause.",
        variant: "destructive",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Pause selected customers?",
      text: `${activeCount} selected customer${activeCount > 1 ? "s" : ""} will be paused.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16A249",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, pause them",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Processing...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(`${API_BASE}/reseller/customers/bulk-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountIds: selectedCustomers
            .filter((item) => item.isActive)
            .map((item) => item.id),
          isActive: false,
        }),
      });

      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to pause selected customers");
      }

      await fetchCustomers(search);
      setSelectedIds([]);

      Swal.fire({
        icon: "success",
        title: "Customers paused",
        text: `${json.data.updatedCount || activeCount} customer account${activeCount > 1 ? "s were" : " was"} paused successfully.`,
        confirmButtonColor: "#16A249",
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.message || "Something went wrong",
        confirmButtonColor: "#d33",
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
    if (!activeAction) return;

    if (
      ["changePlan", "recharge", "team", "message"].includes(activeAction) &&
      !selectedCustomer
    ) {
      return;
    }

    const endpointMap: Record<Exclude<ActionType, null>, string> = {
      changePlan: "change-plan",
      recharge: "recharge",
      team: "add-team-member",
      message: "send-test-message",
      bulkChangePlan: "bulk-change-plan",
      bulkCampaign: "bulk-send-campaign",
    };

    const bodyMap = {
      changePlan: {
        accountId: selectedCustomer!.id,
        planId: changePlanId,
      },
      recharge: {
        accountId: selectedCustomer!.id,
        amount: Number(rechargeAmount),
      },
      team: {
        accountId: selectedCustomer!.id,
        ...teamForm,
      },
      message: {
        accountId: selectedCustomer!.id,
        ...messageForm,
      },
      bulkChangePlan: {
        accountIds: selectedIds,
        planId: changePlanId,
      },
      bulkCampaign: {
        accountIds: selectedIds,
        message: messageForm.message,
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
                : activeAction === "message"
                  ? "Test message recorded successfully."
                  : activeAction === "bulkChangePlan"
                    ? "Selected customers were moved to the new plan."
                    : "Campaign queued for selected customers.",
      });

      await fetchCustomers(search);
      if (activeAction === "bulkChangePlan" || activeAction === "bulkCampaign") {
        setSelectedIds([]);
      }
      closeDialog();
    } catch (error) {
      toast({
        title: "Action failed",
        description:
          error instanceof Error ? error.message : "Unable to complete action",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setShowEmoji(false);
      }
    };

    if (showEmoji) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, []);

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
            value: `₹ ${Number(stats?.monthlyRevenue ?? 0).toLocaleString()}`,
            icon: TrendingUp,
          },
          {
            label: "Messages Used",
            value: Number(stats?.messagesUsedThisMonth ?? 0).toLocaleString(),
            icon: MessageSquareText,
          },
        ].map((metric) => (
          <Card
            key={metric.label}
            className="relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
          >
            {/* LEFT ACCENT LINE */}
            <div className="absolute left-0 top-0 h-full w-1 bg-[#16A249]" />

            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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

      <Card className="bg-white rounded-2xl mb-2">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b">
          <div>
            <p className="text-sm font-semibold text-gray-800">Filters</p>
            <p className="text-xs text-gray-500">Refine your customer list</p>
          </div>

          {/* RESET QUICK BUTTON */}
          <Button
            size="sm"
            variant="ghost"
            className="flex items-center gap-2 text-gray-500 hover:text-[#16A249] hover:bg-green-50 rounded-lg"
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
            <FiRotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* FILTER GRID */}
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6 pt-5">
          {/* STATUS */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((c) => ({ ...c, status: value }))
              }
            >
              <SelectTrigger className="bg-gray-50 border focus:border-[#16A249]">
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

          {/* PLAN */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Plan</Label>
            <Select
              value={filters.planId}
              onValueChange={(value) =>
                setFilters((c) => ({ ...c, planId: value }))
              }
            >
              <SelectTrigger className="bg-gray-50 border focus:border-[#16A249]">
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

          {/* REVENUE RANGE */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Revenue</Label>
            <div className="flex gap-2">
              <Input
                value={filters.revenueMin}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, revenueMin: e.target.value }))
                }
                placeholder="Min"
                className="bg-gray-50 border focus:border-[#16A249]"
              />
              <Input
                value={filters.revenueMax}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, revenueMax: e.target.value }))
                }
                placeholder="Max"
                className="bg-gray-50 border focus:border-[#16A249]"
              />
            </div>
          </div>

          {/* USAGE RANGE */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Usage %</Label>
            <div className="flex gap-2">
              <Input
                value={filters.usageMin}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, usageMin: e.target.value }))
                }
                placeholder="Min"
                className="bg-gray-50 border focus:border-[#16A249]"
              />
              <Input
                value={filters.usageMax}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, usageMax: e.target.value }))
                }
                placeholder="Max"
                className="bg-gray-50 border focus:border-[#16A249]"
              />
            </div>
          </div>

          {/* APPLY BUTTON */}
          <div className="flex items-end">
            <Button
              className="w-full bg-[#16A249] text-white hover:bg-[#12813a] rounded-xl"
              onClick={() => fetchCustomers(search)}
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3 w-full">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#16A249]" />
                Managed customers
              </CardTitle>

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchCustomers(search);
                }}
                placeholder="Search company or owner"
                className="max-w-sm bg-gray-50 border focus:border-[#16A249]"
              />
            </div>

            {selectedIds.length ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50/80 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedIds.length} customer{selectedIds.length > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-xs text-gray-600">
                    Pause multiple customers, assign a plan, or send a campaign in one go.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                    onClick={handleBulkPause}
                  >
                    Pause multiple customers
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-green-200 bg-white text-[#16A249] hover:bg-green-100"
                    onClick={openBulkPlanDialog}
                  >
                    Assign plan
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#16A249] text-white hover:bg-[#12813a]"
                    onClick={openBulkCampaignDialog}
                  >
                    Send campaign
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-gray-500 hover:bg-white"
                    onClick={() => setSelectedIds([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* HEADER */}
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-3">
                  <Checkbox
                    checked={allOnPageSelected ? true : hasSomeSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                    aria-label="Select all customers"
                  />
                </th>
                <th className="py-3">Company</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Profit</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b transition ${
                    selectedIds.includes(item.id) ? "bg-green-50/60" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-4 pr-3">
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(checked) =>
                        toggleSelectCustomer(item.id, checked === true)
                      }
                      aria-label={`Select ${item.companyName}`}
                    />
                  </td>
                  {/* COMPANY */}
                  <td className="py-4">
                    <p className="font-medium text-gray-900">
                      {item.companyName}
                    </p>
                    <p className="text-xs text-gray-500">{item.owner?.email}</p>
                  </td>

                  {/* PLAN */}
                  <td>
                    <span className="text-[#16A249] font-medium">
                      {item.subscription?.plan?.name || "-"}
                    </span>
                  </td>

                  {/* USERS */}
                  <td>{item.counts.users}</td>

                  {/* USAGE */}
                  <td>
                    {item.usage
                      ? `${item.usage.used}/${item.usage.limit}`
                      : "-"}
                  </td>

                  {/* EXPIRY */}
                  <td className="text-red-500 text-xs">
                    {item.subscriptionExpiryDate
                      ? new Date(
                          item.subscriptionExpiryDate,
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  {/* PROFIT */}
                  <td className="text-[#16A249] font-medium">
                    ₹ {Number(item.pricing?.profit || 0).toLocaleString()}
                  </td>

                  {/* STATUS */}
                  <td>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.isActive ? "Active" : "Paused"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-[#16A249] text-white text-xs"
                        onClick={() =>
                          navigate(`/reseller/customers/${item.id}`)
                        }
                      >
                        View
                      </Button>

                      {/* DROPDOWN (clean UX) */}
                      <div className="relative">
                        {/* BUTTON */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === item.id ? null : item.id,
                            );
                          }}
                          className="px-2"
                        >
                          ⋮
                        </Button>

                        {/* DROPDOWN */}
                        {openMenuId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg z-50 overflow-hidden"
                          >
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedCustomer(item);
                                setActiveAction("changePlan");
                                setOpenMenuId(null);
                              }}
                            >
                              Change Plan
                            </button>

                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedCustomer(item);
                                setActiveAction("recharge");
                                setOpenMenuId(null);
                              }}
                            >
                              Recharge
                            </button>

                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedCustomer(item);
                                setActiveAction("message");
                                setOpenMenuId(null);
                              }}
                            >
                              Send Message
                            </button>

                            {/* STATUS ACTION */}
                            <button
                              className={`w-full text-left px-4 py-2 text-sm font-medium ${
                                item.isActive
                                  ? "text-red-600 hover:bg-red-50"
                                  : "text-[#16A249] hover:bg-green-50"
                              }`}
                              onClick={() => {
                                toggleStatus(item);
                                setOpenMenuId(null);
                              }}
                            >
                              {item.isActive
                                ? "Pause account"
                                : "Activate account"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* EMPTY STATE */}
          {!items.length && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-green-200 bg-green-50 py-12 text-center">
              {/* ICON */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Building2 className="h-6 w-6 text-[#16A249]" />
              </div>

              {/* TITLE */}
              <p className="text-sm font-semibold text-gray-900">
                No customers found
              </p>

              {/* DESCRIPTION */}
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Try adjusting your filters or create a new customer to get
                started
              </p>

              {/* ACTION BUTTON */}
              <Button
                className="mt-4 bg-[#16A249] text-white hover:bg-[#12813a] rounded-xl px-5"
                onClick={() => navigate("/reseller/customers/new")}
              >
                + Add Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!activeAction}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="bg-white border shadow-lg rounded-2xl w-full max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {activeAction === "changePlan"
                ? "Change plan"
                : activeAction === "bulkChangePlan"
                  ? "Assign plan to selected customers"
                : activeAction === "recharge"
                  ? "Recharge / Add credits"
                  : activeAction === "team"
                    ? "Add team member"
                    : activeAction === "bulkCampaign"
                      ? "Send campaign to selected customers"
                      : "Send test message"}
            </DialogTitle>
          </DialogHeader>

          {activeAction === "changePlan" || activeAction === "bulkChangePlan" ? (
            <div className="space-y-5 pt-4">
              {activeAction === "bulkChangePlan" ? (
                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Selected customers</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedIds.length} account{selectedIds.length > 1 ? "s" : ""} will receive the new plan.
                  </p>
                </div>
              ) : null}
              {/* LABEL */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Select plan</Label>

                <Select value={changePlanId} onValueChange={setChangePlanId}>
                  <SelectTrigger className="bg-gray-50 border focus:border-[#16A249]">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>

                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center justify-between w-full">
                          {/* LEFT */}
                          <span className="text-gray-800">{plan.name}</span>

                          {/* RIGHT */}
                          <span className="text-xs text-gray-500 ml-2">
                            {plan.currency} {plan.price}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PLAN PREVIEW (Optional but 🔥) */}
              {changePlanId && (
                <div className="rounded-xl border bg-green-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Selected plan</p>

                  {(() => {
                    const selected = plans.find((p) => p.id === changePlanId);
                    return selected ? (
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900">
                          {selected.name}
                        </p>
                        <p className="text-[#16A249] font-semibold">
                          {selected.currency} {selected.price}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          ) : null}

          {activeAction === "recharge" ? (
            <div className="space-y-5 pt-4">
              {/* INPUT */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Recharge amount</Label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    ₹
                  </span>

                  <Input
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="pl-7 bg-gray-50 border focus:border-[#16A249]"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Enter the amount you want to add to the customer wallet
                </p>
              </div>

              {/* QUICK AMOUNT BUTTONS (🔥 UX BOOST) */}
              <div className="flex flex-wrap gap-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(String(amt))}
                    className="px-3 py-1.5 text-xs rounded-lg border bg-gray-50 hover:bg-gray-100 text-gray-700"
                  >
                    ₹ {amt}
                  </button>
                ))}
              </div>

              {/* PREVIEW */}
              {rechargeAmount && (
                <div className="rounded-xl border bg-green-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Recharge summary</p>

                  <p className="text-lg font-semibold text-[#16A249]">
                    ₹ {Number(rechargeAmount || 0).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {activeAction === "team" ? (
            <div className="space-y-6 pt-4">
              {/* SECTION TITLE */}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Team member details
                </p>
                <p className="text-xs text-gray-500">
                  Add a new member to manage this customer account
                </p>
              </div>

              {/* FORM GRID */}
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { key: "firstName", label: "First name" },
                  { key: "lastName", label: "Last name" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "password", label: "Password" },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-sm text-gray-700">
                      {field.label}
                    </Label>

                    <Input
                      type={field.key === "password" ? "password" : "text"}
                      value={teamForm[field.key as keyof typeof teamForm]}
                      onChange={(e) =>
                        setTeamForm((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="bg-gray-50 border focus:border-[#16A249]"
                    />
                  </div>
                ))}

                {/* ROLE */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm text-gray-700">Role</Label>

                  <Select
                    value={teamForm.roleType}
                    onValueChange={(value) =>
                      setTeamForm((prev) => ({ ...prev, roleType: value }))
                    }
                  >
                    <SelectTrigger className="bg-gray-50 border focus:border-[#16A249]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="CUSTOMER_AGENT">
                        <div className="flex flex-col">
                          <span>Customer Agent</span>
                          <span className="text-xs text-gray-500">
                            Can manage chats and campaigns
                          </span>
                        </div>
                      </SelectItem>

                      <SelectItem value="CUSTOMER_ADMIN">
                        <div className="flex flex-col">
                          <span>Customer Admin</span>
                          <span className="text-xs text-gray-500">
                            Full access including team & billing
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* INFO BOX (🔥 UX BOOST) */}
              <div className="rounded-xl border bg-green-50 p-4">
                <p className="text-xs text-gray-500 mb-1">Note</p>
                <p className="text-sm text-gray-700">
                  The user will receive login credentials and can start managing
                  the account immediately.
                </p>
              </div>
            </div>
          ) : null}

          {activeAction === "message" || activeAction === "bulkCampaign" ? (
            <div className="space-y-6 pt-4">
              {/* SECTION TITLE */}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {activeAction === "bulkCampaign"
                    ? "Send bulk campaign"
                    : "Send test message"}
                </p>
                <p className="text-xs text-gray-500">
                  {activeAction === "bulkCampaign"
                    ? `The message will be queued for ${selectedIds.length} selected customer account${selectedIds.length > 1 ? "s" : ""}.`
                    : "Send a quick message to verify WhatsApp delivery"}
                </p>
              </div>

              {activeAction === "message" ? (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Recipient phone</Label>

                  <Input
                    value={messageForm.to}
                    onChange={(e) =>
                      setMessageForm((prev) => ({
                        ...prev,
                        to: e.target.value,
                      }))
                    }
                    placeholder="+91 9876543210"
                    className="bg-gray-50 border focus:border-[#16A249]"
                  />
                </div>
              ) : (
                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Recipients</p>
                  <p className="text-sm text-gray-700">
                    Campaign will be sent to each selected customer's primary owner phone.
                  </p>
                </div>
              )}

              {/* MESSAGE INPUT + EMOJI */}
              <div className="space-y-2 relative">
                <Label className="text-sm text-gray-700">Message</Label>

                <div className="space-y-2 relative">
                  <textarea
                    value={messageForm.message}
                    onChange={(e) =>
                      setMessageForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Type your message here..."
                    className="w-full rounded-xl border bg-gray-50 p-3 pr-10 text-sm focus:border-[#16A249] outline-none"
                  />

                  {/* EMOJI BUTTON */}
                  <button
                    type="button"
                    onClick={() => setShowEmoji((prev) => !prev)}
                    className="absolute right-2 bottom-2 p-1 rounded hover:bg-gray-200"
                  >
                    <FiSmile className="text-gray-500" />
                  </button>
                </div>

                {/* EMOJI PICKER */}
                {showEmoji && (
                  <div
                    ref={emojiRef}
                    className="absolute bottom-12 right-0 z-[9999]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EmojiPicker
                      height={350}
                      width={300}
                      onEmojiClick={(emojiData) => {
                        setMessageForm((prev) => ({
                          ...prev,
                          message: prev.message + emojiData.emoji,
                        }));
                      }}
                    />
                  </div>
                )}

                {/* CHARACTER COUNT */}
                <p className="text-xs text-gray-500 text-right">
                  {messageForm.message.length} characters
                </p>
              </div>

              {/* QUICK TEMPLATES */}
              <div className="flex flex-wrap gap-2">
                {[
                  "Hello! 😊 This is a test message.",
                  "Your subscription is active ✅",
                  "Please contact support 🙏",
                ].map((msg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setMessageForm((prev) => ({
                        ...prev,
                        message: msg,
                      }))
                    }
                    className="px-3 py-1.5 text-xs rounded-lg border bg-gray-50 hover:bg-gray-100 text-gray-700"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            {/* CANCEL */}
            <Button
              type="button"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl px-4"
              onClick={closeDialog}
            >
              Cancel
            </Button>

            {/* CONFIRM */}
            <Button
              type="button"
              disabled={submitting}
              className="bg-[#16A249] hover:bg-[#12813a] text-white rounded-xl px-5 shadow-sm"
              onClick={submitAction}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ResellerShell>
  );
}
