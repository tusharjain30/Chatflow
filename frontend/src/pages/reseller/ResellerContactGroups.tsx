import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Layers3,
  RefreshCcw,
  Search,
  Users,
} from "lucide-react";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type GroupItem = {
  id: string;
  title: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  audienceSize: number;
  campaignCount: number;
  activeCampaignCount: number;
  lastCampaignAt: string | null;
  account: {
    id: string;
    companyName: string;
    isActive: boolean;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    updatedAt: string;
  }>;
};

type ContactGroupsResponse = {
  items: GroupItem[];
  accounts: Array<{ id: string; companyName: string }>;
  summary: {
    totalGroups: number;
    archivedGroups: number;
    totalAudience: number;
    averageAudienceSize: number;
  };
  campaignHighlights: GroupItem[];
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function ResellerContactGroups() {
  const [items, setItems] = useState<GroupItem[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; companyName: string }>>([]);
  const [summary, setSummary] = useState({
    totalGroups: 0,
    archivedGroups: 0,
    totalAudience: 0,
    averageAudienceSize: 0,
  });
  const [campaignHighlights, setCampaignHighlights] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("");
  const [archivedFilter, setArchivedFilter] = useState("");
  const [activeTab, setActiveTab] = useState("stats");

  const fetchGroups = async (
    overrides?: {
      search?: string;
      accountId?: string;
      archivedFilter?: string;
    },
  ) => {
    setLoading(true);
    try {
      const effectiveSearch = overrides?.search ?? search;
      const effectiveAccountId = overrides?.accountId ?? accountId;
      const effectiveArchived = overrides?.archivedFilter ?? archivedFilter;

      const params = new URLSearchParams({
        page: "1",
        limit: "50",
      });

      if (effectiveSearch.trim()) params.set("search", effectiveSearch.trim());
      if (effectiveAccountId) params.set("accountId", effectiveAccountId);
      if (effectiveArchived) params.set("isArchived", effectiveArchived);

      const response = await fetch(`${API_BASE}/reseller/contact-groups?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const json = await response.json();

      if (response.ok && json.status === 1) {
        const payload = json.data as ContactGroupsResponse;
        setItems(payload.items);
        setAccounts(payload.accounts);
        setSummary(payload.summary);
        setCampaignHighlights(payload.campaignHighlights);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const byAudienceSize = useMemo(
    () => [...items].sort((a, b) => b.audienceSize - a.audienceSize || b.campaignCount - a.campaignCount),
    [items],
  );

  return (
    <ResellerShell title="Contact Groups" eyebrow="Segmentation">
      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Monitor customer segments by audience size, campaign overlap, and group-level health from one reseller workspace.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Tabs split this module into group stats, campaign visibility, and audience-size monitoring.
          </p>
        </div>

        <Button variant="outline" className="rounded-lg" onClick={() => fetchGroups()} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Total groups</CardTitle>
            <Layers3 className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.totalGroups.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">Segments available across the current reseller filter.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Archived groups</CardTitle>
            <BarChart3 className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.archivedGroups.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">Segments currently parked from active customer use.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Audience size</CardTitle>
            <Users className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.totalAudience.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">Combined membership across visible contact groups.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Average size</CardTitle>
            <Users className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.averageAudienceSize}</p>
            <p className="mt-1 text-xs text-gray-500">Average members per customer segment in this filter.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-xl border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1.1fr_0.8fr_0.8fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search groups, descriptions, or customers"
                className="pl-9"
              />
            </div>
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
            <select
              value={archivedFilter}
              onChange={(event) => setArchivedFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All states</option>
              <option value="false">Active groups</option>
              <option value="true">Archived groups</option>
            </select>
            <Button className="rounded-lg bg-[#16A249] hover:bg-[#12813a]" onClick={() => fetchGroups()}>
              Apply filters
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setSearch("");
                setAccountId("");
                setArchivedFilter("");
                fetchGroups({ search: "", accountId: "", archivedFilter: "" });
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Group Stats</TabsTrigger>
          <TabsTrigger value="campaigns">Group Campaigns</TabsTrigger>
          <TabsTrigger value="audience">Audience Size</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
              Loading group stats...
            </div>
          ) : !items.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">No groups found</p>
              <p className="mt-1 text-xs text-gray-500">Customer contact groups will appear here when segmentation is in use.</p>
            </div>
          ) : (
            items.map((group) => (
              <div key={group.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{group.title}</p>
                      <Badge className={group.isArchived ? "bg-gray-100 text-gray-700" : "bg-emerald-100 text-emerald-700"}>
                        {group.isArchived ? "Archived" : "Active"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{group.account.companyName}</p>
                    <p className="text-sm text-gray-600">{group.description || "No description provided"}</p>
                  </div>

                  <div className="min-w-[230px] space-y-2 rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Audience size</p>
                    <p className="text-sm font-medium text-gray-900">{group.audienceSize.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Campaign overlap</p>
                    <p className="text-sm font-medium text-gray-900">{group.campaignCount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Updated</p>
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(group.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
              Loading group campaigns...
            </div>
          ) : !campaignHighlights.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">No group campaign overlap found</p>
              <p className="mt-1 text-xs text-gray-500">Campaign-linked groups will appear here once customer broadcasts use segmented audiences.</p>
            </div>
          ) : (
            campaignHighlights.map((group) => (
              <div key={group.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">{group.title}</p>
                    <p className="text-xs text-gray-500">
                      {group.account.companyName} | {group.campaignCount} linked campaigns
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.recentCampaigns.length ? (
                        group.recentCampaigns.map((campaign) => (
                          <Badge key={campaign.id} className="bg-blue-100 text-blue-700">
                            {campaign.name} ({formatLabel(campaign.status)})
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No recent campaigns</span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-[230px] space-y-2 rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Active campaigns</p>
                    <p className="text-sm font-medium text-gray-900">{group.activeCampaignCount}</p>
                    <p className="text-xs text-gray-500">Last campaign touch</p>
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(group.lastCampaignAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="audience" className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
              Loading audience sizes...
            </div>
          ) : !byAudienceSize.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">No audience data found</p>
              <p className="mt-1 text-xs text-gray-500">Audience size insights will appear here once contact groups have members.</p>
            </div>
          ) : (
            byAudienceSize.map((group) => (
              <div key={group.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{group.title}</p>
                    <p className="text-xs text-gray-500">{group.account.companyName}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Audience size</p>
                      <p className="text-sm font-semibold text-gray-900">{group.audienceSize.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Campaign count</p>
                      <p className="text-sm font-semibold text-gray-900">{group.campaignCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDateTime(group.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </ResellerShell>
  );
}
