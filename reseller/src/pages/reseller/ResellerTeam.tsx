import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import { getAuthToken } from "@/utils/authStorage";

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

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type TeamRole = "OWNER" | "ADMIN" | "ACCOUNT_MANAGER" | "SUPPORT" | "VIEWER";

type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleType: "RESELLER_SUB_ADMIN" | "RESELLER_SUPPORT";
  teamRole: TeamRole;
  roleLabel: string;
  permissions: string[];
  inviteStatus: string;
  isActive: boolean;
};

type CustomerSummary = {
  id: string;
  companyName: string;
  counts: {
    users: number;
  };
};

const roleOptions: Array<{
  value: TeamRole;
  label: string;
  description: string;
  permissions: string[];
}> = [
  {
    value: "OWNER",
    label: "Owner",
    description: "Full access across the reseller workspace and every business control.",
    permissions: [
      "customers.view",
      "customers.manage",
      "campaigns.view",
      "templates.view",
      "billing.view",
      "team.invite",
      "team.roles.assign",
      "team.permissions.manage",
      "audit.view",
      "settings.manage",
      "support.tools.view",
      "analytics.view",
      "whatsapp.accounts.manage",
      "white.label.manage",
    ],
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Most business controls, including team, billing, settings, and operations.",
    permissions: [
      "customers.view",
      "customers.manage",
      "campaigns.view",
      "templates.view",
      "billing.view",
      "team.invite",
      "team.roles.assign",
      "audit.view",
      "notifications.view",
      "settings.manage",
    ],
  },
  {
    value: "ACCOUNT_MANAGER",
    label: "Account Manager",
    description: "Customers and campaigns access with day-to-day account handling.",
    permissions: [
      "customers.view",
      "customers.manage",
      "campaigns.view",
      "templates.view",
      "notifications.view",
    ],
  },
  {
    value: "SUPPORT",
    label: "Support",
    description: "View and help-only access for operational support work.",
    permissions: [
      "customers.view",
      "campaigns.view",
      "templates.view",
      "support.tools.view",
      "notifications.view",
    ],
  },
  {
    value: "VIEWER",
    label: "Viewer",
    description: "Read-only access to monitor accounts, campaigns, and analytics.",
    permissions: [
      "customers.view",
      "campaigns.view",
      "templates.view",
      "analytics.view",
    ],
  },
];

const labelForPermission = (permission: string) =>
  permission
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function ResellerTeam() {
const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    teamRole: "SUPPORT" as TeamRole,
  });

  const selectedRole = useMemo(
    () => roleOptions.find((option) => option.value === form.teamRole) || roleOptions[2],
    [form.teamRole],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${getAuthToken()}`,
      };
      const [teamResponse, customersResponse] = await Promise.all([
        fetch(`${API_BASE}/reseller/team`, { headers }),
        fetch(`${API_BASE}/reseller/customers?limit=20`, { headers }),
      ]);
      const [teamJson, customersJson] = await Promise.all([
        teamResponse.json(),
        customersResponse.json(),
      ]);

      if (teamResponse.ok && teamJson.status === 1) {
        setMembers(teamJson.data || []);
      }

      if (customersResponse.ok && customersJson.status === 1) {
        setCustomers(customersJson.data.items || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

const createMember = async () => {
  setSaving(true);

  try {
    const response = await fetch(`${API_BASE}/reseller/team/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(form),
    });

    const json = await response.json();

    if (!response.ok || json.status !== 1) {
      throw new Error(json.message || "Unable to invite team member");
    }

    setTemporaryPassword(json.data?.temporaryPassword || "");

    toast({
      title: "Member invited",
      description:
        "Internal team member created successfully.",
    });

    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      teamRole: "SUPPORT",
    });

    await loadData();

    // NAVIGATE TO TEAM LIST
    setTimeout(() => {
    navigate("/reseller/team/list");
    }, 800);
  } catch (error) {
    toast({
      title: "Invite failed",
      description:
        error instanceof Error
          ? error.message
          : "Unable to invite team member",
      variant: "destructive",
    });
  } finally {
    setSaving(false);
  }
};
  const totalCustomerUsers = customers.reduce(
    (sum, customer) => sum + Number(customer.counts?.users || 0),
    0,
  );
  const activeMembers = members.filter((member) => member.isActive).length;
  const adminLikeMembers = members.filter(
    (member) =>
      member.teamRole === "OWNER" ||
      member.teamRole === "ADMIN" ||
      member.teamRole === "ACCOUNT_MANAGER",
  ).length;

return (
  <ResellerShell title="Internal Team" eyebrow="Reseller Access">
    <div className="relative min-h-screen overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

      <div className="absolute top-0 right-0 h-[450px] w-[450px] rounded-full bg-[#16A249]/10 blur-3xl" />

      <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="relative z-10 space-y-6">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/20 bg-white/70 p-6 backdrop-blur-xl dark:bg-slate-900/70">
          <div className="absolute inset-0 bg-gradient-to-r from-[#16A249]/5 via-transparent to-transparent" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#16A249]/20 bg-[#16A249]/10 px-3 py-1 text-xs font-medium text-[#16A249]">
                <Sparkles className="h-3.5 w-3.5" />
                Premium Team Workspace
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Internal Team Management
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  Invite reseller internal members and manage secure role-based
                  access permissions.
                </p>
              </div>
            </div>

            <Button
              asChild
              className="h-11 rounded-2xl bg-gradient-to-r from-[#16A249] to-[#12813a] px-5 text-white transition-all hover:scale-[1.02] hover:shadow-green-500/40"
            >
              <Link to="/reseller/team/list">
                <Users className="mr-2 h-4 w-4" />
                Open Team List
              </Link>
            </Button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Internal Members",
              value: members.length,
              icon: Users,
              color: "from-emerald-500 to-green-600",
            },
            {
              label: "Active Members",
              value: activeMembers,
              icon: ShieldCheck,
              color: "from-blue-500 to-cyan-600",
            },
            {
              label: "Admins / Owners",
              value: adminLikeMembers,
              icon: UserPlus,
              color: "from-violet-500 to-purple-600",
            },
            {
              label: "Customer Users",
              value: totalCustomerUsers,
              icon: Users,
              color: "from-orange-500 to-amber-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="group relative overflow-hidden rounded-[28px] border border-white/20 bg-white/80 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:bg-slate-900/80"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br opacity-[0.04] ${item.color}`}
                />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {loading ? "..." : item.value}
                    </h3>
                  </div>

                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-5 flex items-center text-xs font-medium text-[#16A249]">
                  Team analytics
                </div>
              </div>
            );
          })}
        </div>

        {/* MAIN CONTENT */}
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* INVITE FORM */}
          <Card className="overflow-hidden rounded-[30px] border border-white/20 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80">
            <CardHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                    Invite Internal Member
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    Create reseller workspace access for your internal team
                  </p>
                </div>

                <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16A249]/10 text-[#16A249]">
                  <UserPlus className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-5 p-6 md:grid-cols-2">
              {[
                { key: "firstName", label: "First name" },
                { key: "lastName", label: "Last name" },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                {
                  key: "password",
                  label: "Temporary password",
                  type: "password",
                  helper:
                    "Leave blank to auto-generate an invite password.",
                },
              ].map((field) => (
                <div
                  key={field.key}
                  className={
                    field.key === "password"
                      ? "space-y-2 md:col-span-2"
                      : "space-y-2"
                  }
                >
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {field.label}
                  </Label>

                  <Input
                    type={field.type || "text"}
                    value={form[field.key as keyof typeof form]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    className="h-12 rounded-2xl border-slate-200 bg-white/70 focus:border-[#16A249] focus:ring-4 focus:ring-[#16A249]/10 dark:border-slate-700 dark:bg-slate-900/60"
                  />

                  {field.helper ? (
                    <p className="text-xs text-slate-500">
                      {field.helper}
                    </p>
                  ) : null}
                </div>
              ))}

              {/* ROLE */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Role
                </Label>

                <Select
                  value={form.teamRole}
                  onValueChange={(value: TeamRole) =>
                    setForm((current) => ({
                      ...current,
                      teamRole: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/60">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem
                        key={role.value}
                        value={role.value}
                      >
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* BUTTON */}
              <div className="md:col-span-2">
                <Button
                  className="h-12 rounded-2xl bg-gradient-to-r from-[#16A249] to-[#12813a] px-5 text-white transition-all hover:scale-[1.02] hover:shadow-green-500/40"
                  disabled={saving}
                  onClick={createMember}
                >
                  {saving
                    ? "Inviting..."
                    : "Invite Internal Member"}
                </Button>
              </div>

              {/* PASSWORD ALERT */}
              {temporaryPassword ? (
                <div className="rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 p-5 md:col-span-2">
                  <p className="text-sm font-medium text-amber-900">
                    Temporary Password
                  </p>

                  <p className="mt-2 text-lg font-bold tracking-wide text-amber-950">
                    {temporaryPassword}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ROLE PREVIEW */}
          <Card className="overflow-hidden rounded-[30px] border border-white/20 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80">
            <CardHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                {selectedRole.label} Permissions
              </CardTitle>

              <p className="text-sm text-slate-500">
                Access preview for selected role
              </p>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {selectedRole.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedRole.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded-full border border-[#16A249]/10 bg-[#16A249]/5 px-3 py-1.5 text-[11px] font-medium text-[#16A249] backdrop-blur"
                  >
                    {labelForPermission(permission)}
                  </span>
                ))}
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Internal Access Layer
                </p>

                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {selectedRole.value === "OWNER" ||
                  selectedRole.value === "ADMIN" ||
                  selectedRole.value === "ACCOUNT_MANAGER"
                    ? "Reseller Sub-admin"
                    : "Reseller Support"}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Platform compatibility is preserved while assigning
                  advanced reseller permission presets.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </ResellerShell>
);
}
