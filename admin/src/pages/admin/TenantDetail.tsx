import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  History,
  LifeBuoy,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken, setAuthToken } from "@/utils/authStorage";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const OWNER_URL =
  import.meta.env.VITE_OWNER_URL || "http://localhost:8080/login";

type TenantDetailData = {
  overview: any;
  profile: any;
  users: any[];
  whatsappAccounts: any[];
  campaigns: any[];
  messages: { stats: any; recent: any[] };
  subscription: { active: any; history: any[] };
  billing: { transactions: any[]; invoices: any[] };
  usage: any;
  auditHistory: any[];
  supportTickets: any[];
};

const statusClass: Record<string, string> = {
  Active: "bg-primary/10 text-primary",
  Trial: "bg-sky-50 text-sky-700",
  Suspended: "bg-red-50 text-red-700",
  Archived: "bg-slate-100 text-slate-700",
};

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = getAuthToken("admin");

  const [data, setData] = useState<TenantDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/super-admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to load tenant");
      }
      setData(json.data);
      setProfileForm(json.data.profile || {});
    } catch (error) {
      toast({
        title: "Tenant unavailable",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast, token]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/super-admin/tenants/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });
      const json = await res.json();
      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to save profile");
      }
      toast({ title: "Organization profile updated" });
      await load();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const impersonate = async () => {
    if (!id) return;
    try {
      const res = await fetch(
        `${API_BASE}/super-admin/tenants/${id}/impersonate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to impersonate");
      }
      setAuthToken("user", json.data.token);
      window.open(
        OWNER_URL.replace(/\/login$/, "") || "http://localhost:8080",
        "_blank",
      );
      toast({ title: "Impersonation started (audited)" });
    } catch (error) {
      toast({
        title: "Impersonation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const overview = data?.overview;

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full">
        <Header
          title={overview?.organization || "Tenant details"}
          subtitle="Organization control center"
        />

        <div className="flex-1 p-6">
          <div className="mx-auto max-w-[1400px] space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/tenants")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {overview ? (
                  <Badge
                    className={cn(
                      statusClass[overview.status] ||
                        "bg-slate-100 text-slate-700",
                    )}
                  >
                    {overview.status}
                  </Badge>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={load}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button onClick={impersonate}>Impersonate tenant</Button>
              </div>
            </div>

            {loading || !data ? (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="py-16 text-center text-slate-500">
                  Loading tenant details...
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="h-auto flex flex-wrap justify-start gap-1 bg-white border border-slate-200 p-1">
                  {[
                    ["overview", "Overview"],
                    ["profile", "Organization Profile"],
                    ["users", "Users & Team"],
                    ["whatsapp", "WhatsApp Accounts"],
                    ["campaigns", "Campaigns"],
                    ["messages", "Messages"],
                    ["subscription", "Subscription"],
                    ["billing", "Billing & Payments"],
                    ["usage", "Usage Statistics"],
                    ["audit", "Login & Audit History"],
                    ["support", "Support Tickets"],
                  ].map(([value, label]) => (
                    <TabsTrigger key={value} value={value} className="text-xs">
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        label: "Owner",
                        value: overview.owner?.name || "—",
                        icon: Users,
                      },
                      {
                        label: "Plan",
                        value: overview.plan?.name || "—",
                        icon: CreditCard,
                      },
                      {
                        label: "Users",
                        value: overview.usageSummary?.users ?? 0,
                        icon: Users,
                      },
                      {
                        label: "WhatsApp",
                        value: overview.usageSummary?.whatsappNumbers ?? 0,
                        icon: Phone,
                      },
                      {
                        label: "Messages",
                        value: overview.usageSummary?.messages?.total ?? 0,
                        icon: MessageSquare,
                      },
                      {
                        label: "Campaigns",
                        value: overview.usageSummary?.campaigns ?? 0,
                        icon: Send,
                      },
                      {
                        label: "Credit balance",
                        value: overview.creditBalance ?? 0,
                        icon: Wallet,
                      },
                      {
                        label: "Reseller",
                        value: overview.reseller?.companyName || "Direct",
                        icon: Building2,
                      },
                    ].map((card) => (
                      <Card key={card.label} className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm text-slate-500">
                            {card.label}
                          </CardTitle>
                          <card.icon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-semibold truncate">
                            {card.value}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Quick facts</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
                      <p>
                        <span className="text-slate-500">Email:</span>{" "}
                        {overview.owner?.email || "—"}
                      </p>
                      <p>
                        <span className="text-slate-500">Phone:</span>{" "}
                        {overview.owner?.phone || "—"}
                      </p>
                      <p>
                        <span className="text-slate-500">Created:</span>{" "}
                        {new Date(overview.createdAt).toLocaleString()}
                      </p>
                      <p>
                        <span className="text-slate-500">Trial ends:</span>{" "}
                        {overview.trialEndsAt
                          ? new Date(overview.trialEndsAt).toLocaleString()
                          : "—"}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="profile">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Organization Profile</CardTitle>
                        <CardDescription>
                          Edit company details for this tenant
                        </CardDescription>
                      </div>
                      <Button onClick={saveProfile} disabled={saving}>
                        {saving ? "Saving..." : "Save changes"}
                      </Button>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      {[
                        ["companyName", "Organization name"],
                        ["address", "Address"],
                        ["city", "City"],
                        ["state", "State"],
                        ["zipCode", "Zip code"],
                        ["country", "Country"],
                        ["timezone", "Timezone"],
                      ].map(([key, label]) => (
                        <div key={key} className="space-y-2">
                          <Label>{label}</Label>
                          <Input
                            value={profileForm?.[key] ?? ""}
                            onChange={(e) =>
                              setProfileForm((prev: any) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="users">
                  <DataTable
                    title="Users & Team"
                    columns={["Name", "Email", "Role", "Status"]}
                    rows={data.users.map((user) => [
                      `${user.firstName} ${user.lastName}`,
                      user.email,
                      user.roleType || "—",
                      user.isActive ? "Active" : "Inactive",
                    ])}
                  />
                </TabsContent>

                <TabsContent value="whatsapp">
                  <DataTable
                    title="WhatsApp Accounts"
                    columns={["Phone", "Display name", "WABA", "Status"]}
                    rows={data.whatsappAccounts.map((item) => [
                      item.phoneNumber,
                      item.displayName || "—",
                      item.wabaId,
                      item.status,
                    ])}
                  />
                </TabsContent>

                <TabsContent value="campaigns">
                  <DataTable
                    title="Campaigns"
                    columns={["Name", "Status", "Audience", "Sent", "Failed"]}
                    rows={data.campaigns.map((item) => [
                      item.name,
                      item.status,
                      item.totalContacts,
                      item.sentCount,
                      item.failedCount,
                    ])}
                  />
                </TabsContent>

                <TabsContent value="messages" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
                    {Object.entries(data.messages.stats || {}).map(
                      ([key, value]) => (
                        <Card key={key} className="border-slate-200 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-slate-500">
                              {key}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-xl font-semibold">
                            {Number(value).toLocaleString()}
                          </CardContent>
                        </Card>
                      ),
                    )}
                  </div>
                  <DataTable
                    title="Recent messages"
                    columns={["Direction", "Type", "To/From", "Status", "When"]}
                    rows={data.messages.recent.map((item) => [
                      item.direction,
                      item.type,
                      item.to || item.from || "—",
                      item.status,
                      new Date(item.createdAt).toLocaleString(),
                    ])}
                  />
                </TabsContent>

                <TabsContent value="subscription" className="space-y-4">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Active subscription</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data.subscription.active ? (
                        <div className="space-y-1 text-sm">
                          <p className="text-lg font-semibold">
                            {data.subscription.active.plan?.name}
                          </p>
                          <p>
                            INR {data.subscription.active.plan?.price} / month
                          </p>
                          <p className="text-slate-500">
                            Started{" "}
                            {new Date(
                              data.subscription.active.startDate,
                            ).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-500">No active subscription</p>
                      )}
                    </CardContent>
                  </Card>
                  <DataTable
                    title="Subscription history"
                    columns={["Plan", "Price", "Active", "Start", "End"]}
                    rows={data.subscription.history.map((item) => [
                      item.plan?.name || "—",
                      item.plan?.price ?? "—",
                      item.isActive ? "Yes" : "No",
                      new Date(item.startDate).toLocaleDateString(),
                      item.endDate
                        ? new Date(item.endDate).toLocaleDateString()
                        : "—",
                    ])}
                  />
                </TabsContent>

                <TabsContent value="billing" className="space-y-4">
                  <DataTable
                    title="Invoices"
                    columns={["Invoice", "Plan", "Amount", "Status", "Issued"]}
                    rows={data.billing.invoices.map((item) => [
                      item.invoiceNumber,
                      item.planName,
                      `${item.currency} ${item.amount}`,
                      item.status,
                      new Date(item.issuedAt).toLocaleDateString(),
                    ])}
                  />
                  <DataTable
                    title="Billing transactions"
                    columns={["Type", "Amount", "Description", "When"]}
                    rows={data.billing.transactions.map((item) => [
                      item.type,
                      `${item.currency} ${item.amount}`,
                      item.description,
                      new Date(item.createdAt).toLocaleString(),
                    ])}
                  />
                </TabsContent>

                <TabsContent value="usage">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Messages", data.usage.messages?.total ?? 0],
                      ["Templates", data.usage.templates ?? 0],
                      ["Bots", data.usage.bots ?? 0],
                      ["Contacts", data.usage.contacts ?? 0],
                      ["WhatsApp numbers", data.usage.whatsappNumbers ?? 0],
                      ["Users", data.usage.users ?? 0],
                      ["Campaigns", data.usage.campaigns ?? 0],
                      [
                        "Plan message limit",
                        data.usage.planLimits?.monthlyMessageLimit ?? "Unlimited",
                      ],
                    ].map(([label, value]) => (
                      <Card key={String(label)} className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-slate-500">
                            {label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">
                          {typeof value === "number"
                            ? value.toLocaleString()
                            : value}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="audit">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        Login & Audit History
                      </CardTitle>
                      <CardDescription>
                        Status changes, billing events, and recent message activity
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {data.auditHistory.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                          No audit events yet
                        </p>
                      ) : (
                        data.auditHistory.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-slate-500">
                                  {item.detail}
                                </p>
                              </div>
                              <Badge className="bg-slate-100 text-slate-700">
                                {item.type}
                              </Badge>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="support">
                  <DataTable
                    title="Support Tickets"
                    columns={["Ref", "Subject", "Category", "Status", "Priority"]}
                    rows={data.supportTickets.map((item) => [
                      item.ref,
                      item.subject,
                      item.category,
                      item.status,
                      item.priority,
                    ])}
                    emptyIcon={LifeBuoy}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function DataTable({
  title,
  columns,
  rows,
  emptyIcon: EmptyIcon = Shield,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  emptyIcon?: React.ElementType;
}) {
  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-500"
                >
                  <EmptyIcon className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                  No records
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${title}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={`${index}-${cellIndex}`}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
