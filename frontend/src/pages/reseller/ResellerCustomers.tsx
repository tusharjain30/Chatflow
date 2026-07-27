import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Building2,
  MessageSquareText,
  PlusCircle,
  PauseCircle,
  TrendingUp,
  Users,
  ChevronUp,
  ChevronDown,
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
  lifecycleStatus:
    | "ACTIVE"
    | "PAUSED"
    | "SUSPENDED"
    | "EXPIRED"
    | "TRIAL"
    | "PENDING_VERIFICATION";
  trialEndsAt: string | null;
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
  computedStatus?:
    | "active"
    | "paused"
    | "suspended"
    | "expired"
    | "trial"
    | "pending_verification";
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

  const [page, setPage] = useState(1);
  const limit = 20;
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("auth_token");
  const selectedCustomers = items.filter((item) =>
    selectedIds.includes(item.id),
  );
  const allOnPageSelected =
    items.length > 0 && selectedIds.length === items.length;
  const hasSomeSelected = selectedIds.length > 0 && !allOnPageSelected;

  const getSmartStatuses = (item: CustomerItem) => {
    const badges: Array<{ label: string; className: string }> = [];

    const now = new Date();
    const primaryStatus =
      item.computedStatus || (item.isActive ? "active" : "paused");
    const statusStyles: Record<string, { label: string; className: string }> = {
      active: {
        label: "Active",
        className: "bg-green-50 text-[#16A249] border border-green-200",
      },
      paused: {
        label: "Paused",
        className: "bg-gray-100 text-gray-600 border border-gray-200",
      },
      suspended: {
        label: "Suspended",
        className: "bg-red-50 text-red-700 border border-red-200",
      },
      expired: {
        label: "Expired",
        className: "bg-rose-50 text-rose-700 border border-rose-200",
      },
      trial: {
        label: "Trial",
        className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
      },
      pending_verification: {
        label: "Pending Verification",
        className: "bg-sky-50 text-sky-700 border border-sky-200",
      },
    };

    if (statusStyles[primaryStatus]) {
      badges.push(statusStyles[primaryStatus]);
    }

    if (primaryStatus === "trial" && item.trialEndsAt) {
      const realTrialEndsAt = new Date(item.trialEndsAt);
      if (now <= realTrialEndsAt) {
        badges.push({
          label: `Trial Ends ${realTrialEndsAt.toLocaleDateString()}`,
          className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
        });
      }
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

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("page", String(page));

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.planId !== "all") params.set("planId", filters.planId);
      if (filters.revenueMin) params.set("revenueMin", filters.revenueMin);
      if (filters.revenueMax) params.set("revenueMax", filters.revenueMax);
      if (filters.usageMin) params.set("usageMin", filters.usageMin);
      if (filters.usageMax) params.set("usageMax", filters.usageMax);

      // ONLY customers depend on filters
      const customersPromise = fetch(
        `${API_BASE}/reseller/customers?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // These should not refetch every time
      const statsPromise = fetch(`${API_BASE}/reseller/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const plansPromise = fetch(`${API_BASE}/reseller/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const [customersRes, statsRes, plansRes] = await Promise.allSettled([
        customersPromise,
        statsPromise,
        plansPromise,
      ]);

      // ================= CUSTOMERS =================
      if (customersRes.status === "fulfilled") {
        const res = customersRes.value;
        const json = await res.json();

        if (res.ok && json.status === 1) {
          setItems(json.data.items);
          setPagination(json.data.pagination);

          setSelectedIds((current) =>
            current.filter((id) =>
              json.data.items.some((item: CustomerItem) => item.id === id),
            ),
          );
        }
      } else {
        console.error("Customers API failed");
      }

      // ================= STATS =================
      if (statsRes.status === "fulfilled") {
        const res = statsRes.value;
        const json = await res.json();

        if (res.ok && json.status === 1) {
          setStats(json.data);
        }
      }

      // ================= PLANS =================
      if (plansRes.status === "fulfilled") {
        const res = plansRes.value;
        const json = await res.json();

        if (res.ok && json.status === 1) {
          setPlans(Array.isArray(json.data?.list) ? json.data.list : []);
        }
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch, page, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset page on new search
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const updateCustomerStatus = async (
    item: CustomerItem,
    nextStatus:
      | "ACTIVE"
      | "PAUSED"
      | "SUSPENDED"
      | "EXPIRED"
      | "TRIAL"
      | "PENDING_VERIFICATION",
  ) => {
    const actionText = nextStatus.toLowerCase().replace(/_/g, " ");

    // CONFIRMATION POPUP
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `You are about to set this customer to ${actionText}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16A249",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it",
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
          status: nextStatus,
        }),
      });

      const json = await response.json();

      if (response.ok && json.status === 1) {
        await fetchCustomers();

        // SUCCESS
        Swal.fire({
          icon: "success",
          title: "Customer Status Updated",
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
      checked
        ? [...new Set([...current, accountId])]
        : current.filter((id) => id !== accountId),
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

    const activeCount = selectedCustomers.filter(
      (item) => item.isActive,
    ).length;
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

      const response = await fetch(
        `${API_BASE}/reseller/customers/bulk-status`,
        {
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
        },
      );

      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to pause selected customers");
      }

      await fetchCustomers();
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

      await fetchCustomers();
      if (
        activeAction === "bulkChangePlan" ||
        activeAction === "bulkCampaign"
      ) {
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

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.planId !== "all" ||
    filters.revenueMin !== "" ||
    filters.revenueMax !== "" ||
    filters.usageMin !== "" ||
    filters.usageMax !== "";

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

      <Card className="bg-white rounded-2xl shadow-sm border mb-2">
        {/* HEADER (CLICKABLE) */}
        <div
          // onClick={() => setShowFilters((p) => !p)}
          className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 rounded-t-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#16A249]/10 flex items-center justify-center text-[#16A249] text-sm font-semibold">
              F
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Filters</p>
              <p className="text-xs text-gray-500">Refine your results</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* RESET */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation(); // important
                  setFilters({
                    status: "all",
                    planId: "all",
                    revenueMin: "",
                    revenueMax: "",
                    usageMin: "",
                    usageMax: "",
                  });
                  setPage(1);
                }}
                className="text-red-500"
              >
                Reset
              </Button>
            )}

            {/* TOGGLE BUTTON */}
            <button
              onClick={() => setShowFilters((p) => !p)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <div
                className="h-8 w-8 flex items-center justify-center rounded-lg 
             hover:bg-gray-100 transition"
              >
                {showFilters ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE BODY */}
        {showFilters && (
          <CardContent className="px-5 pb-4 pt-2">
            <div className="flex flex-wrap items-end gap-3">
              {/* STATUS */}
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((c) => ({ ...c, status: value }))
                }
              >
                <SelectTrigger className="w-[140px] bg-gray-50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="pending_verification">
                    Pending Verification
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* PLAN */}
              <Select
                value={filters.planId}
                onValueChange={(value) =>
                  setFilters((c) => ({ ...c, planId: value }))
                }
              >
                <SelectTrigger className="w-[160px] bg-gray-50">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  {Array.isArray(plans) &&
                    plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* REVENUE */}
              <Input
                placeholder="Revenue Min"
                value={filters.revenueMin}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, revenueMin: e.target.value }))
                }
                className="w-[120px] bg-gray-50"
              />

              <Input
                placeholder="Revenue Max"
                value={filters.revenueMax}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, revenueMax: e.target.value }))
                }
                className="w-[120px] bg-gray-50"
              />

              {/* USAGE */}
              <Input
                placeholder="Usage Min"
                value={filters.usageMin}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, usageMin: e.target.value }))
                }
                className="w-[120px] bg-gray-50"
              />

              <Input
                placeholder="Usage Max"
                value={filters.usageMax}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, usageMax: e.target.value }))
                }
                className="w-[120px] bg-gray-50"
              />

              {/* APPLY */}
              <Button
                className="bg-[#16A249] text-white hover:bg-[#12813a] rounded-lg px-5"
                onClick={() => setPage(1)}
              >
                Apply
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="bg-white">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3 w-full">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* LEFT */}
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#16A249]" />
                Managed customers
              </CardTitle>

              {/* RIGHT */}
              <div className="flex items-center gap-3">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company or owner"
                  className="max-w-sm bg-gray-50 border focus:border-[#16A249]"
                />

                {/* ADD BUTTON */}
                <Button
                  className="bg-[#16A249] text-white hover:bg-[#12813a] rounded-xl px-4 flex items-center gap-2"
                  onClick={() => navigate("/reseller/customers/new")}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Customer
                </Button>
              </div>
            </div>

            {selectedIds.length ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50/80 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedIds.length} customer
                    {selectedIds.length > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-xs text-gray-600">
                    Pause multiple customers, assign a plan, or send a campaign
                    in one go.
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
                    className="text-red-500 hover:bg-white"
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
                    checked={
                      allOnPageSelected
                        ? true
                        : hasSomeSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) =>
                      toggleSelectAll(checked === true)
                    }
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
              {/* 🔄 LOADING */}
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b animate-pulse">
                    <td className="py-4 pr-3">
                      <div className="h-4 w-4 bg-gray-200 rounded" />
                    </td>

                    <td className="py-4">
                      <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-24 bg-gray-100 rounded" />
                    </td>

                    <td>
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </td>
                    <td>
                      <div className="h-4 w-10 bg-gray-200 rounded" />
                    </td>
                    <td>
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                    </td>
                    <td>
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </td>
                    <td>
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                    </td>
                    <td>
                      <div className="h-4 w-16 bg-gray-200 rounded-full" />
                    </td>

                    <td className="text-right">
                      <div className="h-8 w-16 bg-gray-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : items.length ? (
                /* ✅ DATA */
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b transition ${
                      selectedIds.includes(item.id)
                        ? "bg-green-50/60"
                        : "hover:bg-gray-50"
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
                      <p className="text-xs text-gray-500">
                        {item.owner?.email}
                      </p>
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
                    {/* STATUS */}
                    <td>
                      <div className="relative inline-block">
                        {/* STATUS CHIP */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === `status-${item.id}`
                                ? null
                                : `status-${item.id}`,
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                            item.computedStatus === "active"
                              ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                              : item.computedStatus === "trial"
                                ? "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                : item.computedStatus === "suspended"
                                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  : item.computedStatus === "expired"
                                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                    : item.computedStatus ===
                                        "pending_verification"
                                      ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                      : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />

                          {item.computedStatus
                            ? item.computedStatus
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase())
                            : item.isActive
                              ? "Active"
                              : "Paused"}

                          <ChevronDown className="h-3 w-3 opacity-60" />
                        </button>

                        {/* DROPDOWN */}
                        {openMenuId === `status-${item.id}` && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                          >
                            {[
                              {
                                label: "Active",
                                value: "ACTIVE",
                                className: "text-green-700 hover:bg-green-50",
                              },
                              {
                                label: "Paused",
                                value: "PAUSED",
                                className: "text-gray-700 hover:bg-gray-50",
                              },
                              {
                                label: "Suspended",
                                value: "SUSPENDED",
                                className: "text-red-700 hover:bg-red-50",
                              },
                              {
                                label: "Expired",
                                value: "EXPIRED",
                                className: "text-rose-700 hover:bg-rose-50",
                              },
                              {
                                label: "Trial",
                                value: "TRIAL",
                                className: "text-yellow-700 hover:bg-yellow-50",
                              },
                              {
                                label: "Pending Verification",
                                value: "PENDING_VERIFICATION",
                                className: "text-sky-700 hover:bg-sky-50",
                              },
                            ].map((status) => (
                              <button
                                key={status.value}
                                onClick={() => {
                                  updateCustomerStatus(
                                    item,
                                    status.value as
                                      | "ACTIVE"
                                      | "PAUSED"
                                      | "SUSPENDED"
                                      | "EXPIRED"
                                      | "TRIAL"
                                      | "PENDING_VERIFICATION",
                                  );

                                  setOpenMenuId(null);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium transition ${status.className}`}
                              >
                                <span>{status.label}</span>

                                {(
                                  item.computedStatus || "active"
                                ).toUpperCase() === status.value && (
                                  <div className="h-2 w-2 rounded-full bg-current" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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
                              {/* <button
                                className={`w-full text-left px-4 py-2 text-sm font-medium ${
                                  item.computedStatus === "active" ||
                                  item.computedStatus === "trial"
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-[#16A249] hover:bg-green-50"
                                }`}
                                onClick={() => {
                                  updateCustomerStatus(
                                    item,
                                    item.computedStatus === "active" ||
                                      item.computedStatus === "trial"
                                      ? "PAUSED"
                                      : "ACTIVE",
                                  );
                                  setOpenMenuId(null);
                                }}
                              >
                                {item.computedStatus === "active" ||
                                item.computedStatus === "trial"
                                  ? "Pause account"
                                  : "Reactivate account"}
                              </button> */}

                              {/* <button
                                className="w-full text-left px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  updateCustomerStatus(item, "SUSPENDED");
                                  setOpenMenuId(null);
                                }}
                              >
                                Suspend account
                              </button> */}

                              {/* <button
                                className="w-full text-left px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                                onClick={() => {
                                  updateCustomerStatus(
                                    item,
                                    "PENDING_VERIFICATION",
                                  );
                                  setOpenMenuId(null);
                                }}
                              >
                                Pending verification
                              </button> */}

                              {/* <button
                                className="w-full text-left px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                  updateCustomerStatus(item, "EXPIRED");
                                  setOpenMenuId(null);
                                }}
                              >
                                Expire trial
                              </button> */}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* EMPTY STATE */
                <tr>
                  <td colSpan={9} className="py-14">
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
                        Try adjusting your filters or create a new customer to
                        get started
                      </p>

                      {/* ACTION BUTTON */}
                      <Button
                        className="mt-4 bg-[#16A249] text-white hover:bg-[#12813a] rounded-xl px-5"
                        onClick={() => navigate("/reseller/customers/new")}
                      >
                        + Add Customer
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-6 px-4 py-3 rounded-xl border bg-gray-50">
            {/* INFO */}
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-900">{page}</span> of{" "}
              <span className="font-medium text-gray-900">
                {pagination.totalPages}
              </span>
            </p>

            {/* CONTROLS */}
            <div className="flex items-center gap-2">
              {/* PREV */}
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition
        ${
          page === 1
            ? "text-gray-400 border-gray-200 bg-white cursor-not-allowed"
            : "text-gray-700 bg-white hover:bg-gray-100"
        }`}
              >
                ← Prev
              </button>

              {/* CURRENT */}
              <span className="px-3 py-1.5 text-sm rounded-lg bg-[#16A249]/10 text-[#16A249] font-medium">
                {page}
              </span>

              {/* NEXT */}
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition
        ${
          page >= pagination.totalPages
            ? "text-gray-400 border-gray-200 bg-white cursor-not-allowed"
            : "text-gray-700 bg-white hover:bg-gray-100"
        }`}
              >
                Next →
              </button>
            </div>
          </div>
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

          {activeAction === "changePlan" ||
          activeAction === "bulkChangePlan" ? (
            <div className="space-y-5 pt-4">
              {activeAction === "bulkChangePlan" ? (
                <div className="rounded-xl border bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">
                    Selected customers
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedIds.length} account
                    {selectedIds.length > 1 ? "s" : ""} will receive the new
                    plan.
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

              {/* PLAN PREVIEW */}
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
                  <Label className="text-sm text-gray-700">
                    Recipient phone
                  </Label>

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
                    Campaign will be sent to each selected customer's primary
                    owner phone.
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
