import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  LogIn,
  Save,
  ShieldCheck,
  Trash2,
  Sparkles,
  ChevronRight,
  Building2,
  Activity,
  Contact,
  CreditCard,
  FileText,
  LayoutDashboard,
  Megaphone,
  Pencil,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken, setAuthToken } from "@/utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type DetailUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  role: {
    id: string;
    name: string;
    roleType: string;
  } | null;
};

type Detail = {
  id: string;
  companyName: string;
  isActive: boolean;
  users: DetailUser[];
  subscriptions: Array<{
    id: string;
    plan: {
      name: string;
      price: number;
      currency: string;
    };
    startDate: string;
  }>;
  _count: {
    contacts: number;
    templates: number;
    campaigns: number;
  };
};

const tabs = [
  {
    key: "edit",
    label: "Edit",
    icon: Pencil,
  },

  // TEAM MANAGEMENT
  {
    key: "teams",
    label: "Team",
    icon: Users,
  },

  {
    key: "add",
    label: "Add User",
    icon: UserPlus,
  },

  { key: "users", label: "Users", icon: Users },
  // CUSTOMER DATA
  {
    key: "contacts",
    label: "Contacts",
    icon: Contact,
  },

  {
    key: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
  },

  {
    key: "templates",
    label: "Templates",
    icon: FileText,
  },

  // BILLING
  {
    key: "subscription",
    label: "Subscriptions",
    icon: CreditCard,
  },

  {
    key: "billing",
    label: "Billing",
    icon: Wallet,
  },

  // LOGS
  {
    key: "activity",
    label: "Activity",
    icon: Activity,
  },
];

const roleLabels: Record<string, string> = {
  CUSTOMER_OWNER: "Owner",
  CUSTOMER_ADMIN: "Admin",
  CUSTOMER_AGENT: "Agent",
};

export default function ResellerCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("edit");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPhone: "",
  });
  const [memberForm, setMemberForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    roleType: "CUSTOMER_AGENT",
  });
  const [saving, setSaving] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [loggingInAsClient, setLoggingInAsClient] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [subPage, setSubPage] = useState(1);
  const [subSearch, setSubSearch] = useState("");
  const [subLoading, setSubLoading] = useState(false);

  const limit = 6;

  function useDebounce(value: string, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
  }

  const debouncedSearch = useDebounce(subSearch, 500);

  const fetchSubscriptions = async () => {
    try {
      setSubLoading(true);

      const res = await fetch(
        `${API_BASE}/reseller/customers/subscriptions?accountId=${id}&page=${subPage}&limit=${limit}&search=${debouncedSearch}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        setSubscriptionData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };

  const loadDetail = async () => {
    const response = await fetch(
      `${API_BASE}/reseller/customers/detail?accountId=${id}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      },
    );
    const json = await response.json();
    if (response.ok && json.status === 1) {
      const nextDetail = json.data;
      setDetail(nextDetail);
      const owner =
        nextDetail.users?.find(
          (user: DetailUser) => user.role?.roleType === "CUSTOMER_OWNER",
        ) || nextDetail.users?.[0];
      setForm({
        companyName: nextDetail.companyName || "",
        ownerFirstName: owner?.firstName || "",
        ownerLastName: owner?.lastName || "",
        ownerEmail: owner?.email || "",
        ownerPhone: owner?.phone || "",
      });
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  useEffect(() => {
    if (activeTab === "subscription") {
      fetchSubscriptions();
    }
  }, [subPage, debouncedSearch, activeTab]);

  useEffect(() => {
    setSubPage(1);
  }, [debouncedSearch]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/reseller/customers/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          accountId: id,
          ...form,
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to save customer");
      }

      toast({
        title: "Customer updated",
        description: "Managed customer details saved successfully.",
      });

      await loadDetail();
    } catch (error) {
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Unable to save customer",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setAddingUser(true);

    try {
      const response = await fetch(
        `${API_BASE}/reseller/customers/add-team-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            accountId: id,
            ...memberForm,
          }),
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to add user");
      }

      toast({
        title: "User added",
        description: "Customer user added successfully.",
      });
      setMemberForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        roleType: "CUSTOMER_AGENT",
      });
      await loadDetail();
    } catch (error) {
      toast({
        title: "Add user failed",
        description:
          error instanceof Error ? error.message : "Unable to add user",
        variant: "destructive",
      });
    } finally {
      setAddingUser(false);
    }
  };

  const updateUser = async (
    userId: string,
    payload: { roleType?: string; isActive?: boolean },
  ) => {
    setBusyUserId(userId);
    try {
      const response = await fetch(
        `${API_BASE}/reseller/customers/update-user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            accountId: id,
            userId,
            ...payload,
          }),
        },
      );
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to update user");
      }

      toast({
        title: "User updated",
        description: "Customer user settings updated successfully.",
      });
      await loadDetail();
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Unable to update user",
        variant: "destructive",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const removeUser = async (userId: string) => {
    setBusyUserId(userId);
    try {
      const response = await fetch(
        `${API_BASE}/reseller/customers/remove-user`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            accountId: id,
            userId,
          }),
        },
      );

      if (response.status !== 204) {
        const json = await response.json();
        if (!response.ok || json.status !== 1) {
          throw new Error(json.message || "Unable to remove user");
        }
      }

      toast({
        title: "User removed",
        description: "Customer user removed successfully.",
      });
      await loadDetail();
    } catch (error) {
      toast({
        title: "Remove failed",
        description:
          error instanceof Error ? error.message : "Unable to remove user",
        variant: "destructive",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const loginAsClient = async () => {
    const confirm = await Swal.fire({
      title: "Login as Client?",
      text: "You will be switched to the customer dashboard.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16A249",
      cancelButtonColor: "#EF4444",
      confirmButtonText: "Yes, continue",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    setLoggingInAsClient(true);

    // 🔄 Loading popup
    Swal.fire({
      title: "Switching account...",
      text: "Please wait while we log you in",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const resellerToken = getAuthToken("reseller");

      if (!resellerToken) {
        throw new Error("Current reseller session is not available");
      }

      const response = await fetch(`${API_BASE}/reseller/customers/login-as`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resellerToken}`,
        },
        body: JSON.stringify({ accountId: id }),
      });

      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to login as client");
      }

      // ✅ Save support session
      localStorage.setItem(
        "support_session",
        JSON.stringify({
          originToken: resellerToken,
          originPortal: "reseller",
          originLabel:
            json.data.supportSession?.resellerCompanyName ||
            json.data.supportSession?.resellerName,
          resellerCompanyName: json.data.supportSession?.resellerCompanyName,
          resellerName: json.data.supportSession?.resellerName,
          customerCompanyName: json.data.supportSession?.customerCompanyName,
        }),
      );

      setAuthToken("user", json.data.token);

      // ✅ Success state
      await Swal.fire({
        icon: "success",
        title: "Logged in successfully",
        text: "Redirecting to customer dashboard...",
        timer: 1500,
        showConfirmButton: false,
      });

      window.location.assign(json.data.redirectTo || "/");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login failed",
        text:
          error instanceof Error
            ? error.message
            : "Unable to open client dashboard",
      });

      setLoggingInAsClient(false);
    }
  };

  const totalUsers = detail?.users.length ?? 0;
  const activeUsers = detail?.users.filter((user) => user.isActive).length ?? 0;

  return (
    <ResellerShell
      title={detail?.companyName || "Customer detail"}
      eyebrow="Managed Account"
    >
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={() => navigate("/reseller/customers")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to customers
          </Button>

          <Button
            type="button"
            disabled={loggingInAsClient || !detail?.isActive}
            className="rounded-xl bg-[#16A249] text-white hover:bg-[#12813a]"
            onClick={loginAsClient}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {loggingInAsClient ? "Opening client..." : "Login as client"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* CONTACTS */}
        <div className="group relative rounded-xl border bg-white p-3 shadow-sm hover:shadow transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-500">Contacts</p>
            <div className="h-7 w-7 rounded-full bg-green-50 text-[#16A249] flex items-center justify-center">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>

          <p className="mt-1 text-xl font-semibold text-gray-900">
            {detail?._count.contacts ?? 0}
          </p>
        </div>

        {/* TEMPLATES */}
        <div className="group relative rounded-xl border bg-white p-3 shadow-sm hover:shadow transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-500">Templates</p>
            <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>

          <p className="mt-1 text-xl font-semibold text-gray-900">
            {detail?._count.templates ?? 0}
          </p>
        </div>

        {/* CAMPAIGNS */}
        <div className="group relative rounded-xl border bg-white p-3 shadow-sm hover:shadow transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-500">Campaigns</p>
            <div className="h-7 w-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Megaphone className="h-3.5 w-3.5" />
            </div>
          </div>

          <p className="mt-1 text-xl font-semibold text-gray-900">
            {detail?._count.campaigns ?? 0}
          </p>
        </div>

        {/* SUBSCRIPTION */}
        <div
          className="relative overflow-hidden rounded-xl p-3 text-white shadow-sm 
      bg-gradient-to-br from-[#16A249] via-[#12813a] to-[#0f6c30]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] opacity-80">Active Plan</p>
            <CreditCard className="h-3.5 w-3.5 opacity-80" />
          </div>

          {detail?.subscriptions?.length ? (
            <>
              <p className="mt-1 text-sm font-semibold">
                {detail.subscriptions[0].plan.name}
              </p>

              <p className="text-xs opacity-90">
                {detail.subscriptions[0].plan.currency}{" "}
                {detail.subscriptions[0].plan.price.toLocaleString()}
              </p>

              <p className="text-[10px] mt-1 opacity-70">
                {new Date(
                  detail.subscriptions[0].startDate,
                ).toLocaleDateString()}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs opacity-80">No active plan</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 my-6 border-b border-gray-200 pb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap
        ${
          activeTab === tab.key
            ? "text-[#16A249] bg-green-50"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        }`}
            >
              <Icon className="h-4 w-4" />

              {tab.label}

              {/* ACTIVE INDICATOR */}
              {activeTab === tab.key && (
                <span className="absolute bottom-[-12px] left-0 w-full h-[2px] bg-[#16A249] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {activeTab === "add" && (
          <Card className="rounded-2xl border bg-white shadow-sm">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <UserPlus className="h-5 w-5 text-[#16A249]" />
                Add customer user
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={addUser} className="grid gap-4 md:grid-cols-2">
                {[
                  { key: "firstName", label: "First name" },
                  { key: "lastName", label: "Last name" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "password", label: "Password", type: "password" },
                ].map((field) => (
                  <div
                    key={field.key}
                    className={
                      field.key === "password"
                        ? "space-y-2 md:col-span-2"
                        : "space-y-2"
                    }
                  >
                    <Label>{field.label}</Label>
                    <Input
                      type={field.type || "text"}
                      value={memberForm[field.key as keyof typeof memberForm]}
                      onChange={(event) =>
                        setMemberForm((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      className="border bg-gray-50 focus:border-[#16A249]"
                    />
                  </div>
                ))}

                <div className="space-y-2 md:col-span-2">
                  <Label>Role</Label>
                  <Select
                    value={memberForm.roleType}
                    onValueChange={(value) =>
                      setMemberForm((current) => ({
                        ...current,
                        roleType: value,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-gray-50">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER_ADMIN">
                        Customer Admin
                      </SelectItem>
                      <SelectItem value="CUSTOMER_AGENT">
                        Customer Agent
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl border bg-green-50 p-4 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-[#16A249]" />
                    <p className="text-xs text-gray-600">
                      Owner account stays protected. Reseller can manage admin
                      and agent users for this customer.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    disabled={addingUser}
                    className="rounded-xl bg-[#16A249] px-5 text-white hover:bg-[#12813a]"
                  >
                    {addingUser ? "Adding user..." : "Add user"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "edit" && (
          <div className="space-y-6">
            <Card className="rounded-2xl border bg-white shadow-sm">
              <CardHeader className="rounded-t-2xl border-b bg-gray-50">
                <CardTitle className="text-gray-900">
                  Edit managed customer
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-6">
                <form onSubmit={save} className="grid gap-5 md:grid-cols-2">
                  {[
                    { key: "companyName", label: "Company name" },
                    { key: "ownerFirstName", label: "Owner first name" },
                    { key: "ownerLastName", label: "Owner last name" },
                    { key: "ownerEmail", label: "Owner email" },
                    { key: "ownerPhone", label: "Owner phone" },
                  ].map((field) => (
                    <div
                      key={field.key}
                      className={
                        field.key === "companyName"
                          ? "space-y-2 md:col-span-2"
                          : "space-y-2"
                      }
                    >
                      <Label>{field.label}</Label>
                      <Input
                        value={form[field.key as keyof typeof form]}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        className="border bg-gray-50 focus:border-[#16A249]"
                      />
                    </div>
                  ))}

                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-[#16A249] px-5 text-white hover:bg-[#12813a]"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "users" && (
          <Card className="rounded-2xl border bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-gray-50">
              <div>
                <CardTitle className="text-gray-900">Customer users</CardTitle>
                <p className="mt-1 text-xs text-gray-500">
                  Reseller can view users, assign roles, and remove access.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs text-gray-600">
                <Users className="h-4 w-4 text-[#16A249]" />
                {activeUsers}/{totalUsers} active
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {detail?.users.length ? (
                detail.users.map((user) => {
                  const isOwner = user.role?.roleType === "CUSTOMER_OWNER";
                  const isBusy = busyUserId === user.id;

                  return (
                    <div
                      key={user.id}
                      className="rounded-2xl border bg-gray-50 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                user.isActive
                                  ? "bg-green-50 text-[#16A249]"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {user.isActive ? "Active" : "Paused"}
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600">
                              {roleLabels[
                                user.role?.roleType || "CUSTOMER_AGENT"
                              ] ||
                                user.role?.roleType ||
                                "User"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[170px_140px_auto]">
                          <Select
                            value={user.role?.roleType || "CUSTOMER_AGENT"}
                            onValueChange={(value) =>
                              updateUser(user.id, { roleType: value })
                            }
                            disabled={isOwner || isBusy}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Assign role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CUSTOMER_ADMIN">
                                Customer Admin
                              </SelectItem>
                              <SelectItem value="CUSTOMER_AGENT">
                                Customer Agent
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl bg-white"
                            disabled={isOwner || isBusy}
                            onClick={() =>
                              updateUser(user.id, {
                                isActive: !user.isActive,
                              })
                            }
                          >
                            {isBusy
                              ? "Updating..."
                              : user.isActive
                                ? "Pause User"
                                : "Activate User"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={isOwner || isBusy}
                            onClick={() => removeUser(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                  No users found for this customer.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "subscription" && (
          <div className="space-y-5">
            {/* 🔥 ACTIVE PLAN */}
            {subscriptionData?.list?.find((s: any) => s.isActive) && (
              <div className="rounded-2xl p-5 bg-gradient-to-r from-[#16A249] to-[#12813a] text-white shadow-md">
                {(() => {
                  const active = subscriptionData.list.find(
                    (s: any) => s.isActive,
                  );

                  return (
                    <>
                      <p className="text-xs opacity-80">Active Plan</p>
                      <p className="text-lg font-semibold mt-1">
                        {active.planName}
                      </p>
                      <p className="text-sm opacity-90">
                        {active.currency} {active.amount.toLocaleString()} /
                        month
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* 🔍 SEARCH */}
            <div className="relative">
              <input
                value={subSearch}
                onChange={(e) => {
                  setSubPage(1);
                  setSubSearch(e.target.value);
                }}
                placeholder="Search subscriptions..."
                className="w-full border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#16A249]"
              />
            </div>

            {/* 📄 TABLE */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Plan</th>
                    <th className="px-5 py-3 text-left">Amount</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Duration</th>
                  </tr>
                </thead>

                <tbody>
                  {/* 🔄 LOADING */}
                  {subLoading ? (
                    <tr>
                      <td colSpan={4} className="py-12">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-8 w-8 rounded-full border-2 border-[#16A249] border-t-transparent animate-spin" />
                          <p className="text-sm text-gray-500">
                            Loading subscriptions...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : subscriptionData?.list?.length ? (
                    /* ✅ DATA */
                    subscriptionData.list.map((row: any) => {
                      const start = new Date(row.startDate);
                      const end = row.endDate ? new Date(row.endDate) : null;
                      const today = new Date();

                      const daysLeft = end
                        ? Math.ceil(
                            (end.getTime() - today.getTime()) /
                              (1000 * 60 * 60 * 24),
                          )
                        : null;

                      const isExpired = daysLeft !== null && daysLeft < 0;
                      const isExpiringSoon =
                        daysLeft !== null && daysLeft <= 5 && daysLeft > 0;

                      return (
                        <tr
                          key={row.id}
                          className={`border-t transition hover:bg-gray-50 ${
                            row.isActive ? "bg-green-50/30" : ""
                          }`}
                        >
                          {/* PLAN */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-gray-900">
                                {row.planName}
                              </span>

                              {isExpiringSoon && (
                                <span className="text-[11px] text-orange-500 font-medium">
                                  ⚠ Expiring in {daysLeft} days
                                </span>
                              )}
                            </div>
                          </td>

                          {/* AMOUNT */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 text-[#16A249] font-semibold text-xs">
                              {row.currency} {row.amount.toLocaleString()}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                row.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  row.isActive ? "bg-green-600" : "bg-red-500"
                                }`}
                              />
                              {row.isActive ? "Active" : "Expired"}
                            </span>
                          </td>

                          {/* DURATION */}
                          <td className="px-5 py-4 text-sm whitespace-nowrap">
                            <span className="text-gray-700">
                              {start.toLocaleDateString()}
                            </span>

                            <span className="mx-1 text-gray-400">→</span>

                            <span
                              className={`font-medium ${
                                daysLeft < 0
                                  ? "text-red-500"
                                  : daysLeft <= 5
                                    ? "text-orange-500"
                                    : "text-[#16A249]"
                              }`}
                            >
                              {end ? end.toLocaleDateString() : "Ongoing"}
                            </span>

                            {end && (
                              <span className="ml-2 text-xs text-gray-400">
                                ({daysLeft < 0 ? "Expired" : `${daysLeft}d`})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    /* EMPTY STATE */
                    <tr>
                      <td colSpan={4} className="py-14">
                        <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-green-300 bg-green-50 py-12 mx-4">
                          {/* ICON */}
                          <div className="mb-3 h-10 w-10 flex items-center justify-center rounded-full bg-white text-green-400">
                            <CreditCard className="h-5 w-5" />
                          </div>

                          <p className="text-sm font-semibold text-gray-900">
                            No subscriptions found
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            Try changing your search or filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 📄 PAGINATION */}
              {subscriptionData?.pagination && (
                <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
                  {/* LEFT INFO */}
                  <p className="text-xs text-gray-500">
                    Showing page{" "}
                    <span className="font-medium text-gray-800">
                      {subscriptionData.pagination.page}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-gray-800">
                      {subscriptionData.pagination.totalPages}
                    </span>
                  </p>

                  {/* CONTROLS */}
                  <div className="flex items-center gap-2">
                    {/* PREV */}
                    <button
                      disabled={subPage === 1}
                      onClick={() => setSubPage((p) => p - 1)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition ${
                        subPage === 1
                          ? "text-gray-400 bg-white cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                      }`}
                    >
                      ← Prev
                    </button>

                    {/* CURRENT PAGE BADGE */}
                    <span className="px-3 py-1.5 text-sm rounded-lg bg-[#16A249]/10 text-[#16A249] font-medium">
                      {subPage}
                    </span>

                    {/* NEXT */}
                    <button
                      disabled={
                        subPage >= subscriptionData.pagination.totalPages
                      }
                      onClick={() => setSubPage((p) => p + 1)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition ${
                        subPage >= subscriptionData.pagination.totalPages
                          ? "text-gray-400 bg-white cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ResellerShell>
  );
}
