import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  MessageSquare,
  Smartphone,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Header } from "./Header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

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

type MessageLog = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  createdAt: string;
};

type Subscription = {
  endDate?: string | null;
  startDate?: string;
  isActive?: boolean;
  plan?: { name?: string } | null;
};

type WhatsAppIntegration = {
  verification?: { status?: string } | null;
  accounts?: Array<{ isActive?: boolean; status?: string }>;
};

type RecentCampaign = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

function buildChatTrend(messages: MessageLog[]) {
  const days: Array<{
    label: string;
    key: string;
    inbound: number;
    outbound: number;
  }> = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    days.push({
      key,
      label: date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
      }),
      inbound: 0,
      outbound: 0,
    });
  }

  const map = new Map(days.map((day) => [day.key, day]));
  for (const msg of messages) {
    const key = new Date(msg.createdAt).toISOString().slice(0, 10);
    const bucket = map.get(key);
    if (!bucket) continue;
    if (msg.direction === "INBOUND") bucket.inbound += 1;
    else bucket.outbound += 1;
  }

  return days;
}

function hasConnectedWebInstances() {
  try {
    const raw = localStorage.getItem("chatflow.whatsapp.webInstances");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return (
      Array.isArray(parsed) &&
      parsed.some((item) => item?.status === "connected")
    );
  } catch {
    return false;
  }
}

function isCloudWhatsAppConnected(wa: WhatsAppIntegration | null) {
  if (!wa) return false;
  return Boolean(
    wa.accounts?.some(
      (account) => account.isActive && account.status === "ACTIVE",
    ),
  );
}

export function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [campaigns, setCampaigns] = useState<RecentCampaign[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [webConnected, setWebConnected] = useState(() =>
    hasConnectedWebInstances(),
  );
  const [dismissTeamCard, setDismissTeamCard] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("chatflow.dismiss.teamSetup") === "1";
  });
  const [loading, setLoading] = useState(true);

  const whatsappConnected = cloudConnected || webConnected;

  useEffect(() => {
    const load = async () => {
      try {
        const [statsJson, messagesJson, subJson, waJson, campaignJson] =
          await Promise.all([
            apiFetch("/user/dashboard/stats"),
            apiFetch("/user/whatsapp/message/list?page=1&limit=200"),
            apiFetch("/user/account/subscription").catch(() => ({ data: null })),
            apiFetch("/user/account/whatsapp-integration").catch(() => ({
              data: null,
            })),
            apiFetch("/user/campaign/stats").catch(() => ({ data: null })),
          ]);

        setStats(statsJson.data);
        setMessages(messagesJson.data?.messages || []);
        setSubscription(subJson.data || null);
        setCampaigns(campaignJson.data?.recentCampaigns || []);

        const wa = (waJson.data || null) as WhatsAppIntegration | null;
        setCloudConnected(isCloudWhatsAppConnected(wa));
        setWebConnected(hasConnectedWebInstances());
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();

    const refreshWeb = () => setWebConnected(hasConnectedWebInstances());
    const onStorage = (event: StorageEvent) => {
      if (event.key === "chatflow.whatsapp.webInstances") refreshWeb();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshWeb);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshWeb);
    };
  }, []);

  const chartData = useMemo(() => buildChatTrend(messages), [messages]);
  const totalChats = messages.length;

  const trialEnd =
    subscription?.endDate ||
    (() => {
      if (!subscription?.startDate) return null;
      const d = new Date(subscription.startDate);
      d.setDate(d.getDate() + 7);
      return d.toISOString();
    })();

  const showTeamCard =
    !dismissTeamCard && (stats?.activeTeamMembers || 0) <= 1;

  const activeCampaigns = campaigns.filter((c) => {
    const status = (c.status || "").toUpperCase();
    return status === "RUNNING" || status === "SCHEDULED" || status === "ACTIVE";
  });

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header showWelcome title="Dashboard" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-5">
            {!whatsappConnected && (
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Smartphone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Setup WhatsApp
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Connect WhatsApp Business to start chatting, sending
                      campaigns, and using templates.
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                  onClick={() => navigate("/settings?tab=whatsapp&setup=1")}
                >
                  Setup WhatsApp
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!whatsappConnected && (
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => navigate("/settings?tab=whatsapp&setup=1")}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Setup WhatsApp
                </Button>
              )}
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate("/contacts")}
              >
                Add Contact
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate("/broadcasts/create")}
              >
                Create Campaign
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate("/templates/create")}
              >
                Create Template
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  label: "Contacts",
                  value: stats?.totalContacts ?? 0,
                  href: "/contacts",
                  link: "View Contacts",
                },
                {
                  label: "Campaigns",
                  value: campaigns.length,
                  href: "/broadcasts",
                  link: "View Campaigns",
                },
                {
                  label: "Templates",
                  value: stats?.totalTemplates ?? 0,
                  href: "/templates",
                  link: "View Templates",
                },
                {
                  label: "All Chats",
                  value: totalChats,
                  href: "/inbox",
                  link: "View Chats",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-semibold mt-2">{card.value}</p>
                  <button
                    type="button"
                    className="mt-3 text-sm text-primary hover:underline inline-flex items-center gap-1"
                    onClick={() => navigate(card.href)}
                  >
                    {card.link}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="inbound"
                        name="Inbound Chats"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="outbound"
                        name="Outbound Chats"
                        stroke="#86EFAC"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Trial Period
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {trialEnd
                          ? `Your Trial Period Expires On ${new Date(trialEnd)
                              .toISOString()
                              .replace("T", " ")
                              .slice(0, 19)}`
                          : subscription?.plan?.name
                            ? `You are on the ${subscription.plan.name} plan`
                            : "No active subscription found"}
                      </p>
                    </div>
                    <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <Button
                    className="mt-5 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => navigate("/billing")}
                  >
                    Subscribe
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {showTeamCard && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Setup Team
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Add Other People To Your Team.
                        </p>
                      </div>
                      <div className="h-11 w-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Button
                        className="bg-orange-400 hover:bg-orange-500 text-white"
                        onClick={() => navigate("/team")}
                      >
                        Add User
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                      <button
                        type="button"
                        className={cn(
                          "text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline ml-auto",
                        )}
                        onClick={() => {
                          localStorage.setItem(
                            "chatflow.dismiss.teamSetup",
                            "1",
                          );
                          setDismissTeamCard(true);
                        }}
                      >
                        Dismiss Notification
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">Campaigns</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Below Are Your Outgoing Or Scheduled Campaigns.
              </p>
              {activeCampaigns.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  You Do Not Have Any Outgoing Or Scheduled Campaigns.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {activeCampaigns.slice(0, 5).map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.status} ·{" "}
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/broadcasts")}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
    </div>
  );
}
