import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  Building2,
  Megaphone,
  ClipboardList,
  ContactRound,
  CreditCard,
  FileText,
  LayoutDashboard,
  Layers3,
  PlusCircle,
  Settings,
  Users,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { FiLogOut } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const items = [
  { to: "/reseller", label: "Overview", icon: LayoutDashboard },
  // { to: "/reseller/customers/new", label: "Add Customer", icon: PlusCircle },
  { to: "/reseller/customers", label: "Customers", icon: Building2 },
  { to: "/reseller/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/reseller/templates", label: "Templates", icon: FileText },
  { to: "/reseller/contacts", label: "Contacts", icon: ContactRound },
  { to: "/reseller/contact-groups", label: "Contact Groups", icon: Layers3 },
  { to: "/reseller/plans", label: "Plans", icon: CreditCard },
  { to: "/reseller/earnings", label: "Earnings", icon: TrendingUp },
  { to: "/reseller/billing", label: "Billing / Transactions", icon: FileText },
  { to: "/reseller/team/list", label: "Team", icon: Users },
  { to: "/reseller/audit", label: "Audit Logs", icon: ClipboardList },
  { to: "/reseller/settings", label: "Settings", icon: Settings },
];

export function ResellerShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const { user, logout, isSupportSessionActive, restoreSupportSession, supportSession } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r bg-white px-4 py-4 shadow-sm lg:flex overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {/* LOGO */}
          <Link to="/reseller" className="mb-6 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16A249] text-white shadow">
              <ChartNoAxesCombined className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                Reseller Hub
              </p>
              <p className="text-[10px] text-gray-500">
                Partner control center
              </p>
            </div>
          </Link>

          {/* NAV */}
          <nav className="space-y-3">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/reseller"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                    isActive
                      ? "bg-[#16A249] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[13px]">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* FOOTER CARD */}
          <div className="mt-auto pt-4">
            <div className="rounded-xl border bg-gray-50 p-3 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Wallet balance</p>
                  <p className="text-sm font-semibold text-gray-900">
                    INR {(user?.balance ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-center gap-2 rounded-lg border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs py-2"
                onClick={() => {
                  logout();
                  navigate("/reseller/login");
                }}
              >
                <FiLogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:ml-72 bg-gray-50 min-h-screen">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {isSupportSessionActive ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Support session active for reseller workspace
                    </p>
                    <p className="text-xs text-amber-800">
                      You entered from {supportSession?.originPortal === "admin" ? "super admin" : "support"} panel {supportSession?.originLabel || supportSession?.adminName || "Support"}. Use back to dashboard to return safely.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-amber-300 bg-white text-amber-800 hover:bg-amber-100 md:w-auto"
                    onClick={restoreSupportSession}
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Back to dashboard
                  </Button>
                </div>
              </div>
            ) : null}
            {/* TOP BAR */}
            <div className="flex items-center justify-between mb-6">
              {/* LEFT: Breadcrumb + Title */}
              <div className="space-y-1">
                {eyebrow && (
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#16A249]">
                    {eyebrow}
                  </p>
                )}

                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                  {title}
                </h1>

                <p className="text-[13px] text-gray-500 max-w-xl">
                  Manage your customer portfolio, monitor subscription
                  performance, and keep partner operations moving efficiently.
                </p>
              </div>

              {/* RIGHT: USER */}
              <div className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 transition-all duration-200 hover:border-[#16A249] hover:bg-gray-50 cursor-pointer">
                {/* Avatar */}
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#16A249]/15 to-[#16A249]/5 text-[#16A249] font-semibold text-sm">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}

                  {/* Status dot */}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                </div>

                {/* Info */}
                <div className="flex flex-col leading-tight">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#16A249] transition">
                    {user?.firstName} {user?.lastName}
                  </p>

                  <p className="text-[11px] text-gray-500 truncate max-w-[150px]">
                    {user?.companyName || user?.email}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 mx-1" />

                {/* Status Label */}
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Online
                </div>

                {/* Arrow (interaction hint) */}
                <svg
                  className="ml-1 h-4 w-4 text-gray-400 group-hover:text-[#16A249] transition"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-gray-200 mb-6" />

            {/* PAGE CONTENT */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
