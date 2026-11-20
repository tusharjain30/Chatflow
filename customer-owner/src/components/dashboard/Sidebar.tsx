import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Send,
  FileText,
  Zap,
  Settings,
  CreditCard,
  LifeBuoy,
  Terminal,
  LogOut,
  PanelLeft,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChangeTeamDialog } from "@/components/dashboard/ChangeTeamDialog";
import { cn } from "@/lib/utils";
import { capitalize } from "@/utils/Capitalize";

const COLLAPSED_KEY = "chatflow.sidebar.collapsed";

type NavItem = {
  icon: React.ElementType;
  label: string;
  to: string;
  end?: boolean;
};

const primaryNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/", end: true },
  { icon: MessageSquare, label: "Chats", to: "/inbox" },
  { icon: Users, label: "Contacts", to: "/contacts" },
  { icon: Send, label: "Campaigns", to: "/broadcasts" },
  { icon: FileText, label: "Message Templates", to: "/templates" },
  { icon: Zap, label: "Automation", to: "/chatbots" },
];

const secondaryNav: NavItem[] = [
  { icon: Settings, label: "Settings", to: "/settings" },
  { icon: CreditCard, label: "Billing & Subscription", to: "/billing" },
  { icon: LifeBuoy, label: "Support", to: "/help" },
  { icon: Terminal, label: "Developer Tools", to: "/developer-tools" },
];

function SideNavLink({
  item,
  collapsed,
}: {
  item: NavItem;
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
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition-colors",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0 stroke-[2]" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [changeTeamOpen, setChangeTeamOpen] = useState(false);

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`
      .toUpperCase()
      .slice(0, 2) || "U";

  const companyName = user?.account?.companyName || "My Team";
  const displayName = capitalize(
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User",
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

  return (
    <aside
      className={cn(
        "bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 z-30 transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[280px]",
      )}
    >
      {/* Brand + collapse */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 pt-5 pb-4",
          collapsed && "justify-center px-2 relative",
        )}
      >
        {collapsed ? (
          <div className="relative h-10 w-10 flex items-center justify-center">
            <NavLink
              to="/"
              end
              className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0"
              title="ChatFlow"
            >
              <Zap className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
            </NavLink>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="absolute -right-1 -bottom-0.5 h-5 w-5 rounded-md bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeft className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <NavLink
              to="/"
              end
              className="flex items-center gap-2 min-w-0 flex-1"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
              </div>
              <span className="text-[17px] font-semibold text-primary tracking-tight truncate">
                ChatFlow
              </span>
            </NavLink>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="h-8 w-8 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center shrink-0"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="space-y-0.5">
          {primaryNav.map((item) => (
            <SideNavLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>

        <div className="my-3 mx-2 border-t border-slate-200" />

        <div className="space-y-0.5">
          {secondaryNav.map((item) => (
            <SideNavLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className={cn("px-3 pb-4 pt-2 space-y-2", collapsed && "px-2")}>
        {!collapsed ? (
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center justify-between gap-2 shadow-sm">
            <p className="text-[13px] text-slate-800 truncate">
              <span className="text-slate-600">Team:</span>{" "}
              <span className="font-semibold">{companyName}</span>
            </p>
            <button
              type="button"
              onClick={() => setChangeTeamOpen(true)}
              className="text-[12px] font-medium text-primary hover:underline shrink-0 px-1.5 py-0.5 rounded-md border border-transparent hover:border-primary/20"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setChangeTeamOpen(true)}
            className="w-full h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
            title="Change team"
          >
            <Users className="h-4 w-4" />
          </button>
        )}

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
                <button
                  type="button"
                  onClick={() => navigate("/settings?tab=profile")}
                  className="text-[11px] font-medium text-slate-600 hover:text-primary"
                >
                  View Profile
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="h-8 w-8 text-slate-600 hover:text-slate-900"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <ChangeTeamDialog open={changeTeamOpen} onOpenChange={setChangeTeamOpen} />
    </aside>
  );
}
