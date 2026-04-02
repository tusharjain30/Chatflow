import {
  Plus,
  Calendar,
  Users,
  BarChart3,
  Play,
  Pause,
  MoreVertical,
  Send,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useEffect, useState } from "react";
import CreateCampaignModal from "@/components/campaign/CreateCampaignModal";

const broadcasts = [
  {
    id: 1,
    name: "Holiday Sale Announcement",
    status: "active",
    sent: 4520,
    total: 5000,
    delivered: 4480,
    read: 3890,
    date: "Jan 7, 2025",
    time: "10:00 AM",
  },
  {
    id: 2,
    name: "New Product Launch",
    status: "scheduled",
    sent: 0,
    total: 8500,
    delivered: 0,
    read: 0,
    date: "Jan 10, 2025",
    time: "2:00 PM",
  },
  {
    id: 3,
    name: "Weekly Newsletter",
    status: "completed",
    sent: 3200,
    total: 3200,
    delivered: 3180,
    read: 2850,
    date: "Jan 5, 2025",
    time: "9:00 AM",
  },
  {
    id: 4,
    name: "Flash Sale Alert",
    status: "completed",
    sent: 6500,
    total: 6500,
    delivered: 6420,
    read: 5800,
    date: "Jan 3, 2025",
    time: "11:00 AM",
  },
  {
    id: 5,
    name: "Customer Feedback Request",
    status: "draft",
    sent: 0,
    total: 2000,
    delivered: 0,
    read: 0,
    date: "-",
    time: "-",
  },
  {
    id: 6,
    name: "VIP Exclusive Offer",
    status: "paused",
    sent: 1200,
    total: 3000,
    delivered: 1180,
    read: 980,
    date: "Jan 6, 2025",
    time: "3:00 PM",
  },
];

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-primary/10", text: "text-primary" },
  scheduled: { bg: "bg-info/10", text: "text-info" },
  completed: { bg: "bg-success/10", text: "text-success" },
  draft: { bg: "bg-muted", text: "text-muted-foreground" },
  paused: { bg: "bg-warning/10", text: "text-warning" },
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function Broadcasts() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);

      const token = localStorage.getItem("auth_token");
      console.log(token);
      const res = await axios.get(`${API_BASE}/user/campaign/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.status === 1) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Stats API error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);

      const token = localStorage.getItem("auth_token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE}/user/campaign/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data?.status === 1) {
        setCampaigns(res.data.data.campaigns || []);
      }
    } catch (err) {
      console.error("Campaign list error:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCampaigns();
  }, []);

  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Broadcasts
                </h1>
                <p className="text-muted-foreground">
                  Create and manage your broadcast campaigns
                </p>
              </div>
              <Button
                className="gradient-whatsapp text-primary-foreground gap-2"
                onClick={() => setOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Broadcast
              </Button>

              {/* Modal */}
              <CreateCampaignModal
                open={open}
                setOpen={setOpen}
                onSuccess={() => {
                  fetchCampaigns();
                  fetchStats();
                }}
              />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Sent
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.messages?.sent ?? 0}
                </p>
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-success/10">
                    <Users className="h-5 w-5 text-success" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Delivered
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.messages?.delivered ?? 0}
                </p>

                <p className="text-sm text-success">
                  {stats?.messages?.sent > 0
                    ? (
                        (stats.messages.delivered / stats.messages.sent) *
                        100
                      ).toFixed(1)
                    : 0}
                  % rate
                </p>
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-info/10">
                    <Calendar className="h-5 w-5 text-info" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Scheduled
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.campaigns?.scheduled ?? 0}
                </p>
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-warning/10">
                    <Play className="h-5 w-5 text-warning" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Active Now
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.campaigns?.active ?? 0}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="draft">Drafts</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search campaigns..."
                      className="pl-10 w-64 bg-muted/50"
                    />
                  </div>
                  {/* <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button> */}
                </div>
              </div>

              <TabsContent value="all" className="space-y-4">
                {campaigns.map((campaign) => {
                  const status = campaign.status.toLowerCase();

                  return (
                    <div
                      key={campaign.id}
                      className="group border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      {/* Top */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Icon */}
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              statusStyles[status]?.bg,
                            )}
                          >
                            <Send
                              className={cn(
                                "h-4 w-4",
                                statusStyles[status]?.text,
                              )}
                            />
                          </div>

                          {/* Title */}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {campaign.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {campaign.template?.name}
                            </p>
                          </div>
                        </div>

                        {/* Status */}
                        <Badge
                          className={cn(
                            "text-[10px] px-2 py-0.5 border capitalize",
                            statusStyles[status]?.bg,
                            statusStyles[status]?.text,
                          )}
                        >
                          {status}
                        </Badge>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {/* Total Contacts */}
                        <div className="flex items-center gap-2 text-[11px]">
                          <div className="p-1.5 rounded-md bg-muted">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col leading-tight">
                            <span className="text-muted-foreground">
                              Contacts
                            </span>
                            <span className="font-medium text-foreground">
                              {campaign.totalContacts}
                            </span>
                          </div>
                        </div>

                        {/* Sent */}
                        <div className="flex items-center gap-2 text-[11px]">
                          <div className="p-1.5 rounded-md bg-blue-50">
                            <Send className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div className="flex flex-col leading-tight">
                            <span className="text-muted-foreground">Sent</span>
                            <span className="font-medium text-foreground">
                              {campaign.sentCount}
                            </span>
                          </div>
                        </div>

                        {/* Read */}
                        <div className="flex items-center gap-2 text-[11px]">
                          <div className="p-1.5 rounded-md bg-green-50">
                            <Eye className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <div className="flex flex-col leading-tight">
                            <span className="text-muted-foreground">Read</span>
                            <span className="font-medium text-foreground">
                              {campaign.readCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-medium">
                            {campaign.sentCount}/{campaign.totalContacts}
                          </span>
                        </div>

                        <Progress
                          value={campaign.progress || 0}
                          className="h-1.5"
                        />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-70 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
