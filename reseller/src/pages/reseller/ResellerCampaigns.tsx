import { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/authStorage";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  RefreshCcw,
  Search,
  Send,
  Users,
} from "lucide-react";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type CampaignListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  account: {
    id: string;
    companyName: string;
    isActive: boolean;
  };
  template: {
    id: string;
    name: string;
    category: string;
  } | null;
  totalContacts: number;
  audienceCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  logCount: number;
  progress: number;
  isScheduled: boolean;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

type CampaignDetail = {
  campaign: CampaignListItem & {
    updatedAt: string;
  };
  analytics: {
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    skipped: number;
    deliveryRate: number;
    readRate: number;
    failureRate: number;
  };
  failedAudience: Array<{
    id: string;
    status: string;
    failedAt: string | null;
    errorMessage: string | null;
    contact: {
      id: string;
      name: string;
      phone: string;
    };
  }>;
  failedLogs: Array<{
    id: string;
    type: string;
    message: string | null;
    createdAt: string;
  }>;
  jobs: Array<{
    id: string;
    batchNumber: number;
    totalRecords: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
  jobStats: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
};

type CampaignListResponse = {
  campaigns: CampaignListItem[];
  accounts: Array<{ id: string; companyName: string }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const statusTone: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  RUNNING: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-violet-100 text-violet-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-200 text-gray-700",
  PENDING: "bg-slate-100 text-slate-700",
  PROCESSING: "bg-sky-100 text-sky-700",
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

export default function ResellerCampaigns() {
  const [items, setItems] = useState<CampaignListItem[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; companyName: string }>>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [accountId, setAccountId] = useState("");

  const fetchCampaigns = async (
    campaignIdToPreserve?: string | null,
    overrides?: {
      search?: string;
      status?: string;
      accountId?: string;
    },
  ) => {
    setLoading(true);
    try {
      const effectiveSearch = overrides?.search ?? search;
      const effectiveStatus = overrides?.status ?? status;
      const effectiveAccountId = overrides?.accountId ?? accountId;

      const params = new URLSearchParams({
        page: "1",
        limit: "12",
      });

      if (effectiveSearch.trim()) params.set("search", effectiveSearch.trim());
      if (effectiveStatus) params.set("status", effectiveStatus);
      if (effectiveAccountId) params.set("accountId", effectiveAccountId);

      const response = await fetch(`${API_BASE}/reseller/campaigns?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const json = await response.json();

      if (response.ok && json.status === 1) {
        const payload = json.data as CampaignListResponse;
        setItems(payload.campaigns);
        setAccounts(payload.accounts);
        setPagination(payload.pagination);

        const nextSelectedId =
          campaignIdToPreserve && payload.campaigns.some((item) => item.id === campaignIdToPreserve)
            ? campaignIdToPreserve
            : payload.campaigns[0]?.id || null;

        setSelectedCampaignId(nextSelectedId);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignDetail = async (campaignId: string) => {
    setDetailLoading(true);
    try {
      const params = new URLSearchParams({ campaignId });
      const response = await fetch(`${API_BASE}/reseller/campaigns/detail?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const json = await response.json();
      if (response.ok && json.status === 1) {
        setDetail(json.data);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignDetail(selectedCampaignId);
    } else {
      setDetail(null);
    }
  }, [selectedCampaignId]);

  const selectedCampaign = items.find((item) => item.id === selectedCampaignId) || null;

  return (
    <ResellerShell title="Campaigns" eyebrow="Customer Campaign Visibility">
      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Monitor customer campaigns, delivery health, and failed execution events from one reseller view.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            This module is read-only for visibility and operational tracking across managed accounts.
          </p>
        </div>

        <Button
          variant="outline"
          className="rounded-lg"
          onClick={() => fetchCampaigns(selectedCampaignId)}
          disabled={loading}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Total campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
            <p className="mt-1 text-xs text-gray-500">Across all managed customer accounts.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Running now</CardTitle>
            <Send className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">
              {items.filter((item) => item.status === "RUNNING").length}
            </p>
            <p className="mt-1 text-xs text-gray-500">Active campaign execution in this filtered view.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Scheduled queue</CardTitle>
            <CalendarClock className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">
              {items.filter((item) => item.status === "SCHEDULED").length}
            </p>
            <p className="mt-1 text-xs text-gray-500">Campaigns waiting on scheduled send windows.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Failed campaigns</CardTitle>
            <AlertTriangle className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">
              {items.filter((item) => item.status === "FAILED").length}
            </p>
            <p className="mt-1 text-xs text-gray-500">Campaigns needing attention in this filtered view.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Campaign list</CardTitle>
            <p className="mt-1 text-xs text-gray-500">
              Search by campaign, customer, or template and open any record for analytics.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search campaigns, customers, templates"
                  className="pl-9"
                />
              </div>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="RUNNING">Running</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All customers</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 flex gap-2">
              <Button className="rounded-lg bg-[#16A249] hover:bg-[#12813a]" onClick={() => fetchCampaigns(selectedCampaignId)}>
                Apply filters
              </Button>
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setAccountId("");
                  fetchCampaigns(selectedCampaignId, {
                    search: "",
                    status: "",
                    accountId: "",
                  });
                }}
              >
                Clear
              </Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
                  Loading reseller campaigns...
                </div>
              ) : !items.length ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <p className="text-sm font-semibold text-gray-900">No campaigns found</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Adjust filters or create campaigns from customer workspaces.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCampaignId(item.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedCampaignId === item.id
                        ? "border-[#16A249] bg-green-50/60 shadow-sm"
                        : "bg-white hover:border-green-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          <Badge className={statusTone[item.status] || "bg-gray-100 text-gray-700"}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{item.account.companyName}</p>
                        <p className="text-xs text-gray-500">
                          Template: {item.template?.name || "Unknown"} | Audience: {item.audienceCount}
                        </p>
                        <p className="text-xs text-gray-500">
                          Sent {item.sentCount} | Delivered {item.deliveredCount} | Read {item.readCount} | Failed {item.failedCount}
                        </p>
                      </div>

                      <div className="min-w-[180px] space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                        <p className="text-[11px] text-gray-400">Created {formatDateTime(item.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Campaign detail</CardTitle>
            <p className="mt-1 text-xs text-gray-500">
              Delivery analytics, status tracking, failed deliveries, and campaign error logs.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {detailLoading ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
                Loading campaign detail...
              </div>
            ) : !detail || !selectedCampaign ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm font-semibold text-gray-900">Select a campaign</p>
                <p className="mt-1 text-xs text-gray-500">Detailed analytics will appear here.</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-gray-900">{detail.campaign.name}</p>
                    <Badge className={statusTone[detail.campaign.status] || "bg-gray-100 text-gray-700"}>
                      {detail.campaign.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {detail.campaign.description || "No description provided for this campaign."}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">Customer</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {detail.campaign.account.companyName}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">Template</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {detail.campaign.template?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">Scheduled at</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatDateTime(detail.campaign.scheduledAt)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">Completed at</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatDateTime(detail.campaign.completedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: "Total contacts", value: detail.campaign.totalContacts, icon: Users },
                    { label: "Delivered rate", value: `${detail.analytics.deliveryRate}%`, icon: Send },
                    { label: "Read rate", value: `${detail.analytics.readRate}%`, icon: BarChart3 },
                    { label: "Failed rate", value: `${detail.analytics.failureRate}%`, icon: AlertTriangle },
                    { label: "Error logs", value: detail.failedLogs.length, icon: AlertTriangle },
                    { label: "Jobs tracked", value: detail.jobStats.total, icon: CalendarClock },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-xl border bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</p>
                        <metric.icon className="h-4 w-4 text-[#16A249]" />
                      </div>
                      <p className="mt-3 text-xl font-semibold text-gray-900">{metric.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Delivery analytics</p>
                    <span className="text-xs text-gray-500">{detail.campaign.progress}% progress</span>
                  </div>
                  <Progress value={detail.campaign.progress} className="mb-4 h-2" />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["Pending", detail.analytics.pending],
                      ["Sent", detail.analytics.sent],
                      ["Delivered", detail.analytics.delivered],
                      ["Read", detail.analytics.read],
                      ["Failed", detail.analytics.failed],
                      ["Skipped", detail.analytics.skipped],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-900">Failed campaign logs</p>
                  <div className="space-y-3">
                    {!detail.failedLogs.length ? (
                      <p className="text-xs text-gray-500">No error logs recorded for this campaign.</p>
                    ) : (
                      detail.failedLogs.map((log) => (
                        <div key={log.id} className="rounded-lg bg-red-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <Badge className="bg-red-100 text-red-700">{log.type}</Badge>
                            <span className="text-[11px] text-gray-500">{formatDateTime(log.createdAt)}</span>
                          </div>
                          <p className="mt-2 text-sm text-gray-800">{log.message || "No log message"}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-900">Failed deliveries</p>
                  <div className="space-y-3">
                    {!detail.failedAudience.length ? (
                      <p className="text-xs text-gray-500">No failed audience records found.</p>
                    ) : (
                      detail.failedAudience.map((entry) => (
                        <div key={entry.id} className="rounded-lg bg-amber-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-gray-900">
                              {entry.contact.name || entry.contact.phone}
                            </p>
                            <span className="text-[11px] text-gray-500">{formatDateTime(entry.failedAt)}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{entry.contact.phone}</p>
                          <p className="mt-2 text-sm text-gray-700">
                            {entry.errorMessage || "Failure recorded without an error message."}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-900">Job status tracking</p>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                      ["Total", detail.jobStats.total],
                      ["Pending", detail.jobStats.pending],
                      ["Processing", detail.jobStats.processing],
                      ["Completed", detail.jobStats.completed],
                      ["Failed", detail.jobStats.failed],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {!detail.jobs.length ? (
                      <p className="text-xs text-gray-500">No campaign jobs found.</p>
                    ) : (
                      detail.jobs.map((job) => (
                        <div key={job.id} className="rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-gray-900">Batch #{job.batchNumber}</p>
                            <Badge className={statusTone[job.status] || "bg-gray-100 text-gray-700"}>
                              {job.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Records: {job.totalRecords} | Started: {formatDateTime(job.startedAt)} | Completed: {formatDateTime(job.completedAt)}
                          </p>
                          {job.errorMessage ? (
                            <p className="mt-2 text-sm text-gray-700">{job.errorMessage}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ResellerShell>
  );
}
