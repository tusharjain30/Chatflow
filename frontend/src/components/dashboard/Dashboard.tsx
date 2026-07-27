import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  MessageSquare,
  Send,
  CheckCheck,
  ShieldAlert,
  Users,
  UserPlus,
  Megaphone,
  Bot,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { ConversationItem } from "./ConversationItem";
import { QuickActionCard } from "./QuickActionCard";
import { BroadcastItem } from "./BroadcastItem";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/* ================= STATIC UI DATA ================= */

const conversations = [
  {
    name: "Sarah Johnson",
    message: "Thanks for the quick response! I'll proceed with the order.",
    time: "2m ago",
    unread: 2,
    status: "read" as const,
  },
  {
    name: "Michael Chen",
    message: "Can you share the product catalog?",
    time: "15m ago",
    status: "delivered" as const,
  },
];

const broadcasts = [
  {
    name: "Holiday Sale Announcement",
    status: "active" as const,
    sent: 4520,
    total: 5000,
    date: "Jan 7, 2025",
  },
];

/* ================= TYPES ================= */

type DashboardStats = {
  totalContacts: number;
  totalGroups: number;
  totalTemplates: number;
  totalBots: number;
  totalBotReplies: number;
  activeTeamMembers: number;
  messagesInQueue: number;
  messagesProcessed: number;
};

export function Dashboard() {
  const {
    isImpersonatingCustomer,
    restoreSupportSession,
    supportSession,
  } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH STATS ================= */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("auth_token");

        const res = await fetch(`${API_BASE}/user/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (!res.ok || json.status !== 1) {
          throw new Error(json.message || "Failed to load dashboard stats");
        }

        setStats(json.data);
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (!stats) {
    return (
      <div className="p-6 text-red-500">Failed to load dashboard data</div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        {isImpersonatingCustomer ? (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-white p-2 text-red-600 shadow-sm">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Client support session active for {supportSession?.customerCompanyName || "client account"}
                  </p>
                  <p className="text-xs text-red-700">
                    You entered from {supportSession?.originPortal === "admin" ? "super admin" : "reseller"} panel {supportSession?.originLabel || supportSession?.resellerCompanyName || supportSession?.resellerName || "Support"}. Use back to dashboard to return without login.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-red-300 bg-white text-red-700 hover:bg-red-100 hover:text-red-800 md:w-auto"
                onClick={restoreSupportSession}
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Back to dashboard
              </Button>
            </div>
          </div>
        ) : null}

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* ================= METRICS ================= */}
            <section className="animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Active Contacts"
                  value={stats.totalContacts.toString()}
                  icon={Users}
                  variant="primary"
                />

                <MetricCard
                  title="Groups"
                  value={stats.totalGroups.toString()}
                  icon={Users}
                />

                <MetricCard
                  title="Templates"
                  value={stats.totalTemplates.toString()}
                  icon={MessageSquare}
                />

                <MetricCard
                  title="Bots"
                  value={stats.totalBots.toString()}
                  icon={Bot}
                  variant="success"
                />

                <MetricCard
                  title="Bot Replies"
                  value={stats.totalBotReplies.toString()}
                  icon={CheckCheck}
                />

                <MetricCard
                  title="Team Members"
                  value={stats.activeTeamMembers.toString()}
                  icon={UserPlus}
                />

                <MetricCard
                  title="Messages in Queue"
                  value={stats.messagesInQueue.toString()}
                  icon={Send}
                />

                <MetricCard
                  title="Messages Processed"
                  value={stats.messagesProcessed.toString()}
                  icon={TrendingUp}
                  variant="success"
                />
              </div>
            </section>

            {/* ================= MAIN GRID ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversations */}
              <section className="lg:col-span-2">
                <div className="card-elevated">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">
                      Recent Conversations
                    </h2>
                  </div>
                  <div className="p-2 space-y-1">
                    {conversations.map((conv, index) => (
                      <ConversationItem
                        key={index}
                        {...conv}
                        isActive={index === 0}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <QuickActionCard
                    icon={Megaphone}
                    title="Create Broadcast"
                    description="Send messages to multiple contacts"
                  />
                  <QuickActionCard
                    icon={UserPlus}
                    title="Import Contacts"
                    description="Upload CSV or Excel"
                  />
                  <QuickActionCard
                    icon={Bot}
                    title="Setup Chatbot"
                    description="Automate responses"
                  />
                  <QuickActionCard
                    icon={TrendingUp}
                    title="View Analytics"
                    description="Track performance"
                  />
                </div>
              </section>
            </div>

            {/* ================= BROADCASTS ================= */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Recent Broadcasts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {broadcasts.map((broadcast, index) => (
                  <BroadcastItem key={index} {...broadcast} />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
