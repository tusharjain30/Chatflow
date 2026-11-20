import { useEffect, useMemo, useState } from "react";
import { getAuthToken } from "@/utils/authStorage";
import {
  Activity,
  Download,
  Filter,
  RefreshCcw,
  Search,
  Upload,
  Users,
} from "lucide-react";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type ContactItem = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  country: string | null;
  phone: string;
  languageCode: string | null;
  email: string | null;
  isOptedOut: boolean;
  createdAt: string;
  account: {
    id: string;
    companyName: string;
    isActive: boolean;
  };
  groups: Array<{
    id: string;
    title: string;
    isArchived: boolean;
  }>;
  activity: {
    outboundCount: number;
    inboundCount: number;
    deliveredCount: number;
    failedCount: number;
    lastActivityAt: string | null;
    lastDirection: string | null;
    lastStatus: string | null;
    recentMessage: string | null;
  };
};

type ContactsResponse = {
  items: ContactItem[];
  accounts: Array<{ id: string; companyName: string }>;
  groups: Array<{ id: string; title: string; accountId: string; account: { companyName: string } }>;
  summary: {
    totalContacts: number;
    optedOutContacts: number;
    newContactsLast30Days: number;
    exportReadyContacts: number;
  };
  importExport: {
    canImport: boolean;
    canExport: boolean;
    supportedFormats: string[];
    ownerRoutes: {
      import: string;
      export: string;
    };
  };
  recentActivity: Array<{
    id: string;
    name: string;
    phone: string;
    account: {
      id: string;
      companyName: string;
      isActive: boolean;
    };
    lastActivityAt: string;
    lastDirection: string | null;
    lastStatus: string | null;
    recentMessage: string | null;
  }>;
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const shortLabel = (value?: string | null) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "-";

export default function ResellerContacts() {
  const [items, setItems] = useState<ContactItem[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; companyName: string }>>([]);
  const [groups, setGroups] = useState<
    Array<{ id: string; title: string; accountId: string; account: { companyName: string } }>
  >([]);
  const [summary, setSummary] = useState({
    totalContacts: 0,
    optedOutContacts: 0,
    newContactsLast30Days: 0,
    exportReadyContacts: 0,
  });
  const [importExport, setImportExport] = useState({
    canImport: false,
    canExport: false,
    supportedFormats: [] as string[],
    ownerRoutes: {
      import: "",
      export: "",
    },
  });
  const [recentActivity, setRecentActivity] = useState<ContactsResponse["recentActivity"]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");

  const fetchContacts = async (
    overrides?: {
      search?: string;
      accountId?: string;
      groupId?: string;
    },
  ) => {
    setLoading(true);
    try {
      const effectiveSearch = overrides?.search ?? search;
      const effectiveAccountId = overrides?.accountId ?? accountId;
      const effectiveGroupId = overrides?.groupId ?? groupId;

      const params = new URLSearchParams({
        page: "1",
        limit: "50",
      });

      if (effectiveSearch.trim()) params.set("search", effectiveSearch.trim());
      if (effectiveAccountId) params.set("accountId", effectiveAccountId);
      if (effectiveGroupId) params.set("groupId", effectiveGroupId);

      const response = await fetch(`${API_BASE}/reseller/contacts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const json = await response.json();

      if (response.ok && json.status === 1) {
        const payload = json.data as ContactsResponse;
        setItems(payload.items);
        setAccounts(payload.accounts);
        setGroups(payload.groups);
        setSummary(payload.summary);
        setImportExport(payload.importExport);
        setRecentActivity(payload.recentActivity);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const sortedByActivity = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aTime = a.activity.lastActivityAt ? new Date(a.activity.lastActivityAt).getTime() : 0;
        const bTime = b.activity.lastActivityAt ? new Date(b.activity.lastActivityAt).getTime() : 0;
        return bTime - aTime;
      }),
    [items],
  );

  const visibleGroups = useMemo(
    () => (accountId ? groups.filter((group) => group.accountId === accountId) : groups),
    [accountId, groups],
  );

  return (
    <ResellerShell title="Contacts" eyebrow="Customer Contacts">
      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Monitor customer contact books, CSV operations, and message-level contact activity from one reseller view.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Tabs separate direct contact visibility, import/export controls, and recent engagement activity.
          </p>
        </div>

        <Button variant="outline" className="rounded-lg" onClick={() => fetchContacts()} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Total contacts</CardTitle>
            <Users className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.totalContacts.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">Contacts visible across current reseller filters.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Opted out</CardTitle>
            <Filter className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.optedOutContacts.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">Contacts currently excluded from customer outreach.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Added in 30 days</CardTitle>
            <Upload className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.newContactsLast30Days.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">Recent growth in customer contact imports or manual adds.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-gray-500">Export ready</CardTitle>
            <Download className="h-4 w-4 text-[#16A249]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">{summary.exportReadyContacts.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">Contacts available for customer-side CSV export.</p>
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
                placeholder="Search contacts, phone, email, or customer"
                className="pl-9"
              />
            </div>
            <select
              value={accountId}
              onChange={(event) => {
                setAccountId(event.target.value);
                setGroupId("");
              }}
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
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All groups</option>
              {visibleGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title} ({group.account.companyName})
                </option>
              ))}
            </select>
            <Button className="rounded-lg bg-[#16A249] hover:bg-[#12813a]" onClick={() => fetchContacts()}>
              Apply filters
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setSearch("");
                setAccountId("");
                setGroupId("");
                fetchContacts({ search: "", accountId: "", groupId: "" });
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts">View Contacts</TabsTrigger>
          <TabsTrigger value="import-export">Import / Export</TabsTrigger>
          <TabsTrigger value="activity">Contact Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
              Loading contacts...
            </div>
          ) : !items.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">No contacts found</p>
              <p className="mt-1 text-xs text-gray-500">Matching contacts will appear here when customers add or import them.</p>
            </div>
          ) : (
            items.map((contact) => (
              <div key={contact.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{contact.name || contact.phone}</p>
                      {contact.isOptedOut ? (
                        <Badge className="bg-red-100 text-red-700">Opted Out</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700">Reachable</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {contact.account.companyName} | {contact.phone} {contact.email ? `| ${contact.email}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {contact.groups.length ? (
                        contact.groups.slice(0, 4).map((group) => (
                          <Badge key={group.id} className="bg-gray-100 text-gray-700">
                            {group.title}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No groups assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-[230px] space-y-2 rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Last activity</p>
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(contact.activity.lastActivityAt)}</p>
                    <p className="text-xs text-gray-500">Outbound / Inbound</p>
                    <p className="text-sm font-medium text-gray-900">
                      {contact.activity.outboundCount} / {contact.activity.inboundCount}
                    </p>
                    <p className="text-xs text-gray-500">Delivered / Failed</p>
                    <p className="text-sm font-medium text-gray-900">
                      {contact.activity.deliveredCount} / {contact.activity.failedCount}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="import-export" className="mt-4">
          <Card className="rounded-xl border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">CSV Operations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#16A249]" />
                  <p className="text-sm font-semibold text-gray-900">Import monitoring</p>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Customer workspaces can import contacts through CSV. This reseller view tracks growth and confirms the import capability is available.
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <p>Capability: {importExport.canImport ? "Enabled" : "Unavailable"}</p>
                  <p>Supported formats: {importExport.supportedFormats.join(", ") || "-"}</p>
                  <p>Owner route: {importExport.ownerRoutes.import || "-"}</p>
                </div>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#16A249]" />
                  <p className="text-sm font-semibold text-gray-900">Export monitoring</p>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Contacts matching the current reseller filter are export-ready from the customer workspace.
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <p>Capability: {importExport.canExport ? "Enabled" : "Unavailable"}</p>
                  <p>Export-ready contacts: {summary.exportReadyContacts.toLocaleString()}</p>
                  <p>Owner route: {importExport.ownerRoutes.export || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
              Loading contact activity...
            </div>
          ) : !sortedByActivity.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">No contact activity found</p>
              <p className="mt-1 text-xs text-gray-500">Recent message activity will appear here as customer conversations happen.</p>
            </div>
          ) : (
            <>
              {recentActivity.length ? (
                <Card className="rounded-xl border bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Recent activity feed</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentActivity.map((entry) => (
                      <div key={`${entry.id}-${entry.lastActivityAt}`} className="rounded-lg border bg-gray-50 p-3">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
                            <p className="text-xs text-gray-500">
                              {entry.account.companyName} | {entry.phone}
                            </p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">
                            {shortLabel(entry.lastDirection)} / {shortLabel(entry.lastStatus)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{entry.recentMessage || "Recent message activity recorded"}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatDateTime(entry.lastActivityAt)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {sortedByActivity.map((contact) => (
                <div key={contact.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#16A249]" />
                        <p className="text-sm font-semibold text-gray-900">{contact.name || contact.phone}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {contact.account.companyName} | {contact.phone}
                      </p>
                      <p className="text-sm text-gray-600">{contact.activity.recentMessage || "No recent message preview available"}</p>
                    </div>

                    <div className="min-w-[250px] space-y-2 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Last activity</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(contact.activity.lastActivityAt)}</p>
                      <p className="text-xs text-gray-500">Direction / Status</p>
                      <p className="text-sm font-medium text-gray-900">
                        {shortLabel(contact.activity.lastDirection)} / {shortLabel(contact.activity.lastStatus)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </ResellerShell>
  );
}
