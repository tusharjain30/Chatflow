import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ChartNoAxesCombined,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  PlusCircle,
  Settings,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { FiLogOut } from "react-icons/fi";

const items = [
  { to: "/reseller", label: "Overview", icon: LayoutDashboard },
  { to: "/reseller/customers/new", label: "Add Customer", icon: PlusCircle },
  { to: "/reseller/customers", label: "Customers", icon: Building2 },
  { to: "/reseller/plans", label: "Plans", icon: CreditCard },
  { to: "/reseller/earnings", label: "Earnings", icon: TrendingUp },
  { to: "/reseller/billing", label: "Billing / Transactions", icon: FileText },
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-72 border-r bg-white px-5 py-6 shadow-sm">
          {/* LOGO */}
          <Link to="/reseller" className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16A249] text-white shadow">
              <ChartNoAxesCombined className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Reseller Hub
              </p>
              <p className="text-xs text-gray-500">Partner control center</p>
            </div>
          </Link>

          {/* NAV */}
          <nav className="space-y-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/reseller"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#16A249] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* WALLET CARD */}
          <div className="mt-auto sticky bottom-4">
            <div className="rounded-2xl border bg-gray-50 p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-white">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Wallet balance</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹ {(user?.balance ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                onClick={() => {
                  logout();
                  navigate("/reseller/login");
                }}
              >
                <FiLogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 lg:ml-72">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* HEADER */}
            <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
              {eyebrow && (
                <p className="mb-2 text-xs uppercase tracking-widest text-[#16A249] font-semibold">
                  {eyebrow}
                </p>
              )}

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                {/* LEFT */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                    {title}
                  </h1>

                  <p className="mt-2 max-w-xl text-xs text-gray-500">
                    Manage your customer portfolio, monitor subscription
                    performance, and keep partner operations moving from one
                    place.
                  </p>
                </div>

                {/* USER CARD */}
                <div className="group w-full md:w-auto flex items-center gap-4 rounded-2xl bg-white px-5 py-4 border border-gray-100 hover:border-gray-200 transition-all duration-300 ease-in-out cursor-pointer">
                  {/* AVATAR - Added a subtle ring and gradient feel */}
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-green-100 text-[#16A249] font-bold text-sm border border-green-200/50 shadow-inner">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                    {/* Active indicator repositioned on avatar for a modern look */}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  </div>

                  {/* USER INFO */}
                  <div className="flex flex-col min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">
                      Signed in as
                    </p>

                    <p className="font-bold text-gray-800 text-sm leading-tight group-hover:text-green-700 transition-colors">
                      {user?.firstName} {user?.lastName}
                    </p>

                    <p className="text-xs text-gray-500 truncate max-w-[150px] font-medium mt-0.5">
                      {user?.companyName || user?.email}
                    </p>
                  </div>

                  {/* STATUS BADGE - Cleaner pill-style design */}
                  <div className="ml-auto hidden sm:flex items-center px-2 py-1 rounded-full bg-green-50 border border-green-100">
                    <span className="text-[10px] font-bold text-green-700">
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
