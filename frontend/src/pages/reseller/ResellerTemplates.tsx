import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCcw,
  Search,
} from "lucide-react";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type TemplateItem = {
  id: string;
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  body: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  metaTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    companyName: string;
    isActive: boolean;
  };
  campaignCount: number;
  usageCount: number;
  lastUsedAt: string | null;
};

type TemplatesResponse = {
  items: TemplateItem[];
  accounts: Array<{ id: string; companyName: string }>;
  summary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    totalUsage: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const statusTone: Record<TemplateItem["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function ResellerTemplates() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; companyName: string }>>([]);
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalUsage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("");
  const [activeTab, setActiveTab] = useState("approved");

  const fetchTemplates = async (
    overrides?: {
      search?: string;
      accountId?: string;
    },
  ) => {
    setLoading(true);
    try {
      const effectiveSearch = overrides?.search ?? search;
      const effectiveAccountId = overrides?.accountId ?? accountId;

      const params = new URLSearchParams({
        page: "1",
        limit: "50",
      });

      if (effectiveSearch.trim()) params.set("search", effectiveSearch.trim());
      if (effectiveAccountId) params.set("accountId", effectiveAccountId);

      const response = await fetch(`${API_BASE}/reseller/templates?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const json = await response.json();

      if (response.ok && json.status === 1) {
        const payload = json.data as TemplatesResponse;
        setTemplates(payload.items);
        setAccounts(payload.accounts);
        setSummary(payload.summary);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const approvedTemplates = useMemo(
    () => templates.filter((item) => item.status === "APPROVED"),
    [templates],
  );

  const pendingTemplates = useMemo(
    () => templates.filter((item) => item.status === "SUBMITTED" || item.status === "DRAFT"),
    [templates],
  );

  const usageTemplates = useMemo(
    () => [...templates].sort((a, b) => b.usageCount - a.usageCount || b.campaignCount - a.campaignCount),
    [templates],
  );

  const renderTemplateCard = (template: TemplateItem, showUsage = false) => (
    <div key={template.id} className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{template.name}</p>
            <Badge className={statusTone[template.status]}>{formatLabel(template.status)}</Badge>
          </div>
          <p className="text-xs text-gray-500">
            {template.account.companyName} | {formatLabel(template.category)} | {formatLabel(template.language)}
          </p>
          <p className="line-clamp-2 text-sm text-gray-600">{template.body}</p>
          {template.rejectReason ? (
            <p className="text-xs text-red-600">Reason: {template.rejectReason}</p>
          ) : null}
        </div>

        <div className="min-w-[220px] space-y-2 rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Created</p>
          <p className="text-sm font-medium text-gray-900">{formatDateTime(template.createdAt)}</p>
          <p className="text-xs text-gray-500">Campaign links</p>
          <p className="text-sm font-medium text-gray-900">{template.campaignCount}</p>
          {showUsage ? (
            <>
              <p className="text-xs text-gray-500">Usage count</p>
              <p className="text-sm font-medium text-gray-900">{template.usageCount.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Last used</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(template.lastUsedAt)}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <ResellerShell title="Templates" eyebrow="Template Monitoring">
      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Track customer WhatsApp templates by approval state and real usage from one reseller workspace.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Tabs split monitoring into approved templates, pending review templates, and usage tracking.
          </p>
        </div>

        <Button variant="outline" className="rounded-lg" onClick={() => fetchTemplates()} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Total templates</CardTitle>
            <FileText className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.total}</p>
            <p className="mt-1 text-xs text-gray-500">Templates in the current reseller filter.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.approved}</p>
            <p className="mt-1 text-xs text-gray-500">Ready for customer sending and campaign use.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Pending</CardTitle>
            <Clock3 className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.pending}</p>
            <p className="mt-1 text-xs text-gray-500">Draft and submitted templates awaiting progress.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Total usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.totalUsage.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">Template sends tracked from message logs.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-xl border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search templates, content, or customers"
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
            <Button className="rounded-lg bg-[#16A249] hover:bg-[#12813a]" onClick={() => fetchTemplates()}>
              Apply filters
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setSearch("");
                setAccountId("");
                fetchTemplates({ search: "", accountId: "" });
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approved">Approved Templates</TabsTrigger>
          <TabsTrigger value="pending">Pending Templates</TabsTrigger>
          <TabsTrigger value="usage">Usage Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
              Loading approved templates...
            </div>
          ) : !approvedTemplates.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">No approved templates found</p>
              <p className="mt-1 text-xs text-gray-500">Approved templates will appear here when customer approvals complete.</p>
            </div>
          ) : (
            approvedTemplates.map((template) => renderTemplateCard(template))
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
              Loading pending templates...
            </div>
          ) : !pendingTemplates.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">No pending templates found</p>
              <p className="mt-1 text-xs text-gray-500">Draft or submitted templates will appear here.</p>
            </div>
          ) : (
            pendingTemplates.map((template) => renderTemplateCard(template))
          )}
        </TabsContent>

        <TabsContent value="usage" className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
              Loading template usage...
            </div>
          ) : !usageTemplates.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">No template usage found</p>
              <p className="mt-1 text-xs text-gray-500">Template usage records will appear here after sends begin.</p>
            </div>
          ) : (
            usageTemplates.map((template) => renderTemplateCard(template, true))
          )}
        </TabsContent>
      </Tabs>
    </ResellerShell>
  );
}
