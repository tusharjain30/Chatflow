import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Info,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";
import { getAuthToken } from "@/utils/authStorage";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Campaign = {
  id: string;
  name: string;
  status: string;
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  template?: { id: string; name: string } | null;
  createdAt: string;
};

function authHeaders() {
  return { Authorization: `Bearer ${getAuthToken()}` };
}

function normalizeStatus(status: string) {
  const map: Record<string, string> = {
    RUNNING: "Ongoing",
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    DRAFT: "Draft",
    PAUSED: "Paused",
    FAILED: "Failed",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

function rateLabel(part: number, whole: number) {
  if (!whole) return { pct: "0%", count: `0/0` };
  const pct = Math.round((part / whole) * 100);
  return { pct: `${pct}%`, count: `${part}/${whole}` };
}

export default function Broadcasts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        tab: "all",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await axios.get(
        `${API_BASE}/user/campaign/list?${params.toString()}`,
        { headers: authHeaders() },
      );
      if (res.data?.status === 1) {
        setCampaigns(res.data.data.campaigns || []);
      }
    } catch (error: any) {
      toast({
        title: "Unable to load campaigns",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useSocket({
    "campaign:status": (payload: {
      campaignId?: string;
      status?: string;
      campaign?: Partial<Campaign> | null;
    }) => {
      if (!payload?.campaignId) return;
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === payload.campaignId
            ? {
                ...c,
                status: payload.status || payload.campaign?.status || c.status,
                sentCount: payload.campaign?.sentCount ?? c.sentCount,
                failedCount: payload.campaign?.failedCount ?? c.failedCount,
                deliveredCount:
                  payload.campaign?.deliveredCount ?? c.deliveredCount,
                readCount: payload.campaign?.readCount ?? c.readCount,
              }
            : c,
        ),
      );
    },
    "campaign:progress": (payload: {
      campaignId?: string;
      campaign?: Partial<Campaign> | null;
    }) => {
      if (!payload?.campaignId || !payload.campaign) return;
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === payload.campaignId
            ? {
                ...c,
                status: payload.campaign?.status || c.status,
                sentCount: payload.campaign?.sentCount ?? c.sentCount,
                failedCount: payload.campaign?.failedCount ?? c.failedCount,
                deliveredCount:
                  payload.campaign?.deliveredCount ?? c.deliveredCount,
                readCount: payload.campaign?.readCount ?? c.readCount,
              }
            : c,
        ),
      );
    },
  });

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await axios.delete(
        `${API_BASE}/user/campaign/${pendingDelete.id}/delete`,
        { headers: authHeaders() },
      );
      toast({
        title: "Campaign deleted",
        description: pendingDelete.name,
      });
      setDeleteOpen(false);
      setPendingDelete(null);
      await loadCampaigns();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.response?.data?.message || "Unable to delete",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header title="Campaigns" subtitle="Add Campaigns" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Add Campaigns
              </p>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => navigate("/broadcasts/create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Campaigns"
              className="pl-9 h-11 rounded-lg bg-white border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search !== debouncedSearch && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[420px]">
            <div className="grid grid-cols-[1.4fr_1.2fr_1fr_1fr_0.9fr_48px] gap-2 px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Campaign Name</span>
              <span>Template</span>
              <span>Delivery Rate</span>
              <span>Read Rate</span>
              <span>Status</span>
              <span />
            </div>

            {loading ? (
              <div className="py-24 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-800">
                  You Don&apos;t Have Any Campaigns
                </p>
                <Button
                  className="mt-5 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => navigate("/broadcasts/create")}
                >
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {campaigns.map((campaign) => {
                  const delivery = rateLabel(
                    campaign.deliveredCount || campaign.sentCount || 0,
                    campaign.totalContacts || campaign.sentCount || 0,
                  );
                  const read = rateLabel(
                    campaign.readCount || 0,
                    campaign.deliveredCount || campaign.sentCount || 0,
                  );
                  return (
                    <div
                      key={campaign.id}
                      className="grid grid-cols-[1.4fr_1.2fr_1fr_1fr_0.9fr_48px] gap-2 px-5 py-4 items-center hover:bg-slate-50/80"
                    >
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {campaign.name}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {campaign.template?.name || "WhatsApp Template"}
                      </p>
                      <div>
                        <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-1">
                          {delivery.pct}{" "}
                          <span className="text-sky-500 ml-1">
                            {delivery.count}
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-1">
                          {read.pct}{" "}
                          <span className="text-sky-500 ml-1">{read.count}</span>
                        </span>
                      </div>
                      <div>
                        <Badge
                          className={cn(
                            "font-medium",
                            campaign.status === "RUNNING" &&
                              "bg-green-100 text-green-800",
                            campaign.status === "DRAFT" &&
                              "bg-slate-100 text-slate-700",
                            campaign.status === "SCHEDULED" &&
                              "bg-blue-100 text-blue-800",
                            campaign.status === "COMPLETED" &&
                              "bg-emerald-100 text-emerald-800",
                            campaign.status === "FAILED" &&
                              "bg-red-100 text-red-800",
                          )}
                        >
                          {normalizeStatus(campaign.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(`/broadcasts/create?id=${campaign.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setPendingDelete(campaign);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setPendingDelete(null);
        }}
        title="Delete campaign?"
        description={`This will permanently delete “${pendingDelete?.name || "this campaign"}”.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
