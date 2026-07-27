import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  KeyRound,
  Power,
  RefreshCcw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type ResellerItem = {
  id: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  commissionRate: number;
  isActive: boolean;
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    suspendedCustomers: number;
    monthlyRevenue: number;
  };
};

type CustomerItem = {
  id: string;
  companyName: string;
  isActive: boolean;
  creditBalance: number;
  reseller: {
    id: string;
    companyName: string;
  } | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
    isVerified: boolean;
  } | null;
  subscription: {
    id: string;
    startDate: string;
    plan: {
      id: string;
      name: string;
      maxTemplates: number;
      maxBots: number | null;
      monthlyMessageLimit: number | null;
    } | null;
  } | null;
};

export default function UserManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const adminToken = localStorage.getItem("auth_token");

  const [resellers, setResellers] = useState<ResellerItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStatus, setCustomerStatus] = useState("all");
  const [customerResellerId, setCustomerResellerId] = useState("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const fetchResellers = async () => {
    const response = await fetch(
      `${API_BASE}/super-admin/resellers/list?page=1&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );
    const json = await response.json();

    if (!response.ok || json.status !== 1) {
      throw new Error(json.message || "Unable to load resellers");
    }

    setResellers(json.data.items || []);
  };

  const fetchCustomers = async (
    search = customerSearch,
    status = customerStatus,
    resellerId = customerResellerId,
  ) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "30");
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    if (resellerId !== "all") params.set("resellerId", resellerId);

    const response = await fetch(
      `${API_BASE}/super-admin/tools/customers?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );
    const json = await response.json();

    if (!response.ok || json.status !== 1) {
      throw new Error(json.message || "Unable to load customers");
    }

    setCustomers(json.data.items || []);
  };

  const refreshPage = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchResellers(), fetchCustomers()]);
    } catch (error) {
      toast({
        title: "Unable to load admin tools",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPage();
  }, []);

  const supportStats = useMemo(
    () => ({
      totalResellers: resellers.length,
      inactiveResellers: resellers.filter((item) => !item.isActive).length,
      totalCustomers: customers.length,
      inactiveCustomers: customers.filter((item) => !item.isActive).length,
    }),
    [customers, resellers],
  );

  const saveSupportSession = (
    originLabel?: string,
    extras?: Record<string, string | undefined>,
  ) => {
    if (!adminToken) {
      throw new Error("Admin session is not available");
    }

    localStorage.setItem(
      "support_session",
      JSON.stringify({
        originToken: adminToken,
        originPortal: "admin",
        originLabel: originLabel || user?.email || "Super Admin",
        adminName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        adminEmail: user?.email,
        ...extras,
      }),
    );
  };

  const loginAsReseller = async (reseller: ResellerItem) => {
    try {
      setBusyKey(`reseller-login-${reseller.id}`);
      const response = await fetch(
        `${API_BASE}/super-admin/tools/login-as-reseller`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            resellerId: reseller.id,
          }),
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to login as reseller");
      }

      saveSupportSession(user?.email || "Super Admin", {
        resellerCompanyName: json.data.supportSession?.resellerCompanyName,
      });
      localStorage.setItem("auth_token", json.data.token);
      localStorage.setItem("auth_portal", json.data.portal || "reseller");
      window.location.assign(json.data.redirectTo || "/reseller");
    } catch (error) {
      toast({
        title: "Login as reseller failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setBusyKey(null);
    }
  };

  const loginAsCustomer = async (customer: CustomerItem) => {
    try {
      setBusyKey(`customer-login-${customer.id}`);
      const response = await fetch(
        `${API_BASE}/super-admin/tools/login-as-customer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            accountId: customer.id,
          }),
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to login as customer");
      }

      saveSupportSession(user?.email || "Super Admin", {
        customerCompanyName: json.data.supportSession?.customerCompanyName,
      });
      localStorage.setItem("auth_token", json.data.token);
      localStorage.setItem("auth_portal", json.data.portal || "user");
      window.location.assign(json.data.redirectTo || "/");
    } catch (error) {
      toast({
        title: "Login as customer failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setBusyKey(null);
    }
  };

  const forceActivate = async (
    entityType: "RESELLER" | "CUSTOMER_ACCOUNT",
    id: string,
  ) => {
    try {
      setBusyKey(`activate-${entityType}-${id}`);
      const response = await fetch(
        `${API_BASE}/super-admin/tools/force-activate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            entityType,
            id,
          }),
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to force activate");
      }

      toast({
        title: "Account activated",
        description:
          entityType === "RESELLER"
            ? "Reseller account was force activated."
            : "Customer account was force activated.",
      });

      await refreshPage();
    } catch (error) {
      toast({
        title: "Force activate failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const resetLimits = async (customer: CustomerItem) => {
    try {
      setBusyKey(`reset-${customer.id}`);
      const response = await fetch(
        `${API_BASE}/super-admin/tools/reset-limits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            accountId: customer.id,
          }),
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to reset limits");
      }

      toast({
        title: "Limits reset",
        description: `${json.data.resetTokens || 0} service token limits were reset for ${customer.companyName}.`,
      });
    } catch (error) {
      toast({
        title: "Reset limits failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500">
              Hidden Power
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              Admin Tools
            </h1>
            <p className="text-muted-foreground">
              Support-king controls for instant impersonation, recovery, and
              limit resets.
            </p>
          </div>
          <Button variant="outline" onClick={refreshPage}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Resellers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {supportStats.totalResellers}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Power className="h-4 w-4" />
                Inactive Resellers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {supportStats.inactiveResellers}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {supportStats.totalCustomers}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Inactive Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {supportStats.inactiveCustomers}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login As Reseller</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellers.map((reseller) => (
                  <TableRow key={reseller.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reseller.companyName}</p>
                        <p className="text-sm text-muted-foreground">
                          {reseller.firstName} {reseller.lastName} •{" "}
                          {reseller.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          reseller.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {reseller.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{reseller.commissionRate}%</TableCell>
                    <TableCell>{reseller.stats.totalCustomers}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loginAsReseller(reseller)}
                          disabled={busyKey === `reseller-login-${reseller.id}`}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Login As
                        </Button>
                        {!reseller.isActive ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              forceActivate("RESELLER", reseller.id)
                            }
                            disabled={
                              busyKey === `activate-RESELLER-${reseller.id}`
                            }
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Force Activate
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Login As Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Search customer, owner, email, phone..."
                  className="pl-10"
                />
              </div>
              <Select value={customerStatus} onValueChange={setCustomerStatus}>
                <SelectTrigger className="w-full xl:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={customerResellerId}
                onValueChange={setCustomerResellerId}
              >
                <SelectTrigger className="w-full xl:w-[220px]">
                  <SelectValue placeholder="Reseller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resellers</SelectItem>
                  {resellers.map((reseller) => (
                    <SelectItem key={reseller.id} value={reseller.id}>
                      {reseller.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() =>
                  fetchCustomers(
                    customerSearch,
                    customerStatus,
                    customerResellerId,
                  )
                }
              >
                Apply
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.companyName}</p>
                        <p className="text-sm text-muted-foreground">
                          Balance: INR{" "}
                          {Number(customer.creditBalance || 0).toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.reseller?.companyName || "Direct"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          customer.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.subscription?.plan?.name || "No active plan"}
                    </TableCell>
                    <TableCell>
                      {customer.owner ? (
                        <div>
                          <p className="font-medium">
                            {customer.owner.firstName} {customer.owner.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer.owner.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No active owner
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loginAsCustomer(customer)}
                          disabled={busyKey === `customer-login-${customer.id}`}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Login As
                        </Button>
                        {!customer.isActive ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              forceActivate("CUSTOMER_ACCOUNT", customer.id)
                            }
                            disabled={
                              busyKey ===
                              `activate-CUSTOMER_ACCOUNT-${customer.id}`
                            }
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Force Activate
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetLimits(customer)}
                          disabled={busyKey === `reset-${customer.id}`}
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Reset Limits
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
