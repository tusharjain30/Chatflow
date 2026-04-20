import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BadgePercent,
  Building2,
  MessageSquareText,
  Sparkles,
  Users,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { Chart, registerables } from "chart.js";
import { ResellerShell } from "@/components/reseller/ResellerShell";

Chart.register(...registerables);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/* ─── Types ─────────────────────────────────────────────────────────────── */

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
    owner: { firstName: string; lastName: string; email: string } | null;
    subscription: {
      plan?: { name?: string; price?: number; currency?: string };
    } | null;
    counts: { contacts: number; campaigns: number };
  }>;
  revenueByPlan: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    customers: number;
    revenue: number;
  }>;
  revenueTrend: Array<{ month: string; revenue: number; commission: number }>;
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
    account: { companyName: string };
  }>;
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt = (n: number | undefined) => Number(n ?? 0).toLocaleString("en-IN");

const fmtINR = (n: number | undefined) => "INR " + fmt(n);

function initials(first?: string, last?: string) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="relative rounded-2xl border bg-white px-5 py-4 shadow-sm hover:shadow-md transition">
      {/* LEFT ACCENT */}
      <div className="absolute inset-y-0 left-0 w-[3px] bg-[#16A249] rounded-l-full" />

      <div className="absolute top-4 right-4 text-gray-300">
        <Icon size={16} />
      </div>

      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </p>

      <p className="text-xl font-semibold text-gray-900">{value}</p>

      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function MixTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-neutral-50 dark:bg-[#232220] px-4 py-3.5">
      <p className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="font-serif text-3xl font-medium mt-1 text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
    </div>
  );
}

function CustomerRow({
  customer,
}: {
  customer: Overview["recentCustomers"][number];
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-neutral-50 dark:bg-[#232220] px-4 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-[#2d2c29]">
      <div className="w-9 h-9 rounded-full bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center text-[13px] font-medium font-mono shrink-0">
        {customer.owner
          ? initials(customer.owner.firstName, customer.owner.lastName)
          : "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
          {customer.companyName}
        </p>
        <p className="font-mono text-[11px] text-neutral-400 mt-0.5 truncate">
          {customer.owner
            ? `${customer.owner.email} · ${fmt(customer.counts.contacts)} contacts`
            : "No owner"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span
          className={`
            rounded-full px-2.5 py-0.5 text-[11px] font-medium font-mono
            ${
              customer.isActive
                ? "bg-green-50 text-[#16A249] dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
            }
          `}
        >
          {customer.isActive ? "Active" : "Paused"}
        </span>
        <p className="font-mono text-[11px] text-neutral-400 mt-1">
          {customer.subscription?.plan?.name ?? "No plan"}
        </p>
      </div>
    </div>
  );
}

function PlanRow({
  plan,
  maxRevenue,
}: {
  plan: Overview["revenueByPlan"][number];
  maxRevenue: number;
}) {
  const pct = Math.round((plan.revenue / Math.max(maxRevenue, 1)) * 100);
  return (
    <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-neutral-50 dark:bg-[#232220] px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
            {plan.name}
          </p>
          <p className="font-mono text-[11px] text-neutral-400 mt-0.5">
            {plan.customers} customers
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-[1.05rem] font-medium text-neutral-900 dark:text-neutral-100">
            {plan.currency} {fmt(plan.revenue)}
          </p>
          <p className="font-mono text-[11px] text-neutral-400 mt-0.5">
            {plan.currency} {fmt(plan.price)}/mo
          </p>
        </div>
      </div>
      <div className="mt-2.5 h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-600 dark:bg-green-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SubscriptionRow({
  sub,
}: {
  sub: Overview["recentSubscriptions"][number];
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-neutral-50 dark:bg-[#232220] px-4 py-3">
      <div>
        <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
          {sub.companyName}
        </p>
        <p className="font-mono text-[11px] text-neutral-400 mt-0.5">
          {sub.planName}
        </p>
      </div>
      <p className="font-mono text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
        {sub.currency} {fmt(sub.amount)}
      </p>
    </div>
  );
}

function MessageRow({ msg }: { msg: Overview["recentMessages"][number] }) {
  const statusClass =
    msg.status === "delivered"
      ? "bg-green-50 text-[#16A249] dark:text-emerald-400"
      : msg.status === "failed"
        ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
        : "bg-green-50 dark:bg-green-950 text-blue-700 dark:text-blue-400";

  return (
    <div className="flex items-center justify-between rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-neutral-50 dark:bg-[#232220] px-4 py-3">
      <div>
        <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
          {msg.account.companyName}
        </p>
        <p className="font-mono text-[11px] text-neutral-400 mt-0.5">
          {msg.direction} · {msg.to}
        </p>
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium font-mono ${statusClass}`}
      >
        {msg.status}
      </span>
    </div>
  );
}

/* ─── Trend Chart ────────────────────────────────────────────────────────── */

function TrendChart({ data }: { data: Overview["revenueTrend"] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;
    chartRef.current?.destroy();
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const textColor = isDark ? "#6b6864" : "#9ca3af";

    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: "Revenue",
            data: data.map((d) => d.revenue),
            borderColor: "#16A249",
            backgroundColor: "rgba(22,162,73,0.08)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "#2563eb",
          },
          {
            label: "Commission",
            data: data.map((d) => d.commission),
            borderColor: "#059669",
            backgroundColor: "rgba(5,150,105,0.07)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "#059669",
            borderDash: [4, 3],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) =>
                `${c.dataset.label}: INR ${Number(c.parsed.y).toLocaleString("en-IN")}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 10, family: "'DM Mono', monospace" },
            },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 10, family: "'DM Mono', monospace" },
              callback: (v) =>
                "₹" +
                (Number(v) >= 1000 ? Math.round(Number(v) / 1000) + "k" : v),
            },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Monthly revenue and commission trend"
    />
  );
}

/* ─── Donut Chart ────────────────────────────────────────────────────────── */

function DonutChart({
  active,
  inactive,
}: {
  active: number;
  inactive: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: ["Active", "Inactive"],
        datasets: [
          {
            data: [active, inactive],
            backgroundColor: ["#16A249", "#e5e7eb"],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed}` } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [active, inactive]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={`Active vs inactive customers: ${active} active, ${inactive} inactive`}
    />
  );
}

/* ─── Section wrapper ────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-2.5">
      {children}
    </p>
  );
}

/* ─── Main dashboard ─────────────────────────────────────────────────────── */

function ResellerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_BASE}/reseller/dashboard/stats`, { headers }).then((r) =>
        r.json(),
      ),
      fetch(`${API_BASE}/reseller/dashboard/overview`, { headers }).then((r) =>
        r.json(),
      ),
    ])
      .then(([sJson, oJson]) => {
        if (sJson.status === 1) setStats(sJson.data);
        if (oJson.status === 1) setOverview(oJson.data);
      })
      .catch(console.error);
  }, []);

  const kpis = [
    {
      label: "Total customers",
      value: fmt(stats?.totalCustomers),
      sub: "accounts registered",
      accent: "#2563eb",
      icon: Building2,
    },
    {
      label: "Active accounts",
      value: fmt(stats?.activeCustomers),
      sub: "currently live",
      accent: "#059669",
      icon: Activity,
    },
    {
      label: "Team members",
      value: fmt(stats?.totalTeamMembers),
      sub: "across all orgs",
      accent: "#7c3aed",
      icon: Users,
    },
    {
      label: "Messages tracked",
      value: fmt(stats?.totalMessages),
      sub: "total volume",
      accent: "#0891b2",
      icon: MessageSquareText,
    },
    {
      label: "Monthly revenue",
      value: fmtINR(stats?.monthlyRevenue),
      sub: "INR current month",
      accent: "#b45309",
      icon: Wallet,
    },
    {
      label: "Commission earned",
      value: fmtINR(stats?.commissionEarned),
      sub: "INR total",
      accent: "#be123c",
      icon: BadgePercent,
    },
  ] as const;

  const maxRevenue = Math.max(
    ...(overview?.revenueByPlan?.map((p) => p.revenue) ?? [1]),
  );

  return (
    <ResellerShell title="Portfolio overview" eyebrow="Reseller Command">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Account mix + Payout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-4 mb-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="font-serif text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <span className="opacity-40 text-sm">🗂</span> Account mix
          </p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <MixTile label="Active" value={fmt(stats?.activeCustomers)} />
            <MixTile label="Inactive" value={fmt(stats?.inactiveCustomers)} />
            <MixTile
              label="Subscriptions"
              value={fmt(stats?.totalSubscriptions)}
            />
          </div>

          <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-4">
            <SectionLabel>Revenue trend</SectionLabel>
            <div className="flex gap-4 font-mono text-[11px] text-neutral-400 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                Commission
              </span>
            </div>
            <div className="relative h-44">
              {overview?.revenueTrend?.length ? (
                <TrendChart data={overview.revenueTrend} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-neutral-400">
                  Loading…
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-transparent bg-green-50 dark:bg-blue-950/30 p-5">
          <p className="font-serif text-base font-medium text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="opacity-60" /> Payout snapshot
          </p>
          <p className="font-mono text-[11px] text-neutral-400 mb-1 uppercase tracking-wider">
            Wallet balance
          </p>
          <p className="font-serif text-[1.9rem] font-medium text-blue-700 dark:text-blue-400 leading-none">
            {fmtINR(stats?.walletBalance)}
          </p>

          <div className="mt-4 bg-white/50 dark:bg-black/20 rounded-xl px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                Active plans
              </p>
              <p className="font-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">
                {stats?.activePlans ?? "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                Subscriptions
              </p>
              <p className="font-serif text-2xl font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">
                {stats?.totalSubscriptions ?? "—"}
              </p>
            </div>
          </div>

          <div className="border-t border-black/[0.06] dark:border-white/[0.06] mt-4 pt-4">
            <SectionLabel>Active vs inactive split</SectionLabel>
            <div className="relative h-28">
              {stats ? (
                <DonutChart
                  active={stats.activeCustomers}
                  inactive={stats.inactiveCustomers}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-neutral-400">
                  Loading…
                </div>
              )}
            </div>
            <div className="flex gap-4 font-mono text-[11px] text-neutral-400 mt-2 justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-300 inline-block" />
                Inactive
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent customers + Revenue by plan */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4 mb-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="font-serif text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Building2 size={14} className="opacity-40" /> Recent customers
          </p>
          <div className="space-y-2">
            {overview?.recentCustomers?.map((c) => (
              <CustomerRow key={c.id} customer={c} />
            )) ?? (
              <p className="font-mono text-xs text-neutral-400">Loading…</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="font-serif text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Sparkles size={14} className="opacity-40" /> Revenue by plan
          </p>
          <div className="space-y-2">
            {overview?.revenueByPlan?.map((p) => (
              <PlanRow key={p.id} plan={p} maxRevenue={maxRevenue} />
            )) ?? (
              <p className="font-mono text-xs text-neutral-400">Loading…</p>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions + Messages */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="font-serif text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            Recent subscriptions
          </p>
          <div className="space-y-2">
            {overview?.recentSubscriptions?.map((s) => (
              <SubscriptionRow key={s.id} sub={s} />
            )) ?? (
              <p className="font-mono text-xs text-neutral-400">Loading…</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquareText size={16} className="text-[#16A249]" />
            Message activity
          </p>

          <div className="space-y-2">
            {!overview ? (
              // 🔄 LOADING
              <p className="text-sm text-gray-400">Loading...</p>
            ) : overview.recentMessages?.length === 0 ? (
              // ❌ EMPTY STATE
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-green-200 bg-green-50 py-8 text-center">
                <MessageSquareText className="h-8 w-8 text-[#16A249] mb-2" />

                <p className="text-sm font-medium text-gray-800">
                  No messages yet
                </p>

                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Once messages are sent or received, they will appear here.
                </p>
              </div>
            ) : (
              // ✅ DATA
              overview.recentMessages.map((m) => (
                <MessageRow key={m.id} msg={m} />
              ))
            )}
          </div>
        </div>
      </div>
    </ResellerShell>
  );
}

export default ResellerDashboard;
