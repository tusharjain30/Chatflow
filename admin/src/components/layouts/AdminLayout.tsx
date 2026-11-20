import { useState } from "react";
import { LogOut, PanelLeft, ShieldCheck, UserRound } from "lucide-react";
import { NavLink, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthToken } from "@/utils/authStorage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { capitalize } from "@/utils/Capitalize";
import {
  adminNavSections,
  type AdminNavItem,
} from "@/config/adminNav";

const COLLAPSED_KEY = "chatflow.admin.sidebar.collapsed";

function SideNavLink({
  item,
  collapsed,
}: {
  item: AdminNavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0 stroke-[2]" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!isAuthenticated || !isAdmin || !getAuthToken("admin")) {
    return <Navigate to="/admin/login" replace />;
  }

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`
      .toUpperCase()
      .slice(0, 2) || "SA";

  const displayName = capitalize(
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Super Admin",
  );

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F5F6F8]">
      <aside
        className={cn(
          "bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 z-30 transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-[300px]",
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "border-b border-slate-200/80 px-4 pt-5 pb-4",
            collapsed && "px-2",
          )}
        >
          {collapsed ? (
            <div className="relative flex items-center justify-center">
              <NavLink
                to="/admin"
                end
                className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0"
                title="ChatFlow Super Admin"
              >
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </NavLink>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="absolute -right-0.5 -bottom-0.5 h-5 w-5 rounded-md bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <NavLink
                  to="/admin"
                  end
                  className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0"
                >
                  <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                </NavLink>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[17px] font-semibold text-slate-900 tracking-tight truncate leading-tight">
                        ChatFlow
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 mt-0.5">
                        Super Admin Console
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleCollapsed}
                      className="h-8 w-8 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center shrink-0"
                      aria-label="Collapse sidebar"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </button>
                  </div>
                  <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/10 border-0 font-medium">
                    Platform Owner
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-5 py-4">
          {adminNavSections.map((section, index) => (
            <div key={section.label}>
              {index > 0 && (
                <div className="mb-4 mx-2 border-t border-slate-200" />
              )}
              <div className="space-y-0.5">
                {!collapsed && (
                  <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900">
                    {section.label}
                  </p>
                )}
                {section.items.map((item) => (
                  <SideNavLink
                    key={item.to}
                    item={item}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer profile */}
        <div className={cn("px-3 pb-4 pt-2 border-t border-slate-200/80", collapsed && "px-2")}>
          <div
            className={cn(
              "rounded-xl bg-slate-100 flex items-center gap-2.5",
              collapsed ? "justify-center p-2" : "px-2.5 py-2",
            )}
          >
            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-700">
              {initials ? (
                <span className="text-xs font-bold">{initials}</span>
              ) : (
                <UserRound className="h-4 w-4" />
              )}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 truncate">
                    {user?.email || "Platform admin"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8 text-slate-600 hover:text-slate-900"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
