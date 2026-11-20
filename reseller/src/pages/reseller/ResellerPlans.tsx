import { useEffect, useMemo, useState } from "react";
import { getAuthToken } from "@/utils/authStorage";
import {
  ArrowRight,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Layers3,
  Loader2,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { ResellerShell } from "@/components/reseller/ResellerShell";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  maxTemplates: number;
  maxBots: number | null;
  monthlyMessageLimit: number | null;
  isActive: boolean;
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    monthlyRevenue: number;
  };
  customers: Array<{
    id: string;
    companyName: string;
    isActive: boolean;
  }>;
};

const gradients: Record<string, string> = {
  starter:
    "from-sky-500/10 via-cyan-500/5 to-transparent border-sky-200 dark:border-sky-900/50",
  growth:
    "from-emerald-500/10 via-green-500/5 to-transparent border-emerald-200 dark:border-emerald-900/50",
  scale:
    "from-orange-500/10 via-amber-500/5 to-transparent border-orange-200 dark:border-orange-900/50",
};

export default function ResellerPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/reseller/plans?page=${page}&limit=10&search=${debouncedSearch}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        setPlans(json.data.list);
        setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const stats = useMemo(() => {
    const totalRevenue = plans.reduce(
      (acc, curr) => acc + curr.stats.monthlyRevenue,
      0,
    );

    const totalCustomers = plans.reduce(
      (acc, curr) => acc + curr.stats.activeCustomers,
      0,
    );

    const activePlans = plans.filter((p) => p.isActive).length;

    const topPlan =
      plans.sort((a, b) => b.stats.monthlyRevenue - a.stats.monthlyRevenue)[0]
        ?.name || "-";

    return {
      totalRevenue,
      totalCustomers,
      activePlans,
      topPlan,
    };
  }, [plans]);

  return (
    <ResellerShell title="Plan Catalogue" eyebrow="Commercial Offers">
      <div className="space-y-6">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#16A249] via-[#11913f] to-[#0c6d2f] p-8 text-white shadow-xl dark:border-slate-800">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur">
                <Sparkles size={14} />
                Revenue Optimized Plans
              </div>

              <h1 className="text-2xl font-bold tracking-tight">
                Manage subscription plans like a premium SaaS.
              </h1>

              <p className="mt-4 text-xs text-emerald-50/90 lg:text-base">
                Track customer subscriptions, monthly revenue, active plans, and
                plan performance from one unified reseller dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:w-[420px]">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-white/70">
                    Monthly Revenue
                  </p>

                  <Wallet size={18} />
                </div>

                <h3 className="mt-3 text-[22px] font-bold">
                  ₹{stats.totalRevenue.toLocaleString()}
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-white/70">
                    Customers
                  </p>

                  <Users size={18} />
                </div>

                <h3 className="mt-3 text-3xl font-bold">
                  {stats.totalCustomers}
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-white/70">
                    Active Plans
                  </p>

                  <Layers3 size={18} />
                </div>

                <h3 className="mt-3 text-3xl font-bold">{stats.activePlans}</h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-white/70">
                    Top Plan
                  </p>

                  <TrendingUp size={18} />
                </div>

                <h3 className="mt-3 text-2xl font-bold truncate">
                  {stats.topPlan}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Commercial Plans
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Monitor subscriptions, revenue, and customer distribution.
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plans..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#16A249] focus:bg-white focus:ring-4 focus:ring-[#16A249]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-8 h-10 w-40 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : plans.length ? (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {plans.map((plan, index) => {
              const key = plan.name.toLowerCase();
              const gradient = gradients[key] || gradients.starter;

              return (
                <div
                  key={plan.id}
                  className={`
        group relative overflow-hidden rounded-[30px]
        border border-slate-200/70
        bg-gradient-to-br ${gradient}
        bg-white/95 p-5
        transition-all duration-300
        hover:-translate-y-1
        hover:border-[#16A249]/30
        dark:border-slate-800 dark:bg-slate-900/95
        `}
                >
                  {/* BACKGROUND */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%)]" />

                  {/* TOP BADGE */}
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#16A249]/10 px-2.5 py-1 text-[10px] font-medium text-[#16A249]">
                        SaaS Plan
                      </div>

                      <h3 className="mt-3 text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                        {plan.description ||
                          "Perfect for scaling WhatsApp customer engagement."}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#16A249]/10 text-[#16A249]">
                      <CreditCard size={20} />
                    </div>
                  </div>

                  {/* PRICE */}
                  <div className="relative z-10 mt-5 flex items-end gap-1.5">
                    <span className="text-[34px] font-black tracking-tight text-slate-900 dark:text-white">
                      ₹{plan.price.toLocaleString()}
                    </span>

                    <span className="mb-1 text-[12px] font-medium text-slate-500">
                      /month
                    </span>
                  </div>

                  {/* FEATURES */}
                  <div className="relative z-10 mt-5 grid grid-cols-3 gap-2.5">
                    {[
                      {
                        label: "Templates",
                        value: plan.maxTemplates,
                        icon: Layers3,
                      },
                      {
                        label: "Bots",
                        value: plan.maxBots ?? "∞",
                        icon: Bot,
                      },
                      {
                        label: "Messages",
                        value:
                          plan.monthlyMessageLimit?.toLocaleString() || "∞",
                        icon: MessageCircle,
                      },
                    ].map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="
                rounded-[20px]
                border border-slate-200/70
                bg-white/90 p-3
                dark:border-slate-700 dark:bg-slate-800/80
                "
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16A249]/10 text-[#16A249]">
                            <Icon size={16} />
                          </div>

                          <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            {item.label}
                          </p>

                          <p className="mt-1 truncate text-[15px] font-bold text-slate-900 dark:text-white">
                            {item.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* ANALYTICS */}
                  <div
                    className="
          relative z-10 mt-5 rounded-[24px]
          border border-slate-200/70
          bg-white/95 p-4
          dark:border-slate-800 dark:bg-slate-800/80
          "
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                          Revenue
                        </p>

                        <h4 className="mt-2 text-[24px] font-bold tracking-tight text-[#16A249]">
                          ₹{plan.stats.monthlyRevenue.toLocaleString()}
                        </h4>
                      </div>

                      <div className="rounded-[18px] bg-[#16A249]/10 px-3 py-2 text-right">
                        <p className="text-[9px] uppercase tracking-wide text-[#16A249]/70">
                          Customers
                        </p>

                        <p className="mt-1 text-[18px] font-bold text-[#16A249]">
                          {plan.stats.activeCustomers}
                        </p>
                      </div>
                    </div>

                    {/* OCCUPANCY */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-500">
                          Occupancy
                        </span>

                        <span className="text-[10px] font-bold text-[#16A249]">
                          {Math.min(plan.stats.activeCustomers * 10, 100)}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-[#16A249]"
                          style={{
                            width: `${Math.min(
                              plan.stats.activeCustomers * 10,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="relative z-10 mt-5 flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsDrawerOpen(true);
                      }}
                      className="
            flex-1 rounded-[20px]
            bg-[#16A249]
            px-4 py-3
            text-[13px] font-semibold text-white
            transition-all duration-200
            hover:bg-[#11853c]
            "
                    >
                      View Customers
                    </button>

                    {/* <button
            className="
            flex h-[48px] w-[48px] items-center justify-center
            rounded-[18px]
            border border-slate-200
            bg-white text-slate-700
            transition-all duration-200
            hover:border-[#16A249]/30
            hover:bg-[#16A249]/5
            dark:border-slate-700 dark:bg-slate-800
            dark:text-slate-200
            "
          >
            <ArrowRight size={16} />
          </button> */}
                  </div>

                  {/* FOOTER */}
                  <div className="relative z-10 mt-5 flex items-center justify-between border-t border-slate-200/70 pt-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          plan.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />

                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {plan.isActive ? "Active Plan" : "Inactive"}
                      </span>
                    </div>

                    <span className="text-[10px] font-medium text-slate-400">
                      {plan.stats.totalCustomers} customers
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-20 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
              <Layers3 className="h-8 w-8 text-[#16A249]" />
            </div>

            <h3 className="mt-6 text-[20px] font-bold text-slate-900 dark:text-white">
              No Plans Found
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
              No commercial plans are currently available. Try changing your
              search query.
            </p>
          </div>
        )}

        {/* PAGINATION */}
        <div
          className="
  relative overflow-hidden rounded-[28px]
  border border-slate-200/70
  bg-white/95 p-4
  dark:border-slate-800 dark:bg-slate-900/95
  "
        >
          {/* BACKGROUND */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(22,162,73,0.05),transparent_28%)]" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              {/* ICON */}
              <div
                className="
        flex h-11 w-11 items-center justify-center
        rounded-[18px]
        bg-[#16A249]/10 text-[#16A249]
        "
              >
                <Layers3 className="h-4.5 w-4.5" />
              </div>

              {/* TEXT */}
              <div>
                {/* <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
          Pagination
        </p> */}

                <div className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300">
                  <span>Page</span>

                  <span
                    className="
            rounded-lg bg-[#16A249]/10
            px-2 py-0.5
            text-[12px] font-semibold text-[#16A249]
            "
                  >
                    {page}
                  </span>

                  <span>of</span>

                  <span
                    className="
            rounded-lg bg-slate-100
            px-2 py-0.5
            text-[12px] font-semibold text-slate-700
            dark:bg-slate-800 dark:text-slate-200
            "
                  >
                    {pagination.totalPages}
                  </span>
                </div>
              </div>
            </div>

            {/* CONTROLS */}
            <div
              className="
      flex items-center gap-1.5
      rounded-[22px]
      border border-slate-200/70
      bg-slate-50/80 p-1.5
      dark:border-slate-700 dark:bg-slate-800/70
      "
            >
              {/* PREVIOUS */}
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="
        group flex h-10 items-center gap-1.5
        rounded-[16px]
        px-3 text-[12px] font-medium text-slate-600
        transition-all duration-200
        hover:bg-white
        disabled:pointer-events-none disabled:opacity-40
        dark:text-slate-300 dark:hover:bg-slate-700
        "
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />

                <span className="hidden sm:block">Prev</span>
              </button>

              {/* PAGE NUMBERS */}
              <div className="flex items-center gap-1">
                {Array.from({
                  length: Math.min(5, pagination.totalPages),
                }).map((_, index) => {
                  let pageNumber = page - 2 + index;

                  if (page <= 3) {
                    pageNumber = index + 1;
                  }

                  if (page >= pagination.totalPages - 2) {
                    pageNumber = pagination.totalPages - 4 + index;
                  }

                  if (pageNumber < 1 || pageNumber > pagination.totalPages) {
                    return null;
                  }

                  const isActive = pageNumber === page;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`
              flex h-10 min-w-[40px] items-center justify-center
              rounded-[14px]
              text-[12px] font-semibold
              transition-all duration-200
              ${
                isActive
                  ? "bg-[#16A249] text-white"
                  : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
              }
              `}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* NEXT */}
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="
        group flex h-10 items-center gap-1.5
        rounded-[16px]
        px-3 text-[12px] font-medium text-slate-600
        transition-all duration-200
        hover:bg-white
        disabled:pointer-events-none disabled:opacity-40
        dark:text-slate-300 dark:hover:bg-slate-700
        "
              >
                <span className="hidden sm:block">Next</span>

                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* OVERLAY */}
        {isDrawerOpen && (
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          />
        )}

        {/* DRAWER */}
        <div
          className={`
  fixed right-0 top-0 z-50 h-full w-full max-w-[500px]
  border-l border-slate-200/70 
  bg-white/95 backdrop-blur-2xl 
  transition-all duration-300
  dark:border-slate-800 dark:bg-[#020617]/95 
  ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}
  `} 
        >
          {/* BACKGROUND */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(22,162,73,0.05),transparent_28%)]" />

          {/* HEADER */}
          <div
            className="
    sticky top-0 z-20
    border-b border-slate-200/70
    bg-white/90 backdrop-blur-xl
    dark:border-slate-800 dark:bg-[#020617]/90
    "
          >
            {/* TOP */}
            <div className="flex items-start justify-between px-5 pt-5">
              <div>
                {/* BADGE */}
                <div
                  className="
          inline-flex items-center gap-2
          rounded-full
          border border-[#16A249]/10
          bg-[#16A249]/5
          px-2.5 py-1
          text-[10px] font-semibold uppercase
          tracking-[0.18em]
          text-[#16A249]
          "
                >
                  <Sparkles size={10} />
                  Plan Customers
                </div>

                {/* TITLE */}
                <h2 className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
                  {selectedPlan?.name}
                </h2>

                {/* DESCRIPTION */}
                <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                  Businesses subscribed to this commercial plan.
                </p>
              </div>

              {/* CLOSE */}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="
        flex h-10 w-10 items-center justify-center
        rounded-2xl border border-slate-200
        bg-white text-slate-500
        transition-all duration-200
        hover:border-[#16A249]/20
        hover:bg-[#16A249]/5
        hover:text-[#16A249]
        dark:border-slate-700 dark:bg-slate-900
        dark:text-slate-300 dark:hover:bg-slate-800
        "
              >
                <X size={16} />
              </button>
            </div>

            {/* STATS */}
            <div className="mt-5 grid grid-cols-2 gap-3 px-5 pb-5">
              {/* ACTIVE */}
              <div
                className="
        rounded-[24px]
        border border-slate-200/70
        bg-white/80 p-4
        dark:border-slate-800 dark:bg-slate-900/70
        "
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Active Customers
                  </p>

                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#16A249]/10">
                    <Users className="h-4 w-4 text-[#16A249]" />
                  </div>
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <h3 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
                    {selectedPlan?.stats.activeCustomers || 0}
                  </h3>

                  <span className="pb-1 text-[11px] text-slate-400">
                    customers
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[45%] rounded-full bg-[#16A249]" />
                </div>
              </div>

              {/* REVENUE */}
              <div
                className="
        rounded-[24px]
        border border-slate-200/70
        bg-white/80 p-4
        dark:border-slate-800 dark:bg-slate-900/70
        "
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Revenue
                  </p>

                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#16A249]/10">
                    <Wallet className="h-4 w-4 text-[#16A249]" />
                  </div>
                </div>

                <h3 className="mt-4 text-[28px] font-bold tracking-tight text-[#16A249]">
                  ₹{selectedPlan?.stats.monthlyRevenue.toLocaleString() || 0}
                </h3>

                <p className="mt-2 text-[11px] text-slate-500">
                  Monthly recurring revenue
                </p>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="h-[calc(100vh-220px)] overflow-y-auto px-5 py-5">
            {/* SEARCH */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search customers..."
                className="
        h-11 w-full rounded-[18px]
        border border-slate-200
        bg-slate-50 pl-10 pr-4
        text-[13px]
        outline-none transition-all
        focus:border-[#16A249]
        focus:bg-white
        dark:border-slate-700 dark:bg-slate-900
        dark:text-white
        "
              />
            </div>

            {/* LIST */}
            {selectedPlan?.customers?.length ? (
              <div className="space-y-3">
                {selectedPlan.customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="
            group rounded-[24px]
            border border-slate-200/70
            bg-white/90 p-4
            transition-all duration-200
            hover:border-[#16A249]/20
            dark:border-slate-800 dark:bg-slate-900/80
            "
                  >
                    {/* TOP */}
                    <div className="flex items-start justify-between gap-3">
                      {/* LEFT */}
                      <div className="flex min-w-0 items-center gap-3">
                        {/* AVATAR */}
                        <div
                          className="
                  flex h-12 w-12 shrink-0 items-center justify-center
                  rounded-[18px]
                  bg-[#16A249]/10
                  text-[15px] font-bold text-[#16A249]
                  "
                        >
                          {customer.companyName.charAt(0)}
                        </div>

                        {/* INFO */}
                        <div className="min-w-0">
                          <h4 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                            {customer.companyName}
                          </h4>

                          <p className="mt-1 text-[11px] text-slate-500">
                            Business subscription active
                          </p>

                          {/* TAGS */}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                              <Building2 className="h-3 w-3 text-slate-400" />

                              <span className="text-[10px] font-medium text-slate-500">
                                Business
                              </span>
                            </div>

                            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                              <CreditCard className="h-3 w-3 text-slate-400" />

                              <span className="text-[10px] font-medium text-slate-500">
                                Subscription
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* STATUS */}
                      <div
                        className={`
                rounded-full px-2.5 py-1
                text-[10px] font-medium
                ${
                  customer.isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }
                `}
                      >
                        {customer.isActive ? "Active" : "Paused"}
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        Customer Account
                      </div>

                      <button
                        className="
                inline-flex items-center gap-1
                text-[11px] font-semibold text-[#16A249]
                transition-all duration-200
                hover:gap-2
                "
                      >
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="
        flex h-[60vh] flex-col items-center justify-center
        rounded-[30px]
        border border-dashed border-slate-200
        bg-slate-50/70 px-6 text-center
        dark:border-slate-800 dark:bg-slate-900
        "
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-800">
                  <Building2 className="h-6 w-6 text-slate-400" />
                </div>

                <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  No Customers Yet
                </h3>

                <p className="mt-2 max-w-sm text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                  No customers are currently subscribed to this plan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ResellerShell>
  );
}
