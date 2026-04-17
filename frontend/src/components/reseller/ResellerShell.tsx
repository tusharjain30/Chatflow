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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.14),_transparent_30%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/80 px-5 py-6 backdrop-blur lg:flex lg:flex-col">
          <Link to="/reseller" className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
              <ChartNoAxesCombined className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Reseller Hub</p>
              <p className="text-sm text-slate-400">Partner control center</p>
            </div>
          </Link>

          <nav className="space-y-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/reseller"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    isActive
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Wallet balance</p>
                <p className="text-xl font-semibold">
                  INR {(user?.balance ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
              onClick={() => {
                logout();
                navigate("/reseller/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              {eyebrow ? (
                <p className="mb-2 text-sm uppercase tracking-[0.25em] text-cyan-300">
                  {eyebrow}
                </p>
              ) : null}
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Manage your customer portfolio, monitor subscription performance,
                    and keep partner operations moving from one place.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm">
                  <p className="text-slate-400">Signed in as</p>
                  <p className="font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-slate-400">{user?.companyName || user?.email}</p>
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
