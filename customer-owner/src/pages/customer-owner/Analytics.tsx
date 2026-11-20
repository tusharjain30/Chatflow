import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  Users,
  CheckCheck,
  Bot,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

type Usage = {
  messages: {
    used: number;
    pending: number;
    delivered: number;
    read: number;
    failed: number;
  };
  contacts: { total: number };
  bots: { used: number };
  templates: { used: number };
  team: { activeMembers: number };
};

type CampaignStatsData = {
  campaigns?: { total?: number; active?: number; scheduled?: number };
  messages?: { sent?: number; delivered?: number; read?: number; failed?: number };
};

export default function Analytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStatsData>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usageJson, campaignJson] = await Promise.all([
        apiFetch("/user/account/usage"),
        apiFetch("/user/campaign/stats"),
      ]);
      setUsage(usageJson.data || null);
      setCampaignStats(campaignJson.data || {});
    } catch (error) {
      toast({
        title: "Unable to load analytics",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const messageBars = [
    { name: "Pending", value: usage?.messages.pending || 0 },
    { name: "Delivered", value: usage?.messages.delivered || 0 },
    { name: "Read", value: usage?.messages.read || 0 },
    { name: "Failed", value: usage?.messages.failed || 0 },
  ];

  const campaignBars = [
    {
      name: "Total",
      value: campaignStats.campaigns?.total || 0,
    },
    {
      name: "Running",
      value: campaignStats.campaigns?.active || 0,
    },
    {
      name: "Scheduled",
      value: campaignStats.campaigns?.scheduled || 0,
    },
    {
      name: "Sent",
      value: campaignStats.messages?.sent || 0,
    },
  ];

  const readRate =
    usage?.messages.used && usage.messages.used > 0
      ? Math.round((usage.messages.read / usage.messages.used) * 1000) / 10
      : 0;

  return (
    <div className="flex flex-col min-h-full w-full">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">
                Live usage and campaign performance
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading analytics...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card-elevated p-5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MessageSquare className="h-4 w-4" /> Total Messages
                    </div>
                    <p className="text-2xl font-bold">
                      {usage?.messages.used ?? 0}
                    </p>
                  </div>
                  <div className="card-elevated p-5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Users className="h-4 w-4" /> Contacts
                    </div>
                    <p className="text-2xl font-bold">
                      {usage?.contacts.total ?? 0}
                    </p>
                  </div>
                  <div className="card-elevated p-5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <CheckCheck className="h-4 w-4" /> Read Rate
                    </div>
                    <p className="text-2xl font-bold">{readRate}%</p>
                  </div>
                  <div className="card-elevated p-5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Bot className="h-4 w-4" /> Bots
                    </div>
                    <p className="text-2xl font-bold">
                      {usage?.bots.used ?? 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-elevated p-5">
                    <h3 className="font-semibold mb-4">Message outcomes</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={messageBars}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card-elevated p-5">
                    <h3 className="font-semibold mb-4">
                      Campaigns ({campaignStats.campaigns?.total || 0})
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaignBars}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(221 83% 53%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
      </main>
    </div>
  );
}
